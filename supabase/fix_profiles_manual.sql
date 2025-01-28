-- Drop existing table and its dependencies
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate the profiles table with the correct structure
CREATE TABLE profiles (
    id text PRIMARY KEY,  -- Changed back to text to match Clerk's user ID format
    email text,
    name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
    ON profiles 
    FOR SELECT 
    USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" 
    ON profiles 
    FOR UPDATE 
    USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile" 
    ON profiles 
    FOR INSERT 
    WITH CHECK (auth.uid()::text = id);
