package routes

import (
	"kanban-system/backend/internal/handlers"
	"kanban-system/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// 中间件
	r.Use(middleware.CORS())

	// API路由组
	api := r.Group("/api")
	{
		// 健康检查
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		// 认证路由
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// 需要认证的路由
		protected := api.Group("")
		protected.Use(middleware.AuthRequired())
		{
			// 用户相关
			protected.GET("/user", handlers.GetCurrentUser)
			protected.PUT("/user", handlers.UpdateCurrentUser)

			// 看板相关
			protected.GET("/boards", handlers.GetBoards)
			protected.GET("/boards/:id", handlers.GetBoard)
			protected.POST("/boards", handlers.CreateBoard)
			protected.PUT("/boards/:id", handlers.UpdateBoard)
			protected.DELETE("/boards/:id", handlers.DeleteBoard)

			// 看板标签 - 使用 :id 保持一致
			protected.GET("/boards/:id/labels", handlers.GetLabels)
			protected.POST("/boards/:id/labels", handlers.CreateLabel)
			protected.DELETE("/labels/:id", handlers.DeleteLabel)

			// 列表相关 - 使用 :id 保持一致
			protected.GET("/boards/:id/lists", handlers.GetLists)
			protected.POST("/boards/:id/lists", handlers.CreateList)
			protected.PUT("/lists/:id", handlers.UpdateList)
			protected.DELETE("/lists/:id", handlers.DeleteList)

			// 卡片相关
			protected.GET("/cards/:id", handlers.GetCard)
			protected.POST("/lists/:id/cards", handlers.CreateCard)
			protected.PUT("/cards/:id", handlers.UpdateCard)
			protected.PUT("/cards/:id/move", handlers.MoveCard)
			protected.DELETE("/cards/:id", handlers.DeleteCard)

			// 卡片标签
			protected.POST("/cards/:id/labels/:label_id", handlers.AddLabelToCard)
			protected.DELETE("/cards/:id/labels/:label_id", handlers.RemoveLabelFromCard)

			// 评论相关
			protected.GET("/cards/:id/comments", handlers.GetComments)
			protected.POST("/cards/:id/comments", handlers.CreateComment)
			protected.DELETE("/comments/:id", handlers.DeleteComment)
		}
	}
}