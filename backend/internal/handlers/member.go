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

// GetBoardMembers 获取看板成员
func GetBoardMembers(c *gin.Context) {
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var members []models.BoardMember
	database.DB.Where("board_id = ?", boardID).
		Preload("User").
		Find(&members)

	result := make([]api.BoardMember, len(members))
	for i, member := range members {
		result[i] = *boardMemberToAPI(member)
	}

	c.JSON(http.StatusOK, result)
}

// AddBoardMember 添加看板成员
func AddBoardMember(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查操作者权限（只有 owner/admin 可以添加成员）
	var operatorMember models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&operatorMember).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to add members"})
		return
	}

	var req api.AddBoardMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查用户是否存在
	var user models.User
	if database.DB.First(&user, req.UserId).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 检查是否已经是成员
	var existingMember models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, req.UserId).First(&existingMember).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is already a member of this board"})
		return
	}

	role := "member"
	if req.Role != nil {
		role = string(*req.Role)
	}

	member := models.BoardMember{
		BoardID: uint(boardID),
		UserID:  uint(req.UserId),
		Role:    role,
	}

	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add member"})
		return
	}

	// 重新加载以获取关联数据
	database.DB.Preload("User").First(&member, member.ID)

	// 记录活动
	logActivityByBoardID(uint(boardID), userID, "added", "member", member.UserID, "Added member: "+user.Username)

	c.JSON(http.StatusCreated, boardMemberToAPI(member))
}

// UpdateBoardMemberRole 更新成员角色
func UpdateBoardMemberRole(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	targetUserID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 检查操作者权限
	var operatorMember models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&operatorMember).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update member roles"})
		return
	}

	// 不能修改 owner 的角色
	var targetMember models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, targetUserID).Preload("User").First(&targetMember).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	if targetMember.Role == "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot modify owner's role"})
		return
	}

	var req api.UpdateMemberRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetMember.Role = string(req.Role)

	if err := database.DB.Save(&targetMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update member role"})
		return
	}

	// 重新加载
	database.DB.Preload("User").First(&targetMember, targetMember.ID)

	c.JSON(http.StatusOK, boardMemberToAPI(targetMember))
}

// RemoveBoardMember 移除看板成员
func RemoveBoardMember(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	targetUserID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 检查操作者权限
	var operatorMember models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ? AND role IN ?", boardID, userID, []string{"owner", "admin"}).First(&operatorMember).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to remove members"})
		return
	}

	// 不能移除 owner
	var targetMember models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, targetUserID).First(&targetMember).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	if targetMember.Role == "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot remove the owner"})
		return
	}

	if err := database.DB.Delete(&targetMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Member removed successfully"})
}

// LeaveBoard 离开看板
func LeaveBoard(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "You are not a member of this board"})
		return
	}

	if member.Role == "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Owner cannot leave the board. Transfer ownership first."})
		return
	}

	if err := database.DB.Delete(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave board"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Left board successfully"})
}