// UpdateGroupFields updates only the specified fields of a group
func (s *GroupService) UpdateGroupFields(groupID uuid.UUID, updateData map[string]interface{}) error {
	// ... existing code ...

	// Handle field name conversions from camelCase to snake_case
	// Check for isPrivate and convert to is_private
	if value, ok := updateData["isPrivate"]; ok {
		updateData["is_private"] = value
		delete(updateData, "isPrivate")
	}

	// Handle requires_admin_approval field
	if value, ok := updateData["requires_admin_approval"]; ok {
		// Ensure it's a boolean value
		if boolValue, isBool := value.(bool); isBool {
			updateData["requires_admin_approval"] = boolValue
		}
	}

	// ... existing code ...

	return tx.Commit().Error
}

// ... existing code ... 