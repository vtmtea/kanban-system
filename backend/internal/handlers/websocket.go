package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"

	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源，生产环境应该限制
	},
}

// BoardRoom 看板房间，管理连接
type BoardRoom struct {
	boardID   uint
	clients   map[*websocket.Conn]uint // connection -> userID
	broadcast chan WebSocketMessage
	mu        sync.RWMutex
}

// WebSocketMessage WebSocket 消息格式
type WebSocketMessage struct {
	Type      string      `json:"type"`       // created, updated, deleted, moved
	EntityType string      `json:"entity_type"` // board, list, card, comment
	EntityID   uint        `json:"entity_id"`
	Data       interface{} `json:"data,omitempty"`
	UserID     uint        `json:"user_id"`
	BoardID    uint        `json:"board_id"`
}

// WebSocketManager WebSocket 管理器
type WebSocketManager struct {
	rooms map[uint]*BoardRoom // boardID -> room
	mu    sync.RWMutex
}

var wsManager = &WebSocketManager{
	rooms: make(map[uint]*BoardRoom),
}

// GetOrCreateRoom 获取或创建房间
func (m *WebSocketManager) GetOrCreateRoom(boardID uint) *BoardRoom {
	m.mu.Lock()
	defer m.mu.Unlock()

	room, exists := m.rooms[boardID]
	if !exists {
		room = &BoardRoom{
			boardID:   boardID,
			clients:   make(map[*websocket.Conn]uint),
			broadcast: make(chan WebSocketMessage, 100),
		}
		m.rooms[boardID] = room
		go room.run()
	}
	return room
}

// RemoveRoom 移除房间
func (m *WebSocketManager) RemoveRoom(boardID uint) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.rooms, boardID)
}

// BroadcastToBoard 向看板广播消息
func BroadcastToBoard(boardID uint, msgType string, entityType string, entityID uint, data interface{}, userID uint) {
	msg := WebSocketMessage{
		Type:       msgType,
		EntityType: entityType,
		EntityID:   entityID,
		Data:       data,
		UserID:     userID,
		BoardID:    boardID,
	}

	wsManager.mu.RLock()
	room, exists := wsManager.rooms[boardID]
	wsManager.mu.RUnlock()

	if exists {
		select {
		case room.broadcast <- msg:
		default:
			// 通道满，跳过
		}
	}
}

// run 运行房间
func (r *BoardRoom) run() {
	for msg := range r.broadcast {
		r.mu.RLock()
		for conn := range r.clients {
			err := conn.WriteJSON(msg)
			if err != nil {
				log.Printf("WebSocket write error: %v", err)
				conn.Close()
				r.mu.RUnlock()
				r.mu.Lock()
				delete(r.clients, conn)
				r.mu.Unlock()
				r.mu.RLock()
			}
		}
		r.mu.RUnlock()
	}
}

// AddClient 添加客户端
func (r *BoardRoom) AddClient(conn *websocket.Conn, userID uint) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.clients[conn] = userID
}

// RemoveClient 移除客户端
func (r *BoardRoom) RemoveClient(conn *websocket.Conn) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.clients, conn)

	// 如果房间为空，关闭房间
	if len(r.clients) == 0 {
		close(r.broadcast)
		wsManager.RemoveRoom(r.boardID)
	}
}

// GetClientCount 获取客户端数量
func (r *BoardRoom) GetClientCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.clients)
}

// HandleWebSocket WebSocket 处理器
func HandleWebSocket(c *gin.Context) {
	// 获取看板 ID
	boardIDStr := c.Param("id")
	boardID, err := strconv.ParseUint(boardIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 从查询参数获取 token
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
		return
	}

	// 验证 token
	claims, err := middleware.ParseToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	userID := claims.UserID

	// 检查用户是否有权限访问该看板
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No access to this board"})
		return
	}

	// 升级 HTTP 连接为 WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// 获取或创建房间
	room := wsManager.GetOrCreateRoom(uint(boardID))
	room.AddClient(conn, userID)

	log.Printf("WebSocket connected: board=%d, user=%d, clients=%d", boardID, userID, room.GetClientCount())

	// 发送连接成功消息
	conn.WriteJSON(WebSocketMessage{
		Type:    "connected",
		BoardID: uint(boardID),
		UserID:  userID,
	})

	// 读取消息循环
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		// 处理客户端消息（心跳等）
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err == nil {
			if msg["type"] == "ping" {
				conn.WriteJSON(map[string]string{"type": "pong"})
			}
		}
	}

	// 清理连接
	room.RemoveClient(conn)
	log.Printf("WebSocket disconnected: board=%d, user=%d", boardID, userID)
}

// GetBoardOnlineUsers 获取看板在线用户
func GetBoardOnlineUsers(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	wsManager.mu.RLock()
	room, exists := wsManager.rooms[uint(boardID)]
	wsManager.mu.RUnlock()

	if !exists {
		c.JSON(http.StatusOK, gin.H{
			"online_count": 0,
			"users":        []uint{},
		})
		return
	}

	room.mu.RLock()
	defer room.mu.RUnlock()

	userSet := make(map[uint]bool)
	for _, userID := range room.clients {
		userSet[userID] = true
	}

	users := make([]uint, 0, len(userSet))
	for userID := range userSet {
		users = append(users, userID)
	}

	c.JSON(http.StatusOK, gin.H{
		"online_count": len(users),
		"users":        users,
	})
}