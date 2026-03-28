package handlers

import (
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/config"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetAttachments 获取卡片的附件
func GetAttachments(c *gin.Context) {
	cardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	var attachments []models.Attachment
	database.DB.Where("card_id = ?", cardID).
		Order("created_at DESC").
		Find(&attachments)

	result := make([]api.Attachment, len(attachments))
	for i, attachment := range attachments {
		result[i] = *attachmentToAPI(attachment)
	}

	c.JSON(http.StatusOK, result)
}

// UploadAttachment 上传附件
func UploadAttachment(c *gin.Context) {
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

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	defer file.Close()

	// 创建上传目录
	uploadDir := filepath.Join(config.AppConfig.UploadDir, time.Now().Format("2006/01/02"))
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// 生成唯一文件名
	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadDir, filename)

	// 创建目标文件
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file"})
		return
	}
	defer dst.Close()

	// 复制文件内容
	fileSize, err := io.Copy(dst, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// 获取相对路径用于URL
	relativePath := strings.TrimPrefix(filePath, config.AppConfig.UploadDir)
	fileURL := "/uploads" + relativePath

	attachment := models.Attachment{
		CardID:   uint(cardID),
		FileName: header.Filename,
		FileURL:  fileURL,
		FileSize: fileSize,
		MimeType: header.Header.Get("Content-Type"),
	}

	if err := database.DB.Create(&attachment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attachment record"})
		return
	}

	// 记录活动
	logActivity(card.ListID, userID, "uploaded", "attachment", attachment.ID, "Uploaded file: "+header.Filename)

	c.JSON(http.StatusCreated, attachmentToAPI(attachment))
}

// DeleteAttachment 删除附件
func DeleteAttachment(c *gin.Context) {
	userID := middleware.GetUserID(c)
	attachmentID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attachment ID"})
		return
	}

	var attachment models.Attachment
	if err := database.DB.First(&attachment, attachmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attachment not found"})
		return
	}

	// 检查权限
	if !checkBoardAccessByCardID(attachment.CardID, userID, "member") {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this attachment"})
		return
	}

	// 删除文件
	filePath := filepath.Join(config.AppConfig.UploadDir, strings.TrimPrefix(attachment.FileURL, "/uploads"))
	os.Remove(filePath)

	if err := database.DB.Delete(&attachment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete attachment"})
		return
	}

	c.JSON(http.StatusOK, api.MessageResponse{Message: "Attachment deleted successfully"})
}

// isImageType 检查是否是图片类型
func isImageType(contentType string) bool {
	imageTypes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
	for _, t := range imageTypes {
		if t == contentType {
			return true
		}
	}
	return false
}

// saveUploadedFile 保存上传的文件（辅助函数）
func saveUploadedFile(c *gin.Context, file *multipart.FileHeader, cardID uint) (string, error) {
	uploadDir := filepath.Join(config.AppConfig.UploadDir, "cards", time.Now().Format("2006/01/02"))
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", err
	}

	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", err
	}

	return filePath, nil
}