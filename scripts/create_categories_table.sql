-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policy for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all authenticated users"
    ON categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert/update access to service_role only
CREATE POLICY "Allow insert/update access to service_role only"
    ON categories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
