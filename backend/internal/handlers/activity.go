package handlers

import (
	"net/http"
	"strconv"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetBoardActivities 获取看板活动日志
func GetBoardActivities(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	// 过滤参数
	entityType := c.Query("entity_type")
	action := c.Query("action")

	query := database.DB.Model(&models.Activity{}).Where("board_id = ?", boardID)
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if action != "" {
		query = query.Where("action = ?", action)
	}

	// 获取总数
	var total int64
	query.Count(&total)

	// 获取活动列表
	var activities []models.Activity
	query.Preload("User").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&activities)

	result := make([]api.Activity, len(activities))
	for i, activity := range activities {
		result[i] = *activityToAPI(activity)
	}

	c.JSON(http.StatusOK, api.ActivityListResponse{
		Data:  result,
		Total: int(total),
		Page:  page,
		Limit: limit,
	})
}

// GetCardActivities 获取卡片活动日志
func GetCardActivities(c *gin.Context) {
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	var activities []models.Activity
	database.DB.Where("entity_id = ? AND entity_type = ?", cardID, "card").
		Preload("User").
		Order("created_at DESC").
		Find(&activities)

	result := make([]api.Activity, len(activities))
	for i, activity := range activities {
		result[i] = *activityToAPI(activity)
	}

	c.JSON(http.StatusOK, result)
}

// logActivity 记录活动日志的辅助函数
func logActivity(listID uint, userID uint, action string, entityType string, entityID uint, content string) {
	var list models.List
	if database.DB.First(&list, listID).Error != nil {
		return
	}

	activity := models.Activity{
		BoardID:    list.BoardID,
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Content:    content,
	}

	database.DB.Create(&activity)

	// 触发 Webhook
	go triggerWebhooks(list.BoardID, action, entityType, entityID, content)
}

// logActivityByBoardID 通过 BoardID 记录活动日志
func logActivityByBoardID(boardID uint, userID uint, action string, entityType string, entityID uint, content string) {
	activity := models.Activity{
		BoardID:    boardID,
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Content:    content,
	}

	database.DB.Create(&activity)

	// 触发 Webhook
	go triggerWebhooks(boardID, action, entityType, entityID, content)
}

// triggerWebhooks 触发 Webhook（异步执行）
func triggerWebhooks(boardID uint, action string, entityType string, entityID uint, content string) {
	var webhooks []models.Webhook
	database.DB.Where("board_id = ? AND is_active = ?", boardID, true).Find(&webhooks)

	for _, webhook := range webhooks {
		go sendWebhook(webhook, action, entityType, entityID, content)
	}
}

// sendWebhook 发送 Webhook 请求
func sendWebhook(webhook models.Webhook, action string, entityType string, entityID uint, content string) {
	// TODO: 实现 HTTP 请求发送
	// 这里可以使用 http.Client 发送 POST 请求到 webhook.URL
	// 请求体包含事件详情
}

// checkBoardAccess 检查用户对看板的访问权限
func checkBoardAccess(listID uint, userID uint, minRole string) bool {
	var list models.List
	if database.DB.First(&list, listID).Error != nil {
		return false
	}

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", list.BoardID, userID).First(&member).Error != nil {
		return false
	}

	// 权限级别: owner > admin > member > observer
	roleLevel := map[string]int{
		"owner":    4,
		"admin":    3,
		"member":   2,
		"observer": 1,
	}

	return roleLevel[member.Role] >= roleLevel[minRole]
}