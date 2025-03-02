-- First, drop existing foreign key if it exists
ALTER TABLE IF EXISTS transactions 
  DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;

-- Add foreign key constraint
ALTER TABLE transactions 
  ADD CONSTRAINT transactions_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;
