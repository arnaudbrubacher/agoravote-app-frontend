-- Migration to rename admin_id to creator_id in the groups table
-- This reflects that administrators are now determined by the group_members table
-- while this column represents the original creator of the group

-- Start transaction
BEGIN;

-- Add new column creator_id
ALTER TABLE public.groups 
ADD COLUMN creator_id uuid;

-- Copy data from admin_id to creator_id
UPDATE public.groups 
SET creator_id = admin_id;

-- Make creator_id NOT NULL
ALTER TABLE public.groups 
ALTER COLUMN creator_id SET NOT NULL;

-- Add foreign key constraint to creator_id
ALTER TABLE public.groups 
ADD CONSTRAINT fk_groups_creator FOREIGN KEY (creator_id) REFERENCES public.users(id);

-- Drop the old foreign key constraint on admin_id
ALTER TABLE public.groups 
DROP CONSTRAINT fk_groups_admin;

-- Drop the admin_id column
ALTER TABLE public.groups 
DROP COLUMN admin_id;

-- Create an index on creator_id for better performance
CREATE INDEX idx_groups_creator_id ON public.groups(creator_id);

-- Commit transaction
COMMIT; 