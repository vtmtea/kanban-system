package routes

import (
	"kanban-system/backend/internal/handlers"
	"kanban-system/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// 中间件
	r.Use(middleware.CORS())

	// 静态文件服务 - 上传的文件
	r.Static("/uploads", "./uploads")

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

			// 看板 WIP 状态
			protected.GET("/boards/:id/wip-status", handlers.GetWipStatus)

			// 泳道相关
			protected.GET("/boards/:id/swimlanes", handlers.GetSwimlanes)
			protected.POST("/boards/:id/swimlanes", handlers.CreateSwimlane)
			protected.PUT("/swimlanes/:id", handlers.UpdateSwimlane)
			protected.DELETE("/swimlanes/:id", handlers.DeleteSwimlane)

			// 列表相关
			protected.GET("/boards/:id/lists", handlers.GetLists)
			protected.POST("/boards/:id/lists", handlers.CreateList)
			protected.PUT("/lists/:id", handlers.UpdateList)
			protected.DELETE("/lists/:id", handlers.DeleteList)

			// 列自动指派
			protected.GET("/lists/:id/auto-assignments", handlers.GetAutoAssignments)
			protected.POST("/lists/:id/auto-assignments", handlers.SetAutoAssignment)
			protected.DELETE("/lists/:id/auto-assignments", handlers.DeleteAutoAssignment)

			// 状态转移规则
			protected.GET("/boards/:id/transition-rules", handlers.GetTransitionRules)
			protected.POST("/boards/:id/transition-rules", handlers.CreateTransitionRule)
			protected.DELETE("/transition-rules/:id", handlers.DeleteTransitionRule)

			// 卡片相关
			protected.GET("/cards/:id", handlers.GetCard)
			protected.POST("/lists/:id/cards", handlers.CreateCard)
			protected.PUT("/cards/:id", handlers.UpdateCard)
			protected.PUT("/cards/:id/move", handlers.MoveCard)
			protected.PUT("/cards/:id/complete", handlers.CompleteCard)
			protected.PUT("/cards/:id/assign", handlers.AssignCard)
			protected.DELETE("/cards/:id", handlers.DeleteCard)

			// 卡片标签
			protected.POST("/cards/:id/labels/:label_id", handlers.AddLabelToCard)
			protected.DELETE("/cards/:id/labels/:label_id", handlers.RemoveLabelFromCard)

			// 检查清单
			protected.GET("/cards/:id/checklist", handlers.GetChecklist)
			protected.POST("/cards/:id/checklist", handlers.CreateChecklistItem)
			protected.PUT("/checklist/:id", handlers.UpdateChecklistItem)
			protected.DELETE("/checklist/:id", handlers.DeleteChecklistItem)

			// 评论相关
			protected.GET("/cards/:id/comments", handlers.GetComments)
			protected.POST("/cards/:id/comments", handlers.CreateComment)
			protected.PUT("/comments/:id", handlers.UpdateComment)
			protected.DELETE("/comments/:id", handlers.DeleteComment)

			// 标签相关
			protected.GET("/boards/:id/labels", handlers.GetLabels)
			protected.POST("/boards/:id/labels", handlers.CreateLabel)
			protected.PUT("/labels/:id", handlers.UpdateLabel)
			protected.DELETE("/labels/:id", handlers.DeleteLabel)

			// 附件相关
			protected.GET("/cards/:id/attachments", handlers.GetAttachments)
			protected.POST("/cards/:id/attachments", handlers.UploadAttachment)
			protected.DELETE("/attachments/:id", handlers.DeleteAttachment)

			// 成员相关
			protected.GET("/boards/:id/members", handlers.GetBoardMembers)
			protected.POST("/boards/:id/members", handlers.AddBoardMember)
			protected.PUT("/boards/:id/members/:user_id", handlers.UpdateBoardMemberRole)
			protected.DELETE("/boards/:id/members/:user_id", handlers.RemoveBoardMember)
			protected.POST("/boards/:id/leave", handlers.LeaveBoard)

			// 活动日志
			protected.GET("/boards/:id/activities", handlers.GetBoardActivities)
			protected.GET("/cards/:id/activities", handlers.GetCardActivities)

			// Webhook
			protected.GET("/boards/:id/webhooks", handlers.GetWebhooks)
			protected.POST("/boards/:id/webhooks", handlers.CreateWebhook)
			protected.PUT("/webhooks/:id", handlers.UpdateWebhook)
			protected.DELETE("/webhooks/:id", handlers.DeleteWebhook)
			protected.POST("/webhooks/:id/test", handlers.TestWebhook)

			// 数据分析
			protected.GET("/boards/:id/analytics/cfd", handlers.GetCFD)
			protected.GET("/boards/:id/analytics/cycle-time", handlers.GetCycleTime)
			protected.GET("/boards/:id/analytics/throughput", handlers.GetThroughput)

			// WebSocket 在线用户
			protected.GET("/boards/:id/online-users", handlers.GetBoardOnlineUsers)
		}

		// WebSocket 连接（需要 token 查询参数）
		api.GET("/ws/boards/:id", handlers.HandleWebSocket)
	}
}