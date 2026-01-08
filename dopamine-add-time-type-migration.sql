-- Migration to add 'time' tracking type to dopamine_categories
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the old CHECK constraint
ALTER TABLE dopamine_categories
DROP CONSTRAINT IF EXISTS dopamine_categories_type_check;

-- Step 2: Add the new CHECK constraint that includes 'time'
ALTER TABLE dopamine_categories
ADD CONSTRAINT dopamine_categories_type_check
CHECK (type IN ('count', 'duration', 'time'));

-- That's it! Now you can create dopamine categories with type = 'time'
