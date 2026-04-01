package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetWebhooks 获取看板的 Webhook 配置
func GetWebhooks(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to view webhooks"})
		return
	}

	var webhooks []models.Webhook
	database.DB.Where("board_id = ?", boardID).Find(&webhooks)

	result := make([]api.Webhook, len(webhooks))
	for i, webhook := range webhooks {
		result[i] = *webhookToAPI(webhook)
	}

	c.JSON(http.StatusOK, result)
}

// CreateWebhook 创建 Webhook
func CreateWebhook(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to create webhooks"})
		return
	}

	var req api.CreateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 将 events 转为 JSON 字符串
	eventsJSON, _ := json.Marshal(req.Events)

	webhook := models.Webhook{
		BoardID:  uint(boardID),
		URL:      req.Url,
		Events:   string(eventsJSON),
		Secret:   stringOrEmpty(req.Secret),
		IsActive: true,
	}

	if err := database.DB.Create(&webhook).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create webhook"})
		return
	}

	c.JSON(http.StatusCreated, webhookToAPI(webhook))
}

// UpdateWebhook 更新 Webhook
func UpdateWebhook(c *gin.Context) {
	userID := middleware.GetUserID(c)
	webhookID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook ID"})
		return
	}

	var webhook models.Webhook
	if database.DB.First(&webhook, webhookID).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Webhook not found"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", webhook.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this webhook"})
		return
	}

	var req api.UpdateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Url != nil {
		webhook.URL = *req.Url
	}
	if req.Events != nil {
		eventsJSON, _ := json.Marshal(req.Events)
		webhook.Events = string(eventsJSON)
	}
	if req.IsActive != nil {
		webhook.IsActive = *req.IsActive
	}
	if req.Secret != nil {
		webhook.Secret = *req.Secret
	}

	if err := database.DB.Save(&webhook).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update webhook"})
		return
	}

	c.JSON(http.StatusOK, webhookToAPI(webhook))
}

// DeleteWebhook 删除 Webhook
func DeleteWebhook(c *gin.Context) {
	userID := middleware.GetUserID(c)
	webhookID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook ID"})
		return
	}

	var webhook models.Webhook
	if database.DB.First(&webhook, webhookID).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Webhook not found"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", webhook.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this webhook"})
		return
	}

	if err := database.DB.Delete(&webhook).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete webhook"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Webhook deleted successfully"})
}

// TestWebhook 测试 Webhook
func TestWebhook(c *gin.Context) {
	userID := middleware.GetUserID(c)
	webhookID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook ID"})
		return
	}

	var webhook models.Webhook
	if database.DB.First(&webhook, webhookID).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Webhook not found"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", webhook.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to test this webhook"})
		return
	}

	if err := sendWebhook(webhook, "test", "webhook", webhook.ID, "Webhook test", true); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deliver test webhook: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Test webhook delivered"})
}

func stringOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
