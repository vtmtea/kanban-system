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
	"gorm.io/gorm"
)

func clampCardPosition(position int, max int) int {
	if position < 0 {
		return 0
	}
	if position > max {
		return max
	}
	return position
}

func insertCardAt(cards []models.Card, card models.Card, position int) []models.Card {
	position = clampCardPosition(position, len(cards))

	reordered := make([]models.Card, 0, len(cards)+1)
	reordered = append(reordered, cards[:position]...)
	reordered = append(reordered, card)
	reordered = append(reordered, cards[position:]...)

	return reordered
}

func persistCardOrder(tx *gorm.DB, listID uint, cards []models.Card) error {
	for index, orderedCard := range cards {
		if orderedCard.ListID == listID && orderedCard.Position == index {
			continue
		}

		if err := tx.Model(&models.Card{}).
			Where("id = ?", orderedCard.ID).
			Updates(map[string]any{
				"list_id":  listID,
				"position": index,
			}).Error; err != nil {
			return err
		}
	}

	return nil
}

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
		ListID:   uint(listID),
		Title:    req.Title,
		Position: maxPosition + 1,
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

	// WebSocket 广播
	BroadcastToBoard(list.BoardID, "created", "card", card.ID, cardToAPI(card), userID)

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

	// WebSocket 广播
	database.DB.First(&list, card.ListID)
	BroadcastToBoard(list.BoardID, "updated", "card", card.ID, cardToAPI(card), userID)

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

	isSameListMove := card.ListID == uint(req.ListId)

	// 检查状态转移规则
	if !isSameListMove && !checkTransitionRule(card.ListID, uint(req.ListId), targetList.BoardID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This transition is not allowed"})
		return
	}

	// 检查目标列表的 WIP 限制
	if targetList.WipLimit != nil && !isSameListMove {
		var currentCount int64
		database.DB.Model(&models.Card{}).Where("list_id = ?", req.ListId).Count(&currentCount)
		if int(currentCount) >= *targetList.WipLimit {
			c.JSON(http.StatusBadRequest, gin.H{"error": "WIP limit reached for target list"})
			return
		}
	}

	oldListID := card.ListID
	targetListID := uint(req.ListId)

	if err := database.DB.Transaction(func(tx *gorm.DB) error {
		targetPosition := 0
		if req.Position != nil {
			targetPosition = *req.Position
		}

		if isSameListMove {
			var siblingCards []models.Card
			if err := tx.Where("list_id = ? AND id <> ?", card.ListID, card.ID).
				Order("position ASC").
				Find(&siblingCards).Error; err != nil {
				return err
			}

			targetPosition = clampCardPosition(targetPosition, len(siblingCards))
			reorderedCards := insertCardAt(siblingCards, card, targetPosition)
			return persistCardOrder(tx, card.ListID, reorderedCards)
		}

		var sourceCards []models.Card
		if err := tx.Where("list_id = ? AND id <> ?", oldListID, card.ID).
			Order("position ASC").
			Find(&sourceCards).Error; err != nil {
			return err
		}

		var targetCards []models.Card
		if err := tx.Where("list_id = ?", targetListID).
			Order("position ASC").
			Find(&targetCards).Error; err != nil {
			return err
		}

		targetPosition = clampCardPosition(targetPosition, len(targetCards))
		reorderedTargetCards := insertCardAt(targetCards, card, targetPosition)

		if err := persistCardOrder(tx, oldListID, sourceCards); err != nil {
			return err
		}

		return persistCardOrder(tx, targetListID, reorderedTargetCards)
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move card"})
		return
	}

	// 更新卡片历史
	if !isSameListMove {
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
	}

	// 自动指派
	if !isSameListMove {
		var assignment models.ListAutoAssignment
		if database.DB.Where("list_id = ?", req.ListId).Preload("User").First(&assignment).Error == nil {
			card.AssigneeID = &assignment.UserID
			database.DB.Save(&card)
		}
	}

	if err := database.DB.Preload("Assignee").First(&card, cardID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load moved card"})
		return
	}

	// 记录活动
	var oldList models.List
	database.DB.First(&oldList, oldListID)
	if isSameListMove {
		logActivity(uint(req.ListId), userID, "moved", "card", card.ID, "Reordered card in "+targetList.Title)
	} else {
		logActivity(uint(req.ListId), userID, "moved", "card", card.ID, "Moved card from "+oldList.Title+" to "+targetList.Title)
	}

	// WebSocket 广播
	BroadcastToBoard(targetList.BoardID, "moved", "card", card.ID, cardToAPI(card), userID)

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

	// WebSocket 广播
	var list models.List
	database.DB.First(&list, card.ListID)
	BroadcastToBoard(list.BoardID, "completed", "card", card.ID, cardToAPI(card), userID)

	c.JSON(http.StatusOK, cardToAPI(card))
}

// ReopenCard 重新打开卡片
func ReopenCard(c *gin.Context) {
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

	card.CompletedAt = nil

	if err := database.DB.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reopen card"})
		return
	}

	// 记录活动
	logActivity(card.ListID, userID, "reopened", "card", card.ID, "Reopened card: "+card.Title)

	// WebSocket 广播
	var list models.List
	database.DB.First(&list, card.ListID)
	BroadcastToBoard(list.BoardID, "reopened", "card", card.ID, cardToAPI(card), userID)

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

	// WebSocket 广播
	var list models.List
	database.DB.First(&list, card.ListID)
	BroadcastToBoard(list.BoardID, "assigned", "card", card.ID, cardToAPI(card), userID)

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

	// WebSocket 广播
	BroadcastToBoard(list.BoardID, "deleted", "card", card.ID, map[string]uint{"card_id": card.ID}, userID)

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
