-- Routines table - stores user's daily routine items
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time TIME NOT NULL, -- Time of day for this routine (e.g., 09:00:00)
  activity TEXT NOT NULL, -- Description of the activity (e.g., "Wake up", "Check work email")
  is_active BOOLEAN DEFAULT true, -- Whether this routine is currently active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Routine completions table - tracks when routines are completed
CREATE TABLE routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- Date when the routine was completed
  completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, routine_id, date)
);

-- Indexes for better query performance
CREATE INDEX idx_routines_user_id ON routines(user_id);
CREATE INDEX idx_routines_time ON routines(time);
CREATE INDEX idx_routine_completions_user_id ON routine_completions(user_id);
CREATE INDEX idx_routine_completions_date ON routine_completions(date);
CREATE INDEX idx_routine_completions_routine_id ON routine_completions(routine_id);

-- Enable Row Level Security
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routines table
CREATE POLICY "Users can view their own routines"
  ON routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routines"
  ON routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines"
  ON routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines"
  ON routines FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for routine_completions table
CREATE POLICY "Users can view their own routine completions"
  ON routine_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine completions"
  ON routine_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine completions"
  ON routine_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine completions"
  ON routine_completions FOR DELETE
  USING (auth.uid() = user_id);
