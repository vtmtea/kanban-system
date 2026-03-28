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

// GetTransitionRules 获取看板的状态转移规则
func GetTransitionRules(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	var rules []models.ListTransitionRule
	database.DB.Where("board_id = ?", boardID).
		Preload("FromList").
		Preload("ToList").
		Find(&rules)

	result := make([]api.ListTransitionRule, len(rules))
	for i, rule := range rules {
		result[i] = *listTransitionRuleToAPI(rule)
	}

	c.JSON(http.StatusOK, result)
}

// CreateTransitionRule 创建状态转移规则
func CreateTransitionRule(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限 - 只有 owner/admin 可以创建
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to create transition rules"})
		return
	}

	var req api.CreateTransitionRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证列表属于该看板
	var fromList, toList models.List
	if database.DB.Where("id = ? AND board_id = ?", req.FromListId, boardID).First(&fromList).Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid from_list_id"})
		return
	}
	if database.DB.Where("id = ? AND board_id = ?", req.ToListId, boardID).First(&toList).Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid to_list_id"})
		return
	}

	// 检查是否已存在相同的规则
	var existingRule models.ListTransitionRule
	if database.DB.Where("board_id = ? AND from_list_id = ? AND to_list_id = ?", boardID, req.FromListId, req.ToListId).First(&existingRule).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This transition rule already exists"})
		return
	}

	rule := models.ListTransitionRule{
		BoardID:    uint(boardID),
		FromListID: uint(req.FromListId),
		ToListID:   uint(req.ToListId),
	}

	if err := database.DB.Create(&rule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transition rule"})
		return
	}

	database.DB.Preload("FromList").Preload("ToList").First(&rule, rule.ID)

	c.JSON(http.StatusCreated, listTransitionRuleToAPI(rule))
}

// DeleteTransitionRule 删除状态转移规则
func DeleteTransitionRule(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ruleID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rule ID"})
		return
	}

	var rule models.ListTransitionRule
	if err := database.DB.First(&rule, ruleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transition rule not found"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", rule.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this rule"})
		return
	}

	if err := database.DB.Delete(&rule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transition rule"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Transition rule deleted successfully"})
}