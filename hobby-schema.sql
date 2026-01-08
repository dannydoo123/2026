-- ============================================
-- HOBBY TRACKING TABLES
-- ============================================
-- Run this SQL in your Supabase SQL Editor to add hobby tracking functionality

-- ============================================
-- 1. HOBBY CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hobby_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('count', 'duration')),
  unit TEXT NOT NULL,
  color TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('none', 'target')),
  goal_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hobby_categories ENABLE ROW LEVEL SECURITY;

-- Policies for hobby_categories
CREATE POLICY "Users can view own hobby categories"
  ON hobby_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hobby categories"
  ON hobby_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hobby categories"
  ON hobby_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hobby categories"
  ON hobby_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_hobby_categories_user_id ON hobby_categories(user_id);

-- ============================================
-- 2. HOBBY ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hobby_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES hobby_categories(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, date)
);

-- Enable Row Level Security
ALTER TABLE hobby_entries ENABLE ROW LEVEL SECURITY;

-- Policies for hobby_entries
CREATE POLICY "Users can view own hobby entries"
  ON hobby_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hobby entries"
  ON hobby_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hobby entries"
  ON hobby_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hobby entries"
  ON hobby_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX idx_hobby_entries_user_id ON hobby_entries(user_id);
CREATE INDEX idx_hobby_entries_category_id ON hobby_entries(category_id);
CREATE INDEX idx_hobby_entries_date ON hobby_entries(date);

-- ============================================
-- 3. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================

-- Apply to hobby tables
CREATE TRIGGER update_hobby_categories_updated_at BEFORE UPDATE ON hobby_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hobby_entries_updated_at BEFORE UPDATE ON hobby_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETE!
-- ============================================
-- Your hobby tracking tables are now ready to use.
