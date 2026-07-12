-- Add user_id to categories and statuses
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE statuses ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Update existing rows to belong to the first user
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    IF first_user_id IS NOT NULL THEN
        UPDATE categories SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE statuses SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Drop global unique constraints
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE statuses DROP CONSTRAINT IF EXISTS statuses_name_key;

-- Add user-specific unique constraints
ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name);
ALTER TABLE statuses ADD CONSTRAINT statuses_user_id_name_key UNIQUE (user_id, name);

-- Drop previous policies
DROP POLICY IF EXISTS "Authorized Select" ON categories;
DROP POLICY IF EXISTS "Authorized Insert" ON categories;
DROP POLICY IF EXISTS "Authorized Update" ON categories;
DROP POLICY IF EXISTS "Authorized Delete" ON categories;

DROP POLICY IF EXISTS "Authorized Select" ON statuses;
DROP POLICY IF EXISTS "Authorized Insert" ON statuses;
DROP POLICY IF EXISTS "Authorized Update" ON statuses;
DROP POLICY IF EXISTS "Authorized Delete" ON statuses;

-- Create user-specific policies for categories
CREATE POLICY "User Select" ON categories FOR SELECT TO authenticated USING (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Insert" ON categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Update" ON categories FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_authorized()) WITH CHECK (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Delete" ON categories FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_authorized());

-- Create user-specific policies for statuses
CREATE POLICY "User Select" ON statuses FOR SELECT TO authenticated USING (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Insert" ON statuses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Update" ON statuses FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_authorized()) WITH CHECK (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Delete" ON statuses FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_authorized());
