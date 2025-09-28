-- EMERGENCY FIX: Make forms publicly accessible for sharing
-- Run this in your Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'forms';

-- Drop ALL existing policies on forms table
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
DROP POLICY IF EXISTS "Users can insert their own forms" ON forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON forms;
DROP POLICY IF EXISTS "Public can view published forms" ON forms;
DROP POLICY IF EXISTS "Public can view forms by ID" ON forms;
DROP POLICY IF EXISTS "Users can edit their own forms" ON forms;

-- Create new policies that allow public access to forms
-- Policy 1: Anyone can view forms (for sharing)
CREATE POLICY "Public can view all forms" ON forms
  FOR SELECT USING (true);

-- Policy 2: Authenticated users can insert their own forms
CREATE POLICY "Users can insert their own forms" ON forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Authenticated users can update their own forms
CREATE POLICY "Users can update their own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Authenticated users can delete their own forms
CREATE POLICY "Users can delete their own forms" ON forms
  FOR DELETE USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'forms';

-- Test: Insert a sample form to verify policies work
-- (This will help us debug the issue)
INSERT INTO forms (id, title, blocks, questions, media, form_style, user_id, is_published)
VALUES (
  'test-form-123',
  'Test Form',
  '[]'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  (SELECT id FROM auth.users LIMIT 1),
  true
) ON CONFLICT (id) DO NOTHING;

-- Test: Try to select the test form
SELECT * FROM forms WHERE id = 'test-form-123';
