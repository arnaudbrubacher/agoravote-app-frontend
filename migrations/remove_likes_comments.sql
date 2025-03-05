-- Migration to remove likes and comments functionality from posts

-- Since LikeCount and CommentCount are virtual fields in the Go model (marked with gorm:"-"),
-- they don't exist in the actual database schema. No need to alter the posts table.

-- However, if there are any likes or comments tables in the database that weren't found in our analysis,
-- we can add DROP TABLE statements here as a precaution:

DROP TABLE IF EXISTS public.post_likes;
DROP TABLE IF EXISTS public.post_comments;

-- Remove any indexes related to likes and comments
DROP INDEX IF EXISTS idx_post_likes_post_id;
DROP INDEX IF EXISTS idx_post_likes_user_id;
DROP INDEX IF EXISTS idx_post_comments_post_id;
DROP INDEX IF EXISTS idx_post_comments_user_id;

-- Note: Based on our analysis, there don't appear to be actual database tables for likes and comments.
-- The virtual fields in the Post model (LikeCount and CommentCount) are likely populated by the backend
-- application logic, possibly by counting related records or through some other mechanism.
-- 
-- This migration is provided as a precaution in case these tables exist but weren't found in our analysis. 