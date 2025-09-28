-- Fix RLS policies to allow proper form access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public can view published forms" ON forms;

-- Create new policy that allows public access to forms by ID (for sharing)
CREATE POLICY "Public can view forms by ID" ON forms
  FOR SELECT USING (true);

-- Update the forms policy to be less restrictive for sharing
-- This allows forms to be viewed publicly while maintaining security for editing
CREATE POLICY "Users can edit their own forms" ON forms
  FOR UPDATE USING (auth.uid() = user_id);

-- Keep other policies as they are
-- Users can still only insert/delete their own forms
-- But anyone can view forms for sharing purposes
