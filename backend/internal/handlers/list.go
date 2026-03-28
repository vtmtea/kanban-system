package handlers

import (
	"net/http"
	"strconv"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetLists 获取看板的列表
func GetLists(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var lists []models.List
	database.DB.Where("board_id = ?", boardID).
		Order("position ASC").
		Preload("Cards", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC").Preload("Labels").Preload("Assignee").Preload("ChecklistItems")
		}).
		Find(&lists)

	result := make([]api.List, len(lists))
	for i, list := range lists {
		result[i] = *listToAPI(list)
	}

	c.JSON(http.StatusOK, result)
}

// CreateList 创建列表
func CreateList(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查看板权限
	var board models.Board
	if err := database.DB.First(&board, boardID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to create lists"})
		return
	}

	var req api.CreateListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取最大position
	var maxPosition int
	database.DB.Model(&models.List{}).Where("board_id = ?", boardID).Select("COALESCE(MAX(position), -1)").Scan(&maxPosition)

	list := models.List{
		BoardID:  uint(boardID),
		Title:    req.Title,
		Position: maxPosition + 1,
		WipLimit: req.WipLimit,
	}

	if err := database.DB.Create(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create list"})
		return
	}

	// 记录活动
	logActivityByBoardID(uint(boardID), userID, "created", "list", list.ID, "Created list: "+list.Title)

	c.JSON(http.StatusCreated, listToAPI(list))
}

// UpdateList 更新列表
func UpdateList(c *gin.Context) {
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
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", list.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this list"})
		return
	}

	var req api.UpdateListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != nil {
		list.Title = *req.Title
	}
	if req.Position != nil {
		list.Position = *req.Position
	}
	if req.WipLimit != nil {
		list.WipLimit = req.WipLimit
	}

	if err := database.DB.Save(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update list"})
		return
	}

	// 记录活动
	logActivityByBoardID(list.BoardID, userID, "updated", "list", list.ID, "Updated list: "+list.Title)

	c.JSON(http.StatusOK, listToAPI(list))
}

// DeleteList 删除列表
func DeleteList(c *gin.Context) {
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
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", list.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete this list"})
		return
	}

	if err := database.DB.Delete(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete list"})
		return
	}

	// 记录活动
	logActivityByBoardID(list.BoardID, userID, "deleted", "list", list.ID, "Deleted list: "+list.Title)

	c.JSON(http.StatusOK, api.MessageResponse{Message: "List deleted successfully"})
}

// GetAutoAssignments 获取列的自动指派配置
func GetAutoAssignments(c *gin.Context) {
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

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", list.BoardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this list"})
		return
	}

	var assignments []models.ListAutoAssignment
	database.DB.Where("list_id = ?", listID).Preload("User").Find(&assignments)

	result := make([]api.ListAutoAssignment, len(assignments))
	for i, a := range assignments {
		result[i] = *listAutoAssignmentToAPI(a)
	}

	c.JSON(http.StatusOK, result)
}

// SetAutoAssignment 设置列的自动指派
func SetAutoAssignment(c *gin.Context) {
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

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", list.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to set auto assignment"})
		return
	}

	var req api.SetAutoAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 删除现有配置
	database.DB.Where("list_id = ?", listID).Delete(&models.ListAutoAssignment{})

	// 创建新配置
	assignment := models.ListAutoAssignment{
		ListID: uint(listID),
		UserID: uint(req.UserId),
	}

	if err := database.DB.Create(&assignment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set auto assignment"})
		return
	}

	database.DB.Preload("User").First(&assignment, assignment.ID)

	c.JSON(http.StatusCreated, listAutoAssignmentToAPI(assignment))
}

// DeleteAutoAssignment 删除列的自动指派
func DeleteAutoAssignment(c *gin.Context) {
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

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", list.BoardID, userID, []string{"owner", "admin"}).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to delete auto assignment"})
		return
	}

	database.DB.Where("list_id = ?", listID).Delete(&models.ListAutoAssignment{})

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Auto assignment deleted successfully"})
}