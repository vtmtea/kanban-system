package handlers

import (
	"net/http"
	"strconv"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetChecklist 获取卡片的检查清单
func GetChecklist(c *gin.Context) {
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	var items []models.ChecklistItem
	database.DB.Where("card_id = ?", cardID).
		Order("position ASC").
		Find(&items)

	result := make([]api.ChecklistItem, len(items))
	for i, item := range items {
		result[i] = *checklistItemToAPI(item)
	}

	c.JSON(http.StatusOK, result)
}

// CreateChecklistItem 创建检查清单项
func CreateChecklistItem(c *gin.Context) {
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

	// 检查权限
	if !checkBoardAccess(card.ListID, userID, "member") {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this card"})
		return
	}

	var req api.CreateChecklistItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取最大position
	var maxPosition int
	database.DB.Model(&models.ChecklistItem{}).Where("card_id = ?", cardID).Select("COALESCE(MAX(position), -1)").Scan(&maxPosition)

	item := models.ChecklistItem{
		CardID:    uint(cardID),
		Content:   req.Content,
		Position:  maxPosition + 1,
		Completed: false,
	}

	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create checklist item"})
		return
	}

	// 记录活动
	logActivity(card.ListID, userID, "created", "checklist_item", item.ID, "Created checklist item: "+item.Content)

	c.JSON(http.StatusCreated, checklistItemToAPI(item))
}

// UpdateChecklistItem 更新检查清单项
func UpdateChecklistItem(c *gin.Context) {
	userID := middleware.GetUserID(c)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid checklist item ID"})
		return
	}

	var item models.ChecklistItem
	if err := database.DB.First(&item, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Checklist item not found"})
		return
	}

	// 检查权限
	if !checkBoardAccessByCardID(item.CardID, userID, "member") {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this checklist item"})
		return
	}

	var req api.UpdateChecklistItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Content != nil {
		item.Content = *req.Content
	}
	if req.Completed != nil {
		item.Completed = *req.Completed
	}
	if req.Position != nil {
		item.Position = *req.Position
	}

	if err := database.DB.Save(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update checklist item"})
		return
	}

	// 记录活动
	if item.Completed {
		logActivityByCardID(item.CardID, userID, "completed", "checklist_item", item.ID, "Completed: "+item.Content)
	}

	c.JSON(http.StatusOK, checklistItemToAPI(item))
}

// DeleteChecklistItem 删除检查清单项
func DeleteChecklistItem(c *gin.Context) {
	userID := middleware.GetUserID(c)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid checklist item ID"})
		return
	}

	var item models.ChecklistItem
	if err := database.DB.First(&item, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Checklist item not found"})
		return
	}

	// 检查权限
	if !checkBoardAccessByCardID(item.CardID, userID, "member") {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this checklist item"})
		return
	}

	if err := database.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete checklist item"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Checklist item deleted successfully"})
}

// 辅助函数：通过卡片ID检查权限
func checkBoardAccessByCardID(cardID uint, userID uint, minRole string) bool {
	var card models.Card
	if database.DB.First(&card, cardID).Error != nil {
		return false
	}
	return checkBoardAccess(card.ListID, userID, minRole)
}

// 辅助函数：通过卡片ID记录活动
func logActivityByCardID(cardID uint, userID uint, action string, entityType string, entityID uint, content string) {
	var card models.Card
	if database.DB.First(&card, cardID).Error != nil {
		return
	}
	logActivity(card.ListID, userID, action, entityType, entityID, content)
}