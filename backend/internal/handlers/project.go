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

// GetProjects 获取项目列表
func GetProjects(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var projects []models.Project
	if err := database.DB.
		Model(&models.Project{}).
		Distinct("projects.*").
		Joins("LEFT JOIN boards ON boards.project_id = projects.id AND boards.deleted_at IS NULL").
		Joins("LEFT JOIN board_members ON board_members.board_id = boards.id AND board_members.deleted_at IS NULL").
		Where("projects.owner_id = ? OR boards.owner_id = ? OR board_members.user_id = ?", userID, userID, userID).
		Preload("Owner").
		Preload("Boards", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Order("projects.created_at DESC").
		Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	result := make([]api.Project, len(projects))
	for i, project := range projects {
		result[i] = *projectToAPI(project)
	}

	c.JSON(http.StatusOK, result)
}

// GetProject 获取项目详情
func GetProject(c *gin.Context) {
	userID := middleware.GetUserID(c)
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var project models.Project
	if err := database.DB.
		Preload("Owner").
		Preload("Boards", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("Boards.Lists", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.OwnerID != userID {
		var count int64
		database.DB.
			Model(&models.Board{}).
			Joins("LEFT JOIN board_members ON board_members.board_id = boards.id AND board_members.deleted_at IS NULL").
			Where("boards.project_id = ? AND (boards.owner_id = ? OR board_members.user_id = ?)", project.ID, userID, userID).
			Count(&count)

		if count == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to view this project"})
			return
		}
	}

	c.JSON(http.StatusOK, projectToAPI(project))
}

// CreateProject 创建项目
func CreateProject(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req api.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project := models.Project{
		Title:    req.Title,
		OwnerID:  userID,
		Status:   "planning",
		Priority: "medium",
		Color:    "#0f4fe6",
	}

	if req.Description != nil {
		project.Description = *req.Description
	}
	if req.Color != nil && *req.Color != "" {
		project.Color = *req.Color
	}
	if req.StartDate != nil {
		project.StartDate = *req.StartDate
	}
	if req.TargetDate != nil {
		project.TargetDate = *req.TargetDate
	}
	if req.Status != nil && *req.Status != "" {
		project.Status = *req.Status
	}
	if req.Priority != nil && *req.Priority != "" {
		project.Priority = *req.Priority
	}

	if err := database.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	c.JSON(http.StatusCreated, projectToAPI(project))
}

// UpdateProject 更新项目
func UpdateProject(c *gin.Context) {
	userID := middleware.GetUserID(c)
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var project models.Project
	if err := database.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the owner can update the project"})
		return
	}

	var req api.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Title != nil {
		project.Title = *req.Title
	}
	if req.Description != nil {
		project.Description = *req.Description
	}
	if req.Color != nil {
		project.Color = *req.Color
	}
	if req.StartDate != nil {
		project.StartDate = *req.StartDate
	}
	if req.TargetDate != nil {
		project.TargetDate = *req.TargetDate
	}
	if req.Status != nil {
		project.Status = *req.Status
	}
	if req.Priority != nil {
		project.Priority = *req.Priority
	}

	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}

	c.JSON(http.StatusOK, projectToAPI(project))
}

// DeleteProject 删除项目
func DeleteProject(c *gin.Context) {
	userID := middleware.GetUserID(c)
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var project models.Project
	if err := database.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the owner can delete the project"})
		return
	}

	if err := database.DB.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Project deleted successfully"})
}
