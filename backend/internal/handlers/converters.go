package handlers

import (
	"encoding/json"
	"strings"

	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/models"
)

// projectToAPI 将 models.Project 转换为 api.Project
func projectToAPI(project models.Project) *api.Project {
	p := &api.Project{
		Id:          int(project.ID),
		Title:       project.Title,
		Description: &project.Description,
		OwnerId:     int(project.OwnerID),
		Color:       &project.Color,
		StartDate:   &project.StartDate,
		TargetDate:  &project.TargetDate,
		Status:      &project.Status,
		Priority:    &project.Priority,
		CreatedAt:   &project.CreatedAt,
		UpdatedAt:   &project.UpdatedAt,
	}

	if project.Owner != nil {
		p.Owner = userToAPI(*project.Owner)
	}

	if len(project.Boards) > 0 {
		boards := make([]api.Board, len(project.Boards))
		for i, board := range project.Boards {
			boards[i] = *boardToAPI(board)
		}
		p.Boards = &boards
	}

	return p
}

// boardToAPI 将 models.Board 转换为 api.Board
func boardToAPI(board models.Board) *api.Board {
	b := &api.Board{
		Id:          int(board.ID),
		Title:       board.Title,
		Description: &board.Description,
		OwnerId:     int(board.OwnerID),
		Color:       &board.Color,
		IsPublic:    &board.IsPublic,
		CreatedAt:   &board.CreatedAt,
		UpdatedAt:   &board.UpdatedAt,
	}

	if board.ProjectID != nil {
		projectID := int(*board.ProjectID)
		b.ProjectId = &projectID
	}

	if board.Owner != nil {
		b.Owner = userToAPI(*board.Owner)
	}

	if len(board.Lists) > 0 {
		lists := make([]api.List, len(board.Lists))
		for i, list := range board.Lists {
			lists[i] = *listToAPI(list)
		}
		b.Lists = &lists
	}

	if len(board.Swimlanes) > 0 {
		swimlanes := make([]api.Swimlane, len(board.Swimlanes))
		for i, swimlane := range board.Swimlanes {
			swimlanes[i] = *swimlaneToAPI(swimlane)
		}
		b.Swimlanes = &swimlanes
	}

	if len(board.Members) > 0 {
		members := make([]api.BoardMember, len(board.Members))
		for i, member := range board.Members {
			members[i] = *boardMemberToAPI(member)
		}
		b.Members = &members
	}

	if len(board.Labels) > 0 {
		labels := make([]api.Label, len(board.Labels))
		for i, label := range board.Labels {
			labels[i] = *labelToAPI(label)
		}
		b.Labels = &labels
	}

	return b
}

// swimlaneToAPI 将 models.Swimlane 转换为 api.Swimlane
func swimlaneToAPI(swimlane models.Swimlane) *api.Swimlane {
	return &api.Swimlane{
		Id:        int(swimlane.ID),
		BoardId:   int(swimlane.BoardID),
		Name:      swimlane.Name,
		Position:  swimlane.Position,
		Color:     &swimlane.Color,
		CreatedAt: &swimlane.CreatedAt,
		UpdatedAt: &swimlane.UpdatedAt,
	}
}

// listToAPI 将 models.List 转换为 api.List
func listToAPI(list models.List) *api.List {
	l := &api.List{
		Id:        int(list.ID),
		BoardId:   int(list.BoardID),
		Title:     list.Title,
		Position:  list.Position,
		WipLimit:  list.WipLimit,
		CreatedAt: &list.CreatedAt,
		UpdatedAt: &list.UpdatedAt,
	}

	if len(list.Cards) > 0 {
		cards := make([]api.Card, len(list.Cards))
		for i, card := range list.Cards {
			cards[i] = *cardToAPI(card)
		}
		l.Cards = &cards
	}

	return l
}

// cardToAPI 将 models.Card 转换为 api.Card
func cardToAPI(card models.Card) *api.Card {
	c := &api.Card{
		Id:          int(card.ID),
		ListId:      int(card.ListID),
		Title:       card.Title,
		Description: &card.Description,
		Position:    card.Position,
		DueDate:     card.DueDate,
		Cover:       &card.Cover,
		CompletedAt: card.CompletedAt,
		CreatedAt:   &card.CreatedAt,
		UpdatedAt:   &card.UpdatedAt,
	}

	if card.SwimlaneID != nil {
		swimlaneID := int(*card.SwimlaneID)
		c.SwimlaneId = &swimlaneID
	}

	if card.AssigneeID != nil {
		assigneeID := int(*card.AssigneeID)
		c.AssigneeId = &assigneeID
	}

	if card.Assignee != nil {
		c.Assignee = userToAPI(*card.Assignee)
	}

	if len(card.Labels) > 0 {
		labels := make([]api.Label, len(card.Labels))
		for i, label := range card.Labels {
			labels[i] = *labelToAPI(label)
		}
		c.Labels = &labels
	}

	if len(card.Comments) > 0 {
		comments := make([]api.Comment, len(card.Comments))
		for i, comment := range card.Comments {
			comments[i] = *commentToAPI(comment)
		}
		c.Comments = &comments
	}

	if len(card.Attachments) > 0 {
		attachments := make([]api.Attachment, len(card.Attachments))
		for i, attachment := range card.Attachments {
			attachments[i] = *attachmentToAPI(attachment)
		}
		c.Attachments = &attachments
	}

	if len(card.ChecklistItems) > 0 {
		items := make([]api.ChecklistItem, len(card.ChecklistItems))
		completed := 0
		for i, item := range card.ChecklistItems {
			items[i] = *checklistItemToAPI(item)
			if item.Completed {
				completed++
			}
		}
		c.ChecklistItems = &items
		total := len(card.ChecklistItems)
		comp := completed
		c.ChecklistProgress = &struct {
			Completed *int `json:"completed,omitempty"`
			Total     *int `json:"total,omitempty"`
		}{
			Completed: &comp,
			Total:     &total,
		}
	}

	return c
}

