-- Migration to add file-related fields to the group_members table
-- This allows storing document files uploaded by members

-- Add file-related fields to the group_members table
ALTER TABLE group_members
ADD COLUMN document_file_url VARCHAR(255),
ADD COLUMN document_file_type VARCHAR(50),
ADD COLUMN document_file_size BIGINT DEFAULT 0,
ADD COLUMN document_file_name VARCHAR(255),
ADD COLUMN document_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add an index for faster queries on document uploads
CREATE INDEX idx_group_members_document_file ON group_members (document_file_url);

-- Note: The existing documents_submitted JSONB field will continue to store metadata
-- about the documents, while these new fields will store information about the actual file.
-- This allows for a hybrid approach where document metadata is stored in the JSONB field,
-- and file information is stored in dedicated columns for better querying and management.

COMMENT ON COLUMN group_members.document_file_url IS 'Path to the uploaded document file';
COMMENT ON COLUMN group_members.document_file_type IS 'Type of the document file (e.g., pdf, image)';
COMMENT ON COLUMN group_members.document_file_size IS 'Size of the document file in bytes';
COMMENT ON COLUMN group_members.document_file_name IS 'Original name of the uploaded document file';
COMMENT ON COLUMN group_members.document_uploaded_at IS 'When the document was uploaded'; 