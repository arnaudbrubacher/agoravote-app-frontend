package models

import (
	"time"

	"github.com/google/uuid"
)

// GroupInvitation struct reflecting the actual DB schema
type GroupInvitation struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	GroupID uuid.UUID `json:"group_id" gorm:"type:uuid;not null"`
	// UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;null"`         // Removed - Not in DB schema
	// InviterID uuid.UUID `json:"inviter_id" gorm:"type:uuid;null"`       // Removed - Not in DB schema
	Email string `json:"email" gorm:"type:text;not null"`
	Token string `json:"token" gorm:"type:text;not null;unique"`
	// Status    string    `json:"status" gorm:"type:text;default:'pending'"` // Removed - Not in DB schema
	ExpiresAt time.Time `json:"expires_at" gorm:"type:timestamp with time zone;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"type:timestamp with time zone;default:now()"`
	UpdatedAt time.Time `json:"updated_at" gorm:"-"`                // Re-add field but tell GORM to ignore it for DB ops
	Used      bool      `json:"used" gorm:"default:false;not null"` // Added boolean field
	// Message   string    `json:"message" gorm:"type:text;null"`           // Removed - Not in DB schema (unless added separately)
}

// GroupInvitationWithDetails extends GroupInvitation with additional details
// This might need adjustment depending on how it's populated
type GroupInvitationWithDetails struct {
	ID      uuid.UUID `json:"id"`
	GroupID uuid.UUID `json:"group_id"`
	UserID  uuid.UUID `json:"user_id"` // Keep if needed for display, but populate differently
	Email   string    `json:"email"`
	Token   string    `json:"token"`
	// Status       string    `json:"status"` // Remove status?
	Used         bool      `json:"used"` // Add used?
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" json:"-"` // Keep it removed here or add with json tag only?
	GroupName    string    `json:"group_name"`
	GroupImage   string    `json:"group_image"`
	InviterName  string    `json:"inviter_name"`  // Keep if needed, populate differently
	InviterEmail string    `json:"inviter_email"` // Keep if needed, populate differently
	Message      string    `json:"message"`       // Remove message?
}
