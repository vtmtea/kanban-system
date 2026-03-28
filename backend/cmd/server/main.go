package main

import (
	"log"

	"kanban-system/backend/internal/config"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/models"
	"kanban-system/backend/internal/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 连接数据库
	if err := database.Connect(config.AppConfig); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 自动迁移数据库表结构
	if err := models.AutoMigrate(database.GetDB()); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 创建Gin引擎
	r := gin.Default()

	// 设置路由
	routes.SetupRoutes(r)

	// 启动服务器
	log.Printf("Server starting on port %s...", config.AppConfig.ServerPort)
	if err := r.Run(":" + config.AppConfig.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}