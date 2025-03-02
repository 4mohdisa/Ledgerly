-- Insert default categories
INSERT INTO categories (name, description, is_default)
VALUES 
    ('Savings', 'General savings category', true),
    ('Emergency Fund', 'Emergency savings', true),
    ('Vacation Fund', 'Vacation savings', true),
    ('Income', 'General income', true),
    ('Salary', 'Regular employment income', true),
    ('Investments', 'Investment returns', true),
    ('Housing', 'Housing and accommodation expenses', true),
    ('Transportation', 'Transportation costs', true),
    ('Food & Dining', 'Food and dining expenses', true),
    ('Utilities', 'Utility bills', true),
    ('Healthcare', 'Healthcare expenses', true),
    ('Entertainment', 'Entertainment and recreation', true),
    ('Shopping', 'General shopping', true),
    ('Education', 'Education expenses', true),
    ('Personal Care', 'Personal care expenses', true)
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    is_default = EXCLUDED.is_default,
    updated_at = NOW()
RETURNING id, name;
