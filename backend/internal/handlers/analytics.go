package handlers

import (
	"net/http"
	"strconv"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/database"
	"kanban-system/backend/internal/middleware"
	"kanban-system/backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetCFD 获取累积流图数据
func GetCFD(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	// 解析日期范围
	startDate := parseDate(c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02")))
	endDate := parseDate(c.DefaultQuery("end_date", time.Now().Format("2006-01-02")))

	// 获取看板的所有列表
	var lists []models.List
	database.DB.Where("board_id = ?", boardID).Order("position ASC").Find(&lists)

	// 获取每日各列表的卡片数量
	data := []api.CFDDataPoint{}
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		listCounts := make(map[string]int)
		for _, list := range lists {
			var count int64
			database.DB.Model(&models.Card{}).
				Joins("LEFT JOIN card_histories ON cards.id = card_histories.card_id").
				Where("cards.list_id = ? AND card_histories.entered_at <= ? AND (card_histories.exited_at IS NULL OR card_histories.exited_at > ?)", list.ID, endOfDay(d), endOfDay(d)).
				Count(&count)
			listCounts[list.Title] = int(count)
		}

		date := openapi_types.Date{Time: d}
		data = append(data, api.CFDDataPoint{
			Date:       date,
			ListCounts: listCounts,
		})
	}

	// 构建列表信息
	listInfos := make([]struct {
		Color *string `json:"color,omitempty"`
		Id    *int    `json:"id,omitempty"`
		Title *string `json:"title,omitempty"`
	}, len(lists))
	for i, list := range lists {
		id := int(list.ID)
		title := list.Title
		listInfos[i] = struct {
			Color *string `json:"color,omitempty"`
			Id    *int    `json:"id,omitempty"`
			Title *string `json:"title,omitempty"`
		}{
			Id:    &id,
			Title: &title,
		}
	}

	c.JSON(http.StatusOK, api.CFDResponse{
		Data:  data,
		Lists: listInfos,
	})
}

// GetCycleTime 获取周期时间统计
func GetCycleTime(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	startDate := parseDate(c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02")))
	endDate := parseDate(c.DefaultQuery("end_date", time.Now().Format("2006-01-02")))

	// 获取已完成的卡片
	var cards []models.Card
	database.DB.Where("completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?", startDate, endOfDay(endDate)).
		Where("list_id IN (SELECT id FROM lists WHERE board_id = ?)", boardID).
		Find(&cards)

	count := len(cards)
	if count == 0 {
		c.JSON(http.StatusOK, api.CycleTimeResponse{
			AverageCycleTime: 0,
			AverageLeadTime:  0,
			CardCount:        0,
		})
		return
	}

	var totalCycleTime, totalLeadTime float64
	for _, card := range cards {
		leadTime := card.CompletedAt.Sub(card.CreatedAt).Hours()
		totalLeadTime += leadTime

		var firstInProgress models.CardHistory
		if database.DB.Where("card_id = ? AND entered_at IS NOT NULL", card.ID).
			Order("entered_at ASC").
			First(&firstInProgress).Error == nil {
			cycleTime := card.CompletedAt.Sub(firstInProgress.EnteredAt).Hours()
			totalCycleTime += cycleTime
		} else {
			totalCycleTime += leadTime
		}
	}

	c.JSON(http.StatusOK, api.CycleTimeResponse{
		AverageCycleTime: float32(totalCycleTime / float64(count)),
		AverageLeadTime:  float32(totalLeadTime / float64(count)),
		CardCount:        count,
	})
}

// GetThroughput 获取吞吐率统计
func GetThroughput(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	startDate := parseDate(c.DefaultQuery("start_date", time.Now().AddDate(0, -1, 0).Format("2006-01-02")))
	endDate := parseDate(c.DefaultQuery("end_date", time.Now().Format("2006-01-02")))

	// 统计已完成的卡片数
	var totalCompleted int64
	database.DB.Model(&models.Card{}).
		Where("completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?", startDate, endOfDay(endDate)).
		Where("list_id IN (SELECT id FROM lists WHERE board_id = ?)", boardID).
		Count(&totalCompleted)

	// 计算每日平均
	days := int(endDate.Sub(startDate).Hours()/24) + 1
	if days < 1 {
		days = 1
	}
	dailyAverage := float32(float64(totalCompleted) / float64(days))

	// 按周统计
	weeklyData := make([]struct {
		Count     *int                `json:"count,omitempty"`
		WeekEnd   *openapi_types.Date `json:"week_end,omitempty"`
		WeekStart *openapi_types.Date `json:"week_start,omitempty"`
	}, 0)

	for weekStart := startDate; !weekStart.After(endDate); weekStart = weekStart.AddDate(0, 0, 7) {
		weekEnd := weekStart.AddDate(0, 0, 6)
		if weekEnd.After(endDate) {
			weekEnd = endDate
		}

		var count int64
		database.DB.Model(&models.Card{}).
			Where("completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ?", weekStart, endOfDay(weekEnd)).
			Where("list_id IN (SELECT id FROM lists WHERE board_id = ?)", boardID).
			Count(&count)

		startDateVal := openapi_types.Date{Time: weekStart}
		endDateVal := openapi_types.Date{Time: weekEnd}
		countVal := int(count)
		weeklyData = append(weeklyData, struct {
			Count     *int                `json:"count,omitempty"`
			WeekEnd   *openapi_types.Date `json:"week_end,omitempty"`
			WeekStart *openapi_types.Date `json:"week_start,omitempty"`
		}{
			WeekStart: &startDateVal,
			WeekEnd:   &endDateVal,
			Count:     &countVal,
		})
	}

	c.JSON(http.StatusOK, api.ThroughputResponse{
		TotalCompleted: int(totalCompleted),
		DailyAverage:   dailyAverage,
		WeeklyData:     &weeklyData,
	})
}

// GetWipStatus 获取看板 WIP 状态
func GetWipStatus(c *gin.Context) {
	userID := middleware.GetUserID(c)
	boardID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid board ID"})
		return
	}

	// 检查权限
	var member models.BoardMember
	if database.DB.Where("board_id = ? AND user_id = ?", boardID, userID).First(&member).Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this board"})
		return
	}

	// 获取所有列表及其 WIP 限制
	var lists []models.List
	database.DB.Where("board_id = ?", boardID).Order("position ASC").Find(&lists)

	result := []api.ListWipStatus{}
	for _, list := range lists {
		// 统计当前卡片数
		var currentCount int64
		database.DB.Model(&models.Card{}).Where("list_id = ?", list.ID).Count(&currentCount)

		// 检查是否超出限制
		isOverLimit := false
		if list.WipLimit != nil && int(currentCount) > *list.WipLimit {
			isOverLimit = true
		}

		result = append(result, api.ListWipStatus{
			ListId:       int(list.ID),
			ListTitle:    list.Title,
			WipLimit:     list.WipLimit,
			CurrentCount: int(currentCount),
			IsOverLimit:  isOverLimit,
		})
	}

	c.JSON(http.StatusOK, result)
}

// 辅助函数
func parseDate(dateStr string) time.Time {
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return time.Now()
	}
	return t
}

func endOfDay(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 0, t.Location())
}