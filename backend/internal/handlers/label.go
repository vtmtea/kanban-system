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

// GetLabels 获取看板的标签
func GetLabels(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var labels []models.Label
	database.DB.Where("board_id = ?", boardID).Find(&labels)

	result := make([]api.Label, len(labels))
	for i, label := range labels {
		result[i] = *labelToAPI(label)
	}

	c.JSON(http.StatusOK, result)
}

// CreateLabel 创建标签
func CreateLabel(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin", "member"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	var req api.CreateLabelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	label := models.Label{
		BoardID: uint(boardID),
		Name:    req.Name,
		Color:   req.Color,
	}

	if err := database.DB.Create(&label).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create label"})
		return
	}

	// 记录活动
	logActivityByBoardID(uint(boardID), userID, "created", "label", label.ID, "Created label: "+label.Name)

	c.JSON(http.StatusCreated, labelToAPI(label))
}

// UpdateLabel 更新标签
func UpdateLabel(c *gin.Context) {
	userID := middleware.GetUserID(c)
	labelID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid label ID"})
		return
	}

	var label models.Label
	if err := database.DB.First(&label, labelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Label not found"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", label.BoardID, userID, []string{"owner", "admin", "member"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this label"})
		return
	}

	var req api.UpdateLabelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != nil {
		label.Name = *req.Name
	}
	if req.Color != nil {
		label.Color = *req.Color
	}

	if err := database.DB.Save(&label).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update label"})
		return
	}

	// 记录活动
	logActivityByBoardID(label.BoardID, userID, "updated", "label", label.ID, "Updated label: "+label.Name)

	c.JSON(http.StatusOK, labelToAPI(label))
}

// DeleteLabel 删除标签
func DeleteLabel(c *gin.Context) {
	userID := middleware.GetUserID(c)
	labelID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid label ID"})
		return
	}

	var label models.Label
	if err := database.DB.First(&label, labelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Label not found"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", label.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this label"})
		return
	}

	// 记录活动
	logActivityByBoardID(label.BoardID, userID, "deleted", "label", label.ID, "Deleted label: "+label.Name)

	if err := database.DB.Delete(&label).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete label"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Label deleted successfully"})
}