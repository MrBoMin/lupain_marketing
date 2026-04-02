-- ============================================
-- CHAPTERS MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Create chapters table
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, "order")
);

-- Add chapter_id to lessons table
ALTER TABLE lessons ADD COLUMN chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;

-- Drop the old unique constraint on lessons
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_course_id_order_key;

-- Create new unique constraint for lessons within chapters
ALTER TABLE lessons ADD CONSTRAINT lessons_chapter_order_unique UNIQUE(chapter_id, "order");

-- Create index for performance
CREATE INDEX idx_chapters_course_id ON chapters(course_id);
CREATE INDEX idx_lessons_chapter_id ON lessons(chapter_id);

-- Create trigger for chapters updated_at
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chapters table
CREATE POLICY "Anyone can view chapters" ON chapters FOR SELECT USING (true);

CREATE POLICY "Admins can insert chapters" ON chapters FOR INSERT 
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update chapters" ON chapters FOR UPDATE 
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete chapters" ON chapters FOR DELETE 
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
