# Admin ID to Creator ID Migration

This migration renames the `admin_id` column in the `groups` table to `creator_id` to better reflect its purpose. The change is necessary because group administrators are now determined by the `is_admin` flag in the `group_members` table, while the former `admin_id` column actually represents the original creator of the group.

## Migration Files

1. **SQL Migration**: `rename_admin_id_to_creator_id.sql`
   - Adds a new `creator_id` column
   - Copies data from `admin_id` to `creator_id`
   - Sets up foreign key constraints
   - Removes the old `admin_id` column
   - Creates an index on `creator_id` for better performance

2. **Go Model Update**: Updated `Group` struct in `group_model.go`
   - Changed `AdminID` field to `CreatorID`
   - Updated JSON tags and GORM tags

3. **Frontend Update**: Modified `useGroupData.js`
   - Updated references from `admin_id` to `creator_id`
   - Added backward compatibility to support both field names during transition

## Running the Migration

To apply this migration:

1. Run the SQL migration on the database:
   ```bash
   psql -U your_username -d your_database -f migrations/rename_admin_id_to_creator_id.sql
   ```

2. Deploy the updated backend code with the modified `Group` struct.

3. Deploy the updated frontend code with the modified `useGroupData.js`.

## Backward Compatibility

The frontend code has been updated to check for both `creator_id` and `admin_id` to ensure backward compatibility during the transition period. This allows the frontend to work correctly regardless of whether it's communicating with an updated or non-updated backend.

## Verification

After applying the migration, verify that:

1. Existing groups still have their creator information preserved
2. Group administrators are correctly identified through the `group_members` table
3. The frontend correctly displays admin status for group members 