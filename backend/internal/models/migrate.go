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
		&List{},
		&Card{},
		&Label{},
		&Comment{},
		&Attachment{},
		&BoardMember{},
		&Activity{},
	)
}

// BeforeCreate GORM钩子 - 创建前设置时间
func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.CreatedAt = time.Now()
	u.UpdatedAt = time.Now()
	return nil
}

func (u *User) BeforeUpdate(tx *gorm.DB) error {
	u.UpdatedAt = time.Now()
	return nil
}

func (b *Board) BeforeCreate(tx *gorm.DB) error {
	b.CreatedAt = time.Now()
	b.UpdatedAt = time.Now()
	return nil
}

func (b *Board) BeforeUpdate(tx *gorm.DB) error {
	b.UpdatedAt = time.Now()
	return nil
}

func (l *List) BeforeCreate(tx *gorm.DB) error {
	l.CreatedAt = time.Now()
	l.UpdatedAt = time.Now()
	return nil
}

func (l *List) BeforeUpdate(tx *gorm.DB) error {
	l.UpdatedAt = time.Now()
	return nil
}

func (c *Card) BeforeCreate(tx *gorm.DB) error {
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	return nil
}

func (c *Card) BeforeUpdate(tx *gorm.DB) error {
	c.UpdatedAt = time.Now()
	return nil
}

func (cm *Comment) BeforeCreate(tx *gorm.DB) error {
	cm.CreatedAt = time.Now()
	cm.UpdatedAt = time.Now()
	return nil
}

func (cm *Comment) BeforeUpdate(tx *gorm.DB) error {
	cm.UpdatedAt = time.Now()
	return nil
}

func (a *Attachment) BeforeCreate(tx *gorm.DB) error {
	a.CreatedAt = time.Now()
	return nil
}

func (bm *BoardMember) BeforeCreate(tx *gorm.DB) error {
	bm.JoinedAt = time.Now()
	return nil
}

func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	a.CreatedAt = time.Now()
	return nil
}