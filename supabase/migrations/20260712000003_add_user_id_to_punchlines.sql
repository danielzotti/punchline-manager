-- Add user_id to punchlines
ALTER TABLE punchlines ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Update existing punchlines to belong to the first admin, or just leave them null if we don't enforce NOT NULL
-- Let's enforce NOT NULL but we need to handle existing rows if there are any.
-- If there are no existing auth.users, this could fail if we try to set it.
-- Let's try to update existing rows to a user if any exists.
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    IF first_user_id IS NOT NULL THEN
        UPDATE punchlines SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Drop previous policies
DROP POLICY IF EXISTS "Authorized Select" ON punchlines;
DROP POLICY IF EXISTS "Authorized Insert" ON punchlines;
DROP POLICY IF EXISTS "Authorized Update" ON punchlines;
DROP POLICY IF EXISTS "Authorized Delete" ON punchlines;

-- Create user-specific policies
CREATE POLICY "User Select" ON punchlines FOR SELECT TO authenticated USING (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Insert" ON punchlines FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Update" ON punchlines FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_authorized()) WITH CHECK (auth.uid() = user_id AND is_authorized());
CREATE POLICY "User Delete" ON punchlines FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_authorized());

-- Update punchline_categories policies to ensure users can only modify categories of their own punchlines
DROP POLICY IF EXISTS "Authorized Select" ON punchline_categories;
DROP POLICY IF EXISTS "Authorized Insert" ON punchline_categories;
DROP POLICY IF EXISTS "Authorized Update" ON punchline_categories;
DROP POLICY IF EXISTS "Authorized Delete" ON punchline_categories;

CREATE POLICY "User Select PC" ON punchline_categories FOR SELECT TO authenticated USING (
    is_authorized() AND EXISTS (
        SELECT 1 FROM punchlines WHERE id = punchline_categories.punchline_id AND user_id = auth.uid()
    )
);

CREATE POLICY "User Insert PC" ON punchline_categories FOR INSERT TO authenticated WITH CHECK (
    is_authorized() AND EXISTS (
        SELECT 1 FROM punchlines WHERE id = punchline_categories.punchline_id AND user_id = auth.uid()
    )
);

CREATE POLICY "User Update PC" ON punchline_categories FOR UPDATE TO authenticated USING (
    is_authorized() AND EXISTS (
        SELECT 1 FROM punchlines WHERE id = punchline_categories.punchline_id AND user_id = auth.uid()
    )
) WITH CHECK (
    is_authorized() AND EXISTS (
        SELECT 1 FROM punchlines WHERE id = punchline_categories.punchline_id AND user_id = auth.uid()
    )
);

CREATE POLICY "User Delete PC" ON punchline_categories FOR DELETE TO authenticated USING (
    is_authorized() AND EXISTS (
        SELECT 1 FROM punchlines WHERE id = punchline_categories.punchline_id AND user_id = auth.uid()
    )
);

