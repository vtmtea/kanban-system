package models

import (
	"time"

	"gorm.io/gorm"
)

// AutoMigrate 自动迁移数据库表结构
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Board{},
		&Swimlane{},
		&List{},
		&ListAutoAssignment{},
		&ListTransitionRule{},
		&Card{},
		&ChecklistItem{},
		&Label{},
		&Comment{},
		&Attachment{},
		&BoardMember{},
		&Activity{},
		&Webhook{},
		&CardHistory{},
	)
}

// User hooks
func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()
	return nil
}

func (u *User) BeforeUpdate(tx *gorm.DB) error {
	u.UpdatedAt = time.Now()
	return nil
}

// Board hooks
func (b *Board) BeforeCreate(tx *gorm.DB) error {
	b.CreatedAt = time.Now()
	b.UpdatedAt = time.Now()
	return nil
}

func (b *Board) BeforeUpdate(tx *gorm.DB) error {
	b.UpdatedAt = time.Now()
	return nil
}

// Swimlane hooks
func (s *Swimlane) BeforeCreate(tx *gorm.DB) error {
	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()
	return nil
}

func (s *Swimlane) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = time.Now()
	return nil
}

// List hooks
func (l *List) BeforeCreate(tx *gorm.DB) error {
	l.CreatedAt = time.Now()
	l.UpdatedAt = time.Now()
	return nil
}

func (l *List) BeforeUpdate(tx *gorm.DB) error {
	l.UpdatedAt = time.Now()
	return nil
}

// ListAutoAssignment hooks
func (la *ListAutoAssignment) BeforeCreate(tx *gorm.DB) error {
	la.CreatedAt = time.Now()
	return nil
}

// ListTransitionRule hooks
func (lr *ListTransitionRule) BeforeCreate(tx *gorm.DB) error {
	lr.CreatedAt = time.Now()
	return nil
}

// Card hooks
func (c *Card) BeforeCreate(tx *gorm.DB) error {
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	return nil
}

func (c *Card) BeforeUpdate(tx *gorm.DB) error {
	c.UpdatedAt = time.Now()
	return nil
}

// ChecklistItem hooks
func (ci *ChecklistItem) BeforeCreate(tx *gorm.DB) error {
	ci.CreatedAt = time.Now()
	ci.UpdatedAt = time.Now()
	return nil
}

func (ci *ChecklistItem) BeforeUpdate(tx *gorm.DB) error {
	ci.UpdatedAt = time.Now()
	return nil
}

// Label hooks
func (l *Label) BeforeCreate(tx *gorm.DB) error {
	l.CreatedAt = time.Now()
	l.UpdatedAt = time.Now()
	return nil
}

func (l *Label) BeforeUpdate(tx *gorm.DB) error {
	l.UpdatedAt = time.Now()
	return nil
}

// Comment hooks
func (cm *Comment) BeforeCreate(tx *gorm.DB) error {
	cm.CreatedAt = time.Now()
	cm.UpdatedAt = time.Now()
	return nil
}

func (cm *Comment) BeforeUpdate(tx *gorm.DB) error {
	cm.UpdatedAt = time.Now()
	return nil
}

// Attachment hooks
func (a *Attachment) BeforeCreate(tx *gorm.DB) error {
	a.CreatedAt = time.Now()
	return nil
}

// BoardMember hooks
func (bm *BoardMember) BeforeCreate(tx *gorm.DB) error {
	bm.JoinedAt = time.Now()
	bm.CreatedAt = time.Now()
	bm.UpdatedAt = time.Now()
	return nil
}

func (bm *BoardMember) BeforeUpdate(tx *gorm.DB) error {
	bm.UpdatedAt = time.Now()
	return nil
}

// Activity hooks
func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	a.CreatedAt = time.Now()
	return nil
}

// Webhook hooks
func (w *Webhook) BeforeCreate(tx *gorm.DB) error {
	w.CreatedAt = time.Now()
	w.UpdatedAt = time.Now()
	return nil
}

func (w *Webhook) BeforeUpdate(tx *gorm.DB) error {
	w.UpdatedAt = time.Now()
	return nil
}

// CardHistory hooks
func (ch *CardHistory) BeforeCreate(tx *gorm.DB) error {
	return nil
}