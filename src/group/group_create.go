package group

import (
	"fmt"

	"github.com/google/uuid"
)

// CreateGroup creates a new group and adds the creator as admin
func (s *GroupService) CreateGroup(group *Group, creatorID uuid.UUID) error {
	// ... existing code ...

	// Handle requires_admin_approval field
	// If not explicitly set, default to true
	if group.RequiresAdminApproval == false {
		fmt.Println("RequiresAdminApproval explicitly set to false")
	} else {
		// Default to true if not explicitly set to false
		group.RequiresAdminApproval = true
		fmt.Println("Setting RequiresAdminApproval to default value: true")
	}

	// ... existing code ...

	// Create the group
	if err := tx.Create(group).Error; err != nil {
		tx.Rollback()
		fmt.Printf("Failed to create group: %v\n", err)
		return err
	}

	// ... existing code ...
}

// ... existing code ...
