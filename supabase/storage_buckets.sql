-- Storage Buckets Setup
-- Run this in Supabase SQL Editor

-- 1. Create bucket for course thumbnails (public - images can be viewed by anyone)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create bucket for payment screenshots (private because payment proof is sensitive)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Create bucket for PDF lesson files (private - only enrolled students/admins can view)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pdfs', 'lesson-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for course-thumbnails

-- Allow admins to upload course thumbnails
DROP POLICY IF EXISTS "Admins can upload course thumbnails" ON storage.objects;
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-thumbnails' 
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to update course thumbnails
DROP POLICY IF EXISTS "Admins can update course thumbnails" ON storage.objects;
CREATE POLICY "Admins can update course thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-thumbnails' 
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to delete course thumbnails
DROP POLICY IF EXISTS "Admins can delete course thumbnails" ON storage.objects;
CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-thumbnails' 
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Allow anyone to view course thumbnails (public bucket)
DROP POLICY IF EXISTS "Anyone can view course thumbnails" ON storage.objects;
CREATE POLICY "Anyone can view course thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-thumbnails');

-- Storage Policies for payment-screenshots

-- Allow authenticated users to upload payment screenshots
DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own payment screenshots
DROP POLICY IF EXISTS "Users can view own payment screenshots" ON storage.objects;
CREATE POLICY "Users can view own payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all payment screenshots
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots'
  AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Storage Policies for lesson-pdfs

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
