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

// CreateComment 创建评论
func CreateComment(c *gin.Context) {
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
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	var req api.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment := models.Comment{
		CardID:  uint(cardID),
		UserID:  userID,
		Content: req.Content,
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	// 加载用户信息
	database.DB.Preload("User").First(&comment, comment.ID)

	// 记录活动
	logActivity(card.ListID, userID, "created", "comment", comment.ID, "Added a comment")

	c.JSON(http.StatusCreated, commentToAPI(comment))
}

// GetComments 获取卡片的评论
func GetComments(c *gin.Context) {
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	var comments []models.Comment
	database.DB.Where("card_id = ?", cardID).
		Preload("User").
		Order("created_at DESC").
		Find(&comments)

	result := make([]api.Comment, len(comments))
	for i, comment := range comments {
		result[i] = *commentToAPI(comment)
	}

	c.JSON(http.StatusOK, result)
}

// UpdateComment 更新评论
func UpdateComment(c *gin.Context) {
	userID := middleware.GetUserID(c)
	commentID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	// 只有评论作者可以修改
	if comment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the author can update the comment"})
		return
	}

	var req api.UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Content != nil {
		comment.Content = *req.Content
	}

	if err := database.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	logActivityByCardID(comment.CardID, userID, "updated", "comment", comment.ID, "Updated a comment")

	// 加载用户信息
	database.DB.Preload("User").First(&comment, comment.ID)

	c.JSON(http.StatusOK, commentToAPI(comment))
}

// DeleteComment 删除评论
func DeleteComment(c *gin.Context) {
	userID := middleware.GetUserID(c)
	commentID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment ID"})
		return
	}

	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	// 只有评论作者可以删除
	if comment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the author can delete the comment"})
		return
	}

	if err := database.DB.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	logActivityByCardID(comment.CardID, userID, "deleted", "comment", comment.ID, "Deleted a comment")

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Comment deleted successfully"})
}
