-- Add pricing and promotional fields to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price INTEGER,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MMK',
ADD COLUMN IF NOT EXISTS promo_tag TEXT,
ADD COLUMN IF NOT EXISTS promo_end_date TIMESTAMP WITH TIME ZONE;

-- Example promo_tag values: 'launch', 'discount', 'new', 'popular', 'bestseller'
-- promo_end_date: When the promotion expires (optional)

-- Update your Python course with pricing
-- UPDATE courses 
-- SET price = 50000, 
--     original_price = 150000, 
--     promo_tag = 'launch',
--     promo_end_date = NOW() + INTERVAL '7 days'
-- WHERE title LIKE '%Python%';


