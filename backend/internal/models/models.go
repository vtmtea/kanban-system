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
	Color       string         `json:"color" gorm:"size:7"`
	IsPublic    bool           `json:"is_public" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Lists       []List         `json:"lists,omitempty" gorm:"foreignKey:BoardID"`
	Swimlanes   []Swimlane     `json:"swimlanes,omitempty" gorm:"foreignKey:BoardID"`
	Members     []BoardMember  `json:"members,omitempty" gorm:"foreignKey:BoardID"`
	Labels      []Label        `json:"labels,omitempty" gorm:"foreignKey:BoardID"`
	Webhooks    []Webhook      `json:"webhooks,omitempty" gorm:"foreignKey:BoardID"`
}

// Swimlane 泳道模型
type Swimlane struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BoardID   uint           `json:"board_id" gorm:"not null;index"`
	Board     *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Name      string         `json:"name" gorm:"size:100;not null"`
	Position  int            `json:"position" gorm:"not null;default:0"`
	Color     string         `json:"color" gorm:"size:7"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// List 列表模型
type List struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	BoardID     uint           `json:"board_id" gorm:"not null;index"`
	Board       *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	Title       string         `json:"title" gorm:"size:100;not null"`
	Position    int            `json:"position" gorm:"not null;default:0"`
	WipLimit    *int           `json:"wip_limit" gorm:"default:null"` // WIP 限制，null 表示无限制
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Cards       []Card         `json:"cards,omitempty" gorm:"foreignKey:ListID"`
	AutoAssignments []ListAutoAssignment `json:"auto_assignments,omitempty" gorm:"foreignKey:ListID"`
}

// ListAutoAssignment 列自动指派配置
type ListAutoAssignment struct {
	ID       uint           `json:"id" gorm:"primaryKey"`
	ListID   uint           `json:"list_id" gorm:"not null;uniqueIndex"`
	List     *List          `json:"list,omitempty" gorm:"foreignKey:ListID"`
	UserID   uint           `json:"user_id" gorm:"not null"`
	User     *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	CreatedAt time.Time     `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// ListTransitionRule 状态转移规则
type ListTransitionRule struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	BoardID    uint           `json:"board_id" gorm:"not null;index"`
	Board      *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	FromListID uint           `json:"from_list_id" gorm:"not null"`
	FromList   *List          `json:"from_list,omitempty" gorm:"foreignKey:FromListID"`
	ToListID   uint           `json:"to_list_id" gorm:"not null"`
	ToList     *List          `json:"to_list,omitempty" gorm:"foreignKey:ToListID"`
	CreatedAt  time.Time      `json:"created_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// Card 卡片模型
type Card struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	ListID       uint           `json:"list_id" gorm:"not null;index"`
	List         *List          `json:"list,omitempty" gorm:"foreignKey:ListID"`
	SwimlaneID   *uint          `json:"swimlane_id" gorm:"index;default:null"`
	Swimlane     *Swimlane      `json:"swimlane,omitempty" gorm:"foreignKey:SwimlaneID"`
	Title        string         `json:"title" gorm:"size:200;not null"`
	Description  string         `json:"description" gorm:"type:text"` // 支持 Markdown
	Position     int            `json:"position" gorm:"not null;default:0"`
	DueDate      *time.Time     `json:"due_date"`
	Cover        string         `json:"cover" gorm:"size:255"`
	AssigneeID   *uint          `json:"assignee_id" gorm:"index;default:null"`
	Assignee     *User          `json:"assignee,omitempty" gorm:"foreignKey:AssigneeID"`
	CompletedAt  *time.Time     `json:"completed_at"` // 完成时间，用于统计
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	Labels       []Label        `json:"labels,omitempty" gorm:"many2many:card_labels;"`
	Comments     []Comment      `json:"comments,omitempty" gorm:"foreignKey:CardID"`
	Attachments  []Attachment   `json:"attachments,omitempty" gorm:"foreignKey:CardID"`
	ChecklistItems []ChecklistItem `json:"checklist_items,omitempty" gorm:"foreignKey:CardID"`
}

// ChecklistItem 检查清单项
type ChecklistItem struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CardID    uint           `json:"card_id" gorm:"not null;index"`
	Card      *Card          `json:"card,omitempty" gorm:"foreignKey:CardID"`
	Content   string         `json:"content" gorm:"size:200;not null"`
	Completed bool           `json:"completed" gorm:"default:false"`
	Position  int            `json:"position" gorm:"not null;default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Label 标签模型
type Label struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BoardID   uint           `json:"board_id" gorm:"not null;index"`
	Name      string         `json:"name" gorm:"size:50;not null"`
	Color     string         `json:"color" gorm:"size:7;not null"`
	Cards     []Card         `json:"cards,omitempty" gorm:"many2many:card_labels;"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Comment 评论模型
type Comment struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CardID    uint           `json:"card_id" gorm:"not null;index"`
	Card      *Card          `json:"card,omitempty" gorm:"foreignKey:CardID"`
	UserID    uint           `json:"user_id" gorm:"not null;index"`
	User      *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Content   string         `json:"content" gorm:"type:text;not null"` // 支持 Markdown
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
	MimeType  string         `json:"mime_type" gorm:"size:100"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// BoardMember 看板成员模型
type BoardMember struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BoardID   uint           `json:"board_id" gorm:"not null;uniqueIndex:idx_board_user"`
	Board     *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	UserID    uint           `json:"user_id" gorm:"not null;uniqueIndex:idx_board_user"`
	User      *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Role      string         `json:"role" gorm:"size:20;not null;default:'member'"` // owner, admin, member, observer
	JoinedAt  time.Time      `json:"joined_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// Activity 活动日志模型
type Activity struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	BoardID    uint           `json:"board_id" gorm:"not null;index"`
	Board      *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	UserID     uint           `json:"user_id" gorm:"not null;index"`
	User       *User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Action     string         `json:"action" gorm:"size:50;not null"` // created, updated, deleted, moved, completed, assigned
	EntityType string         `json:"entity_type" gorm:"size:50;not null"` // board, list, card, comment, checklist_item
	EntityID   uint           `json:"entity_id"`
	Content    string         `json:"content" gorm:"type:text"`
	CreatedAt  time.Time      `json:"created_at"`
}

// Webhook Webhook配置模型
type Webhook struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	BoardID   uint           `json:"board_id" gorm:"not null;index"`
	Board     *Board         `json:"board,omitempty" gorm:"foreignKey:BoardID"`
	URL       string         `json:"url" gorm:"size:500;not null"`
	Events    string         `json:"events" gorm:"type:text"` // JSON array: ["card.created", "card.moved", "card.completed"]
	Secret    string         `json:"secret" gorm:"size:100"` // 用于签名验证
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// CardHistory 卡片历史记录（用于统计）
type CardHistory struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	CardID    uint      `json:"card_id" gorm:"not null;index"`
	Card      *Card     `json:"card,omitempty" gorm:"foreignKey:CardID"`
	ListID    uint      `json:"list_id" gorm:"not null;index"`
	List      *List     `json:"list,omitempty" gorm:"foreignKey:ListID"`
	EnteredAt time.Time `json:"entered_at"` // 进入该列的时间
	ExitedAt  *time.Time `json:"exited_at"` // 离开该列的时间（null表示当前仍在）
}