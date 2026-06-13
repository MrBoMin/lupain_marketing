-- PDF Lessons Migration
-- Adds PDF document lessons alongside Vimeo video lessons.

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'video' CHECK (lesson_type IN ('video', 'pdf')),
ADD COLUMN IF NOT EXISTS pdf_file_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;

ALTER TABLE lessons ALTER COLUMN vimeo_video_id DROP NOT NULL;

UPDATE lessons
SET lesson_type = 'video'
WHERE lesson_type IS NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pdfs', 'lesson-pdfs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins can upload lesson PDFs" ON storage.objects;
CREATE POLICY "Admins can upload lesson PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-pdfs'
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update lesson PDFs" ON storage.objects;
CREATE POLICY "Admins can update lesson PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-pdfs'
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete lesson PDFs" ON storage.objects;
CREATE POLICY "Admins can delete lesson PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-pdfs'
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Enrolled users can view lesson PDFs" ON storage.objects;
CREATE POLICY "Enrolled users can view lesson PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-pdfs'
  AND (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.user_id = auth.uid()
      AND enrollments.course_id::text = (storage.foldername(name))[1]
      AND enrollments.status = 'approved'
    )
  )
);
