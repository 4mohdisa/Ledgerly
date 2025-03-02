-- First, ensure the categories table is empty or exists
DROP TABLE IF EXISTS categories CASCADE;

-- Create the categories table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON categories;
CREATE POLICY "Allow read access to all authenticated users"
    ON categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert/update access to service_role only
DROP POLICY IF EXISTS "Allow insert/update access to service_role only" ON categories;
CREATE POLICY "Allow insert/update access to service_role only"
    ON categories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert categories
INSERT INTO categories (id, name, created_at, updated_at)
VALUES
  -- Account & Savings
  (1, 'Savings account', NOW(), NOW()),
  (2, 'Emergency savings', NOW(), NOW()),
  (3, 'Vacation savings', NOW(), NOW()),
  (4, 'Savings', NOW(), NOW()),
  
  -- Income & Investments
  (5, 'Income', NOW(), NOW()),
  (6, 'Salary', NOW(), NOW()),
  (7, 'Interest', NOW(), NOW()),
  (8, 'Investments', NOW(), NOW()),
  (9, 'Pension', NOW(), NOW()),
  (10, 'Child benefits', NOW(), NOW()),
  
  -- Transportation
  (11, 'Public transport', NOW(), NOW()),
  (12, 'Car costs', NOW(), NOW()),
  (13, 'Car insurance', NOW(), NOW()),
  (14, 'Car loan', NOW(), NOW()),
  (15, 'Gas', NOW(), NOW()),
  (16, 'Parking', NOW(), NOW()),
  (17, 'Flight', NOW(), NOW()),
  (18, 'Taxi', NOW(), NOW()),
  (19, 'Transportation', NOW(), NOW()),
  (20, 'Repair', NOW(), NOW()),
  
  -- Entertainment
  (21, 'Entertainment', NOW(), NOW()),
  (22, 'Bowling', NOW(), NOW()),
  (23, 'Cinema', NOW(), NOW()),
  (24, 'Concert', NOW(), NOW()),
  (25, 'Nightclub', NOW(), NOW()),
  (26, 'Sports', NOW(), NOW()),
  (27, 'Gym', NOW(), NOW()),
  (28, 'Hobby', NOW(), NOW()),
  (29, 'Vacation', NOW(), NOW()),
  
  -- Food & Drinks
  (30, 'Food', NOW(), NOW()),
  (31, 'Groceries', NOW(), NOW()),
  (32, 'Restaurant', NOW(), NOW()),
  (33, 'Coffee', NOW(), NOW()),
  (34, 'Drinks', NOW(), NOW()),
  (35, 'Candy', NOW(), NOW()),
  
  -- Housing & Utilities
  (36, 'Housing', NOW(), NOW()),
  (37, 'Rent', NOW(), NOW()),
  (38, 'Bills', NOW(), NOW()),
  (39, 'Electricity', NOW(), NOW()),
  (40, 'Water', NOW(), NOW()),
  (41, 'Internet', NOW(), NOW()),
  (42, 'TV', NOW(), NOW()),
  (43, 'Telephone', NOW(), NOW()),
  (44, 'Home supplies', NOW(), NOW()),
  (45, 'Maintenance', NOW(), NOW()),
  
  -- Healthcare & Personal
  (46, 'Healthcare', NOW(), NOW()),
  (47, 'Doctor', NOW(), NOW()),
  (48, 'Dentist', NOW(), NOW()),
  (49, 'Pharmacy', NOW(), NOW()),
  
  -- Shopping & Lifestyle
  (50, 'Shopping', NOW(), NOW()),
  (51, 'Clothes', NOW(), NOW()),
  (52, 'Electronics', NOW(), NOW()),
  (53, 'Lifestyle', NOW(), NOW()),
  
  -- Other
  (54, 'Bank', NOW(), NOW()),
  (55, 'Bank cost', NOW(), NOW()),
  (56, 'Insurance', NOW(), NOW()),
  (57, 'Loan', NOW(), NOW()),
  (58, 'Student loan', NOW(), NOW()),
  (59, 'Service', NOW(), NOW()),
  (60, 'Subscription', NOW(), NOW()),
  (61, 'Taxes', NOW(), NOW()),
  (62, 'Office expenses', NOW(), NOW()),
  (63, 'Work', NOW(), NOW()),
  (64, 'Education', NOW(), NOW()),
  (65, 'Gift', NOW(), NOW()),
  (66, 'Charity', NOW(), NOW()),
  (67, 'Child care', NOW(), NOW()),
  (68, 'Community', NOW(), NOW()),
  (69, 'Pet', NOW(), NOW()),
  (70, 'Hotel', NOW(), NOW()),
  (71, 'Travel', NOW(), NOW()),
  (72, 'Miscellaneous', NOW(), NOW()),
  (73, 'Unknown', NOW(), NOW()),
  (74, 'Test', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    updated_at = NOW();
