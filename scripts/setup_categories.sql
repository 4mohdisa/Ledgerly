-- Drop and recreate categories table
DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read categories
CREATE POLICY "Enable read access for authenticated users"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

-- Create policy for service role to manage categories
CREATE POLICY "Enable all access for service role"
    ON categories FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert categories
INSERT INTO categories (id, name, created_at, updated_at)
SELECT * FROM (
    VALUES 
        (1, 'Savings account', NOW(), NOW()),
        (2, 'Emergency savings', NOW(), NOW()),
        (3, 'Vacation savings', NOW(), NOW()),
        (4, 'Savings', NOW(), NOW()),
        (5, 'Income', NOW(), NOW())
        -- Add more categories as needed
) AS data(id, name, created_at, updated_at)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    updated_at = NOW();

-- Verify foreign key in transactions table
DO $$ 
BEGIN
    -- Check if the foreign key exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_category_id_fkey'
    ) THEN
        -- Add the foreign key if it doesn't exist
        ALTER TABLE transactions
        ADD CONSTRAINT transactions_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES categories(id);
    END IF;
END $$;
