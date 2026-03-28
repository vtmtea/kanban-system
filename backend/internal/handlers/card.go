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

// GetCard 获取卡片详情
func GetCard(c *gin.Context) {
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	var card models.Card
	if err := database.DB.Preload("List").
		Preload("Labels").
		Preload("Comments.User").
		Preload("Attachments").
		First(&card, cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	c.JSON(http.StatusOK, cardToAPI(card))
}

// CreateCard 创建卡片
func CreateCard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	listID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid list ID"})
		return
	}

	var list models.List
	if err := database.DB.First(&list, listID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "List not found"})
		return
	}

	// 检查看板权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", list.BoardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	var req api.CreateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取最大position
	var maxPosition int
	database.DB.Model(&models.Card{}).Where("list_id = ?", listID).Select("COALESCE(MAX(position), -1)").Scan(&maxPosition)

	card := models.Card{
		ListID:   uint(listID),
		Title:    req.Title,
		Position: maxPosition + 1,
	}

	if req.Description != nil {
		card.Description = *req.Description
	}
	if req.DueDate != nil {
		card.DueDate = req.DueDate
	}
	if req.Cover != nil {
		card.Cover = *req.Cover
	}

	if err := database.DB.Create(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create card"})
		return
	}

	c.JSON(http.StatusCreated, cardToAPI(card))
}

// UpdateCard 更新卡片
func UpdateCard(c *gin.Context) {
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

	// 检查看板权限
	var list models.List
	database.DB.First(&list, card.ListID)

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", list.BoardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	var req api.UpdateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != nil {
		card.Title = *req.Title
	}
	if req.Description != nil {
		card.Description = *req.Description
	}
	if req.Position != nil {
		card.Position = *req.Position
	}
	if req.ListId != nil && *req.ListId > 0 {
		card.ListID = uint(*req.ListId)
	}
	card.DueDate = req.DueDate
	if req.Cover != nil {
		card.Cover = *req.Cover
	}

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update card"})
		return
	}

	c.JSON(http.StatusOK, cardToAPI(card))
}

// MoveCard 移动卡片到其他列表
func MoveCard(c *gin.Context) {
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

	var req api.MoveCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查目标列表权限
	var targetList models.List
	if err := database.DB.First(&targetList, req.ListId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target list not found"})
		return
	}

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", targetList.BoardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to the target board"})
		return
	}

	card.ListID = uint(req.ListId)
	if req.Position != nil {
		card.Position = *req.Position
	}

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move card"})
		return
	}

	c.JSON(http.StatusOK, cardToAPI(card))
}

// DeleteCard 删除卡片
func DeleteCard(c *gin.Context) {
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

	// 检查看板权限
	var list models.List
	database.DB.First(&list, card.ListID)

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", list.BoardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	if err := database.DB.Delete(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete card"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Card deleted successfully"})
}

// AddLabelToCard 添加标签到卡片
func AddLabelToCard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	labelID, err := strconv.ParseUint(c.Param("label_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid label ID"})
		return
	}

	var card models.Card
	if err := database.DB.First(&card, cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	var label models.Label
	if err := database.DB.First(&label, labelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Label not found"})
		return
	}

	// 检查权限
	var list models.List
	database.DB.First(&list, card.ListID)

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", list.BoardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	database.DB.Model(&card).Association("Labels").Append(&label)

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Label added successfully"})
}

// RemoveLabelFromCard 从卡片移除标签
func RemoveLabelFromCard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	labelID, err := strconv.ParseUint(c.Param("label_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid label ID"})
		return
	}

	var card models.Card
	if err := database.DB.First(&card, cardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	var label models.Label
	if err := database.DB.First(&label, labelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Label not found"})
		return
	}

	// 检查权限
	var list models.List
	database.DB.First(&list, card.ListID)

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", list.BoardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	database.DB.Model(&card).Association("Labels").Delete(&label)

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Label removed successfully"})
}