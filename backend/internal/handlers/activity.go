package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

var webhookHTTPClient = &http.Client{
	Timeout: 10 * time.Second,
}

type webhookPayload struct {
	Event       string    `json:"event"`
	WebhookID   uint      `json:"webhook_id"`
	BoardID     uint      `json:"board_id"`
	EntityType  string    `json:"entity_type"`
	Action      string    `json:"action"`
	EntityID    uint      `json:"entity_id"`
	Content     string    `json:"content"`
	IsTest      bool      `json:"is_test"`
	TriggeredAt time.Time `json:"triggered_at"`
}

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
	userID := middleware.GetUserID(c)
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	var card models.Card
	if err := database.DB.First(&card, cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	if !checkBoardAccess(card.ListID, userID, "member") {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this card"})
		return
	}

	var activities []models.Activity
	database.DB.
		Where("(entity_type = ? AND entity_id = ?)", "card", cardID).
		Or("(entity_type = ? AND entity_id IN (?))", "comment",
			database.DB.Model(&models.Comment{}).Select("id").Where("card_id = ?", cardID)).
		Or("(entity_type = ? AND entity_id IN (?))", "checklist_item",
			database.DB.Model(&models.ChecklistItem{}).Select("id").Where("card_id = ?", cardID)).
		Or("(entity_type = ? AND entity_id IN (?))", "attachment",
			database.DB.Model(&models.Attachment{}).Select("id").Where("card_id = ?", cardID)).
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
		go func(webhook models.Webhook) {
			if err := sendWebhook(webhook, action, entityType, entityID, content, false); err != nil {
				log.Printf("webhook delivery failed for webhook %d: %v", webhook.ID, err)
			}
		}(webhook)
	}
}

// sendWebhook 发送 Webhook 请求
func sendWebhook(webhook models.Webhook, action string, entityType string, entityID uint, content string, force bool) error {
	eventName := buildWebhookEventName(entityType, action)
	if !force && !webhookWantsEvent(webhook.Events, eventName) {
		return nil
	}

	payload := webhookPayload{
		Event:       eventName,
		WebhookID:   webhook.ID,
		BoardID:     webhook.BoardID,
		EntityType:  entityType,
		Action:      action,
		EntityID:    entityID,
		Content:     content,
		IsTest:      force,
		TriggeredAt: time.Now().UTC(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	url := strings.TrimSpace(webhook.URL)
	if url == "" {
		return fmt.Errorf("webhook URL is empty")
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "kanban-system-webhook/1.0")
	req.Header.Set("X-Kanban-Event", eventName)
	req.Header.Set("X-Kanban-Webhook-Id", strconv.FormatUint(uint64(webhook.ID), 10))
	req.Header.Set("X-Kanban-Board-Id", strconv.FormatUint(uint64(webhook.BoardID), 10))

	if webhook.Secret != "" {
		req.Header.Set("X-Kanban-Signature-256", buildWebhookSignature(body, webhook.Secret))
	}

	resp, err := webhookHTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		responseBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		if message := strings.TrimSpace(string(responseBody)); message != "" {
			return fmt.Errorf("received status %d: %s", resp.StatusCode, message)
		}
		return fmt.Errorf("received status %d", resp.StatusCode)
	}

	return nil
}

func buildWebhookEventName(entityType string, action string) string {
	if entityType == "checklist_item" && action == "completed" {
		return "checklist.completed"
	}

	return entityType + "." + action
}

func webhookWantsEvent(eventsJSON string, eventName string) bool {
	events := parseEvents(eventsJSON)
	for _, event := range events {
		if event == eventName {
			return true
		}
	}

	return false
}

func buildWebhookSignature(body []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
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
