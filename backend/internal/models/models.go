package models

import (
	"time"

	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Email     string         `json:"email" gorm:"uniqueIndex;size:100;not null"`
	Password  string         `json:"-" gorm:"size:255;not null"`
	Nickname  string         `json:"nickname" gorm:"size:50"`
	Avatar    string         `json:"avatar" gorm:"size:255"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Board 看板模型
type Board struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title" gorm:"size:100;not null"`
	Description string         `json:"description" gorm:"size:500"`
	OwnerID     uint           `json:"owner_id" gorm:"not null;index"`
	Owner       *User          `json:"owner,omitempty" gorm:"foreignKey:OwnerID"`
	Color       string         `json:"color" gorm:"size:7"` // 十六进制颜色
	IsPublic    bool           `json:"is_public" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Lists       []List         `json:"lists,omitempty" gorm:"foreignKey:BoardID"`
	Members     []BoardMember  `json:"members,omitempty" gorm:"foreignKey:BoardID"`
}

// List 列表模型
type List struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BoardID   uint           `json:"board_id" gorm:"not null;index"`
	Board     *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Title     string         `json:"title" gorm:"size:100;not null"`
	Position  int            `json:"position" gorm:"not null;default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	Cards     []Card         `json:"cards,omitempty" gorm:"foreignKey:ListID"`
}

// Card 卡片模型
type Card struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	ListID      uint           `json:"list_id" gorm:"not null;index"`
	List        *List          `json:"list,omitempty" gorm:"foreignKey:ListID"`
	Title       string         `json:"title" gorm:"size:200;not null"`
	Description string         `json:"description" gorm:"type:text"`
	Position    int            `json:"position" gorm:"not null;default:0"`
	DueDate     *time.Time     `json:"due_date"`
	Cover       string         `json:"cover" gorm:"size:255"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Labels      []Label        `json:"labels,omitempty" gorm:"many2many:card_labels;"`
	Comments    []Comment      `json:"comments,omitempty" gorm:"foreignKey:CardID"`
	Attachments []Attachment   `json:"attachments,omitempty" gorm:"foreignKey:CardID"`
}

// Label 标签模型
type Label struct {
	ID      uint           `json:"id" gorm:"primaryKey"`
	BoardID uint           `json:"board_id" gorm:"not null;index"`
	Name    string         `json:"name" gorm:"size:50;not null"`
	Color   string         `json:"color" gorm:"size:7;not null"`
	Cards   []Card         `json:"cards,omitempty" gorm:"many2many:card_labels;"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Comment 评论模型
type Comment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CardID    uint           `json:"card_id" gorm:"not null;index"`
	Card      *Card          `json:"card,omitempty" gorm:"foreignKey:CardID"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	User      *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Content   string         `json:"content" gorm:"type:text;not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Attachment 附件模型
type Attachment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CardID    uint           `json:"card_id" gorm:"not null;index"`
	Card      *Card          `json:"card,omitempty" gorm:"foreignKey:CardID"`
	FileName  string         `json:"file_name" gorm:"size:255;not null"`
	FileURL   string         `json:"file_url" gorm:"size:500;not null"`
	FileSize  int64          `json:"file_size"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// BoardMember 看板成员模型
type BoardMember struct {
	ID       uint           `json:"id" gorm:"primaryKey"`
	BoardID  uint           `json:"board_id" gorm:"not null;uniqueIndex:idx_board_user"`
	Board    *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	UserID   uint           `json:"user_id" gorm:"not null;uniqueIndex:idx_board_user"`
	User     *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Role     string         `json:"role" gorm:"size:20;not null;default:'member'"` // owner, admin, member
	JoinedAt time.Time      `json:"joined_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Activity 活动日志模型
type Activity struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BoardID   uint           `json:"board_id" gorm:"not null;index"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	User      *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Action    string         `json:"action" gorm:"size:50;not null"` // created, updated, deleted, moved, etc.
	EntityType string        `json:"entity_type" gorm:"size:50;not null"` // board, list, card, comment
	EntityID  uint           `json:"entity_id"`
	Content   string         `json:"content" gorm:"type:text"`
	CreatedAt time.Time      `json:"created_at"`
}