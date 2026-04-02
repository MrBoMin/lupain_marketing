-- Add promo_deadline column to courses table
ALTER TABLE courses ADD COLUMN promo_deadline TIMESTAMPTZ;
