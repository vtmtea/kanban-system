package handlers

import (
	"kanban-system/backend/internal/api"
	"kanban-system/backend/internal/models"
)

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

	if len(board.Members) > 0 {
		members := make([]api.BoardMember, len(board.Members))
		for i, member := range board.Members {
			members[i] = *boardMemberToAPI(member)
		}
		b.Members = &members
	}

	return b
}

// listToAPI 将 models.List 转换为 api.List
func listToAPI(list models.List) *api.List {
	l := &api.List{
		Id:        int(list.ID),
		BoardId:   int(list.BoardID),
		Title:     list.Title,
		Position:  list.Position,
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
		CreatedAt:   &card.CreatedAt,
		UpdatedAt:   &card.UpdatedAt,
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

	return c
}

// labelToAPI 将 models.Label 转换为 api.Label
func labelToAPI(label models.Label) *api.Label {
	return &api.Label{
		Id:      int(label.ID),
		BoardId: int(label.BoardID),
		Name:    label.Name,
		Color:   label.Color,
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