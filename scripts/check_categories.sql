-- Check if categories table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'categories'
);

-- Check categories table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'categories';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'categories';

-- Count categories
SELECT COUNT(*) FROM categories;

-- List all categories
SELECT * FROM categories ORDER BY id;
