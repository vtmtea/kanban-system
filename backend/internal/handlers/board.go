package handlers

import (
	"net/http"
	"strconv"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetBoards 获取用户的所有看板
func GetBoards(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var boards []models.Board
	database.DB.Where("owner_id = ?", userID).
		Or("id IN (SELECT board_id FROM board_members WHERE user_id = ?)", userID).
		Order("created_at DESC").
		Find(&boards)

	result := make([]api.Board, len(boards))
	for i, board := range boards {
		result[i] = *boardToAPI(board)
	}

	c.JSON(http.StatusOK, result)
}

// GetBoard 获取单个看板详情
func GetBoard(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var board models.Board
	if err := database.DB.Preload("Owner").
		Preload("Lists", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Preload("Lists.Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Preload("Lists.Cards.Labels").
		Preload("Members.User").
		First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	c.JSON(http.StatusOK, boardToAPI(board))
}

// CreateBoard 创建看板
func CreateBoard(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req api.CreateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	board := models.Board{
		Title:       req.Title,
		OwnerID:     userID,
	}

	if req.Description != nil {
		board.Description = *req.Description
	}
	if req.Color != nil {
		board.Color = *req.Color
	}
	if req.IsPublic != nil {
		board.IsPublic = *req.IsPublic
	}

	if err := database.DB.Create(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create board"})
		return
	}

	// 创建默认列表
	defaultLists := []string{"To Do", "In Progress", "Done"}
	for i, title := range defaultLists {
		list := models.List{
			BoardID:  board.ID,
			Title:    title,
			Position: i,
		}
		database.DB.Create(&list)
	}

	// 添加用户为看板成员
	member := models.BoardMember{
		BoardID: board.ID,
		UserID:  userID,
		Role:    "owner",
	}
	database.DB.Create(&member)

	c.JSON(http.StatusCreated, boardToAPI(board))
}

// UpdateBoard 更新看板
func UpdateBoard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var board models.Board
	if err := database.DB.First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	// 检查权限
	if board.OwnerID != userID {
		var member models.BoardMember
		if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this board"})
			return
		}
	}

	var req api.UpdateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != nil {
		board.Title = *req.Title
	}
	if req.Description != nil {
		board.Description = *req.Description
	}
	if req.Color != nil {
		board.Color = *req.Color
	}
	if req.IsPublic != nil {
		board.IsPublic = *req.IsPublic
	}

	if err := database.DB.Save(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update board"})
		return
	}

	c.JSON(http.StatusOK, boardToAPI(board))
}

// DeleteBoard 删除看板
func DeleteBoard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var board models.Board
	if err := database.DB.First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	// 只有owner可以删除看板
	if board.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the owner can delete the board"})
		return
	}

	if err := database.DB.Delete(&board).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete board"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Board deleted successfully"})
}