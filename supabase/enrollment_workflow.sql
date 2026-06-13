-- Enrollment Workflow Migration
-- Run this in Supabase SQL Editor

-- Add new columns to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS user_note TEXT,
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);

-- Create storage bucket for payment screenshots (run in Supabase Dashboard > Storage)
-- Or use this SQL:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload their own payment screenshots
DROP POLICY IF EXISTS "Users can upload payment screenshots" ON storage.objects;
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Users can view their own screenshots
DROP POLICY IF EXISTS "Users can view own screenshots" ON storage.objects;
CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Admins can view all screenshots
DROP POLICY IF EXISTS "Admins can view all screenshots" ON storage.objects;
CREATE POLICY "Admins can view all screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-screenshots' 
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Update RLS policies for enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can update enrollments" ON enrollments;

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = user_id);

-- Users can create pending paid enrollments or approved free-course enrollments
CREATE POLICY "Users can create enrollments"
ON enrollments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    status = 'pending'
    OR (
      status = 'approved'
      AND EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = enrollments.course_id
        AND courses.price = 0
      )
    )
  )
);

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON enrollments FOR SELECT
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update enrollments (approve/reject)
CREATE POLICY "Admins can update enrollments"
ON enrollments FOR UPDATE
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Create payment_info table for admin to configure payment details
CREATE TABLE IF NOT EXISTS payment_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  additional_info TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for payment_info
ALTER TABLE payment_info ENABLE ROW LEVEL SECURITY;

-- Everyone can view active payment info
CREATE POLICY "Anyone can view active payment info"
ON payment_info FOR SELECT
USING (is_active = true);

-- Admins can manage payment info
CREATE POLICY "Admins can manage payment info"
ON payment_info FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Insert placeholder payment info. Replace this in Admin > Settings.
INSERT INTO payment_info (bank_name, account_name, account_number, additional_info)
VALUES ('Bank Name', 'Account Holder', 'Account Number', 'Replace this with your real payment instructions before accepting paid enrollments.')
ON CONFLICT DO NOTHING;
