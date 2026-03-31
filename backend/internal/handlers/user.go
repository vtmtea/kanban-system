package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetUsers 获取用户列表/搜索结果
func GetUsers(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	limit := 8

	if rawLimit := c.Query("limit"); rawLimit != "" {
		parsedLimit, err := strconv.Atoi(rawLimit)
		if err != nil || parsedLimit <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
			return
		}
		if parsedLimit > 25 {
			parsedLimit = 25
		}
		limit = parsedLimit
	}

	db := database.DB.Model(&models.User{})

	if query != "" {
		like := "%" + query + "%"
		db = db.Where("username LIKE ? OR nickname LIKE ? OR email LIKE ?", like, like, like)
	}

	if rawBoardID := c.Query("exclude_board_id"); rawBoardID != "" {
		boardID, err := strconv.ParseUint(rawBoardID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
			return
		}

		memberSubQuery := database.DB.Model(&models.BoardMember{}).
			Select("user_id").
			Where("board_id = ?", boardID)
		db = db.Where("id NOT IN (?)", memberSubQuery)
	}

	var users []models.User
	if err := db.
		Order("updated_at DESC").
		Order("id DESC").
		Limit(limit).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	result := make([]api.User, len(users))
	for i, user := range users {
		result[i] = *userToAPI(user)
	}

	c.JSON(http.StatusOK, result)
}
