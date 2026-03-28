package handlers

import (
	"net/http"
	"strconv"
	"time"

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
		Preload("Swimlane").
		Preload("Labels").
		Preload("Comments.User").
		Preload("Attachments").
		Preload("ChecklistItems").
		Preload("Assignee").
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

	// 检查 WIP 限制
	if list.WipLimit != nil {
		var currentCount int64
		database.DB.Model(&models.Card{}).Where("list_id = ?", listID).Count(&currentCount)
		if int(currentCount) >= *list.WipLimit {
			c.JSON(http.StatusBadRequest, gin.H{"error": "WIP limit reached for this list"})
			return
		}
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
		ListID:     uint(listID),
		Title:      req.Title,
		Position:   maxPosition + 1,
	}
	if req.SwimlaneId != nil {
		swimlaneID := uint(*req.SwimlaneId)
		card.SwimlaneID = &swimlaneID
	}
	if req.AssigneeId != nil {
		assigneeID := uint(*req.AssigneeId)
		card.AssigneeID = &assigneeID
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

	// 记录卡片历史
	cardHistory := models.CardHistory{
		CardID:    card.ID,
		ListID:    uint(listID),
		EnteredAt: time.Now(),
	}
	database.DB.Create(&cardHistory)

	// 记录活动
	logActivity(uint(listID), userID, "created", "card", card.ID, "Created card: "+card.Title)

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
	if req.SwimlaneId != nil {
		swimlaneID := uint(*req.SwimlaneId)
		card.SwimlaneID = &swimlaneID
	}
	if req.AssigneeId != nil {
		assigneeID := uint(*req.AssigneeId)
		card.AssigneeID = &assigneeID
	}

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update card"})
		return
	}

	// 记录活动
	logActivity(card.ListID, userID, "updated", "card", card.ID, "Updated card: "+card.Title)

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

	// 检查状态转移规则
	if !checkTransitionRule(card.ListID, uint(req.ListId), targetList.BoardID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This transition is not allowed"})
		return
	}

	// 检查目标列表的 WIP 限制
	if targetList.WipLimit != nil && card.ListID != uint(req.ListId) {
		var currentCount int64
		database.DB.Model(&models.Card{}).Where("list_id = ?", req.ListId).Count(&currentCount)
		if int(currentCount) >= *targetList.WipLimit {
			c.JSON(http.StatusBadRequest, gin.H{"error": "WIP limit reached for target list"})
			return
		}
	}

	oldListID := card.ListID
	card.ListID = uint(req.ListId)
	if req.Position != nil {
		card.Position = *req.Position
	}

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move card"})
		return
	}

	// 更新卡片历史
	var oldHistory models.CardHistory
	if database.DB.Where("card_id = ? AND exited_at IS NULL", cardID).First(&oldHistory).Error == nil {
		now := time.Now()
		oldHistory.ExitedAt = &now
		database.DB.Save(&oldHistory)
	}

	newHistory := models.CardHistory{
		CardID:    card.ID,
		ListID:    uint(req.ListId),
		EnteredAt: time.Now(),
	}
	database.DB.Create(&newHistory)

	// 自动指派
	var assignment models.ListAutoAssignment
	if database.DB.Where("list_id = ?", req.ListId).Preload("User").First(&assignment).Error == nil {
		card.AssigneeID = &assignment.UserID
		database.DB.Save(&card)
	}

	// 记录活动
	var oldList models.List
	database.DB.First(&oldList, oldListID)
	logActivity(uint(req.ListId), userID, "moved", "card", card.ID, "Moved card from "+oldList.Title+" to "+targetList.Title)

	c.JSON(http.StatusOK, cardToAPI(card))
}

// CompleteCard 完成卡片
func CompleteCard(c *gin.Context) {
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

	now := time.Now()
	card.CompletedAt = &now

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete card"})
		return
	}

	// 记录活动
	logActivity(card.ListID, userID, "completed", "card", card.ID, "Completed card: "+card.Title)

	c.JSON(http.StatusOK, cardToAPI(card))
}

// AssignCard 指派卡片
func AssignCard(c *gin.Context) {
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

	var req api.AssignCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.AssigneeId != nil {
		assigneeID := uint(*req.AssigneeId)
		card.AssigneeID = &assigneeID
	} else {
		card.AssigneeID = nil
	}

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign card"})
		return
	}

	// 记录活动
	var assigneeName string = "Unassigned"
	if req.AssigneeId != nil {
		var user models.User
		if database.DB.First(&user, *req.AssigneeId).Error == nil {
			assigneeName = user.Username
		}
	}
	logActivity(card.ListID, userID, "assigned", "card", card.ID, "Assigned to: "+assigneeName)

	database.DB.Preload("Assignee").First(&card, card.ID)

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

	// 记录活动
	logActivity(card.ListID, userID, "deleted", "card", card.ID, "Deleted card: "+card.Title)

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
	if !checkBoardAccess(card.ListID, userID, "member") {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	database.DB.Model(&card).Association("Labels").Append(&label)

	// 记录活动
	logActivity(card.ListID, userID, "added_label", "card", card.ID, "Added label: "+label.Name)

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
	if !checkBoardAccess(card.ListID, userID, "member") {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	database.DB.Model(&card).Association("Labels").Delete(&label)

	// 记录活动
	logActivity(card.ListID, userID, "removed_label", "card", card.ID, "Removed label: "+label.Name)

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Label removed successfully"})
}

// checkTransitionRule 检查状态转移是否允许
func checkTransitionRule(fromListID, toListID, boardID uint) bool {
	// 如果没有配置任何规则，则允许所有转移
	var rules []models.ListTransitionRule
	database.DB.Where("board_id = ?", boardID).Find(&rules)

	if len(rules) == 0 {
		return true
	}

	// 检查是否有匹配的规则
	for _, rule := range rules {
		if rule.FromListID == fromListID && rule.ToListID == toListID {
			return true
		}
	}

	return false
}