// checklistItemToAPI 将 models.ChecklistItem 转换为 api.ChecklistItem
func checklistItemToAPI(item models.ChecklistItem) *api.ChecklistItem {
	return &api.ChecklistItem{
		Id:        int(item.ID),
		CardId:    int(item.CardID),
		Content:   item.Content,
		Completed: item.Completed,
		Position:  item.Position,
		CreatedAt: &item.CreatedAt,
		UpdatedAt: &item.UpdatedAt,
	}
}

// labelToAPI 将 models.Label 转换为 api.Label
func labelToAPI(label models.Label) *api.Label {
	return &api.Label{
		Id:        int(label.ID),
		BoardId:   int(label.BoardID),
		Name:      label.Name,
		Color:     label.Color,
		CreatedAt: &label.CreatedAt,
		UpdatedAt: &label.UpdatedAt,
	}
}

// commentToAPI 将 models.Comment 转换为 api.Comment
func commentToAPI(comment models.Comment) *api.Comment {
	c := &api.Comment{
		Id:        int(comment.ID),
		CardId:    int(comment.CardID),
		UserId:    int(comment.UserID),
		Content:   comment.Content,
		CreatedAt: &comment.CreatedAt,
		UpdatedAt: &comment.UpdatedAt,
	}

	if comment.User != nil {
		c.User = userToAPI(*comment.User)
	}

	return c
}

// attachmentToAPI 将 models.Attachment 转换为 api.Attachment
func attachmentToAPI(attachment models.Attachment) *api.Attachment {
	a := &api.Attachment{
		Id:        int(attachment.ID),
		CardId:    int(attachment.CardID),
		FileName:  attachment.FileName,
		FileUrl:   attachment.FileURL,
		CreatedAt: &attachment.CreatedAt,
	}
	if attachment.FileSize > 0 {
		fileSize := int(attachment.FileSize)
		a.FileSize = &fileSize
	}
	if attachment.MimeType != "" {
		a.MimeType = &attachment.MimeType
	}
	return a
}

// boardMemberToAPI 将 models.BoardMember 转换为 api.BoardMember
func boardMemberToAPI(member models.BoardMember) *api.BoardMember {
	m := &api.BoardMember{
		Id:       int(member.ID),
		BoardId:  int(member.BoardID),
		UserId:   int(member.UserID),
		Role:     api.BoardMemberRole(member.Role),
		JoinedAt: &member.JoinedAt,
	}

	if member.User != nil {
		m.User = userToAPI(*member.User)
	}

	return m
}

// activityToAPI 将 models.Activity 转换为 api.Activity
func activityToAPI(activity models.Activity) *api.Activity {
	a := &api.Activity{
		Id:         int(activity.ID),
		BoardId:    int(activity.BoardID),
		UserId:     int(activity.UserID),
		Action:     activity.Action,
		EntityType: activity.EntityType,
		Content:    &activity.Content,
		CreatedAt:  &activity.CreatedAt,
	}
	if activity.EntityID > 0 {
		entityID := int(activity.EntityID)
		a.EntityId = &entityID
	}
	if activity.User != nil {
		a.User = userToAPI(*activity.User)
	}

	return a
}

// listAutoAssignmentToAPI 将 models.ListAutoAssignment 转换为 api.ListAutoAssignment
func listAutoAssignmentToAPI(assignment models.ListAutoAssignment) *api.ListAutoAssignment {
	a := &api.ListAutoAssignment{
		Id:     int(assignment.ID),
		ListId: int(assignment.ListID),
		UserId: int(assignment.UserID),
	}

	if assignment.User != nil {
		a.User = userToAPI(*assignment.User)
	}

	return a
}

// listTransitionRuleToAPI 将 models.ListTransitionRule 转换为 api.ListTransitionRule
func listTransitionRuleToAPI(rule models.ListTransitionRule) *api.ListTransitionRule {
	r := &api.ListTransitionRule{
		Id:         int(rule.ID),
		BoardId:    int(rule.BoardID),
		FromListId: int(rule.FromListID),
		ToListId:   int(rule.ToListID),
	}

	if rule.FromList != nil {
		r.FromList = listToAPI(*rule.FromList)
	}
	if rule.ToList != nil {
		r.ToList = listToAPI(*rule.ToList)
	}

	return r
}

// webhookToAPI 将 models.Webhook 转换为 api.Webhook
func webhookToAPI(webhook models.Webhook) *api.Webhook {
	w := &api.Webhook{
		Id:        int(webhook.ID),
		BoardId:   int(webhook.BoardID),
		Url:       webhook.URL,
		IsActive:  webhook.IsActive,
		CreatedAt: &webhook.CreatedAt,
		UpdatedAt: &webhook.UpdatedAt,
	}

	// Parse events from JSON string
	if webhook.Events != "" {
		w.Events = parseEvents(webhook.Events)
	}

	return w
}

// Helper function to parse events JSON
func parseEvents(eventsJSON string) []string {
	if eventsJSON == "" {
		return []string{}
	}

	var events []string
	if err := json.Unmarshal([]byte(eventsJSON), &events); err == nil {
		return events
	}

	var singleEvent string
	if err := json.Unmarshal([]byte(eventsJSON), &singleEvent); err == nil && singleEvent != "" {
		return []string{singleEvent}
	}

	return []string{strings.TrimSpace(eventsJSON)}
}
