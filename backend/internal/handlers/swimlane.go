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

// GetSwimlanes 获取看板的泳道
func GetSwimlanes(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var swimlanes []models.Swimlane
	database.DB.Where("board_id = ?", boardID).
		Order("position ASC").
		Find(&swimlanes)

	result := make([]api.Swimlane, len(swimlanes))
	for i, swimlane := range swimlanes {
		result[i] = *swimlaneToAPI(swimlane)
	}

	c.JSON(http.StatusOK, result)
}

// CreateSwimlane 创建泳道
func CreateSwimlane(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查看板权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to create swimlanes"})
		return
	}

	var req api.CreateSwimlaneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取最大position
	var maxPosition int
	database.DB.Model(&models.Swimlane{}).Where("board_id = ?", boardID).Select("COALESCE(MAX(position), -1)").Scan(&maxPosition)

	swimlane := models.Swimlane{
		BoardID:  uint(boardID),
		Name:     req.Name,
		Position: maxPosition + 1,
	}
	if req.Color != nil {
		swimlane.Color = *req.Color
	}

	if err := database.DB.Create(&swimlane).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create swimlane"})
		return
	}

	c.JSON(http.StatusCreated, swimlaneToAPI(swimlane))
}

// UpdateSwimlane 更新泳道
func UpdateSwimlane(c *gin.Context) {
	userID := middleware.GetUserID(c)
	swimlaneID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid swimlane ID"})
		return
	}

	var swimlane models.Swimlane
	if err := database.DB.First(&swimlane, swimlaneID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Swimlane not found"})
		return
	}

	// 检查看板权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", swimlane.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this swimlane"})
		return
	}

	var req api.UpdateSwimlaneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != nil {
		swimlane.Name = *req.Name
	}
	if req.Position != nil {
		swimlane.Position = *req.Position
	}
	if req.Color != nil {
		swimlane.Color = *req.Color
	}

	if err := database.DB.Save(&swimlane).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update swimlane"})
		return
	}

	c.JSON(http.StatusOK, swimlaneToAPI(swimlane))
}

// DeleteSwimlane 删除泳道
func DeleteSwimlane(c *gin.Context) {
	userID := middleware.GetUserID(c)
	swimlaneID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid swimlane ID"})
		return
	}

	var swimlane models.Swimlane
	if err := database.DB.First(&swimlane, swimlaneID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Swimlane not found"})
		return
	}

	// 检查看板权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", swimlane.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this swimlane"})
		return
	}

	if err := database.DB.Delete(&swimlane).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete swimlane"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Swimlane deleted successfully"})
}