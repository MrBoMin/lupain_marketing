-- Free Videos table
CREATE TABLE IF NOT EXISTS free_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  vimeo_video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0, -- in seconds
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Views table for analytics
CREATE TABLE IF NOT EXISTS video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES free_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_hash TEXT, -- Hashed IP for anonymous tracking
  watch_duration INTEGER DEFAULT 0, -- seconds watched
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_free_videos_published ON free_videos(published);
CREATE INDEX IF NOT EXISTS idx_free_videos_featured ON free_videos(is_featured);
CREATE INDEX IF NOT EXISTS idx_free_videos_order ON free_videos(order_index);
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_created_at ON video_views(created_at);

-- RLS Policies
ALTER TABLE free_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Free videos: Anyone can view published videos
CREATE POLICY "Anyone can view published free videos"
  ON free_videos FOR SELECT
  USING (published = true);

-- Free videos: Admins can do everything
CREATE POLICY "Admins can manage free videos"
  ON free_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Video views: Anyone can insert views (for tracking)
CREATE POLICY "Anyone can record video views"
  ON video_views FOR INSERT
  WITH CHECK (true);

-- Video views: Users can view their own views
CREATE POLICY "Users can view own video views"
  ON video_views FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Video views: Admins can view all
CREATE POLICY "Admins can view all video views"
  ON video_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_video_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE free_videos
  SET view_count = view_count + 1
  WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment view count
DROP TRIGGER IF EXISTS on_video_view_insert ON video_views;
CREATE TRIGGER on_video_view_insert
  AFTER INSERT ON video_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_video_view_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_free_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_free_videos_update ON free_videos;
CREATE TRIGGER on_free_videos_update
  BEFORE UPDATE ON free_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_free_videos_updated_at();
