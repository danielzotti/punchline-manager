-- Drop existing public policies
DROP POLICY IF EXISTS "Public Select" ON statuses;
DROP POLICY IF EXISTS "Public Insert" ON statuses;
DROP POLICY IF EXISTS "Public Update" ON statuses;
DROP POLICY IF EXISTS "Public Delete" ON statuses;

DROP POLICY IF EXISTS "Public Select" ON categories;
DROP POLICY IF EXISTS "Public Insert" ON categories;
DROP POLICY IF EXISTS "Public Update" ON categories;
DROP POLICY IF EXISTS "Public Delete" ON categories;

DROP POLICY IF EXISTS "Public Select" ON punchlines;
DROP POLICY IF EXISTS "Public Insert" ON punchlines;
DROP POLICY IF EXISTS "Public Update" ON punchlines;
DROP POLICY IF EXISTS "Public Delete" ON punchlines;

DROP POLICY IF EXISTS "Public Select" ON punchline_categories;
DROP POLICY IF EXISTS "Public Insert" ON punchline_categories;
DROP POLICY IF EXISTS "Public Update" ON punchline_categories;
DROP POLICY IF EXISTS "Public Delete" ON punchline_categories;

-- Create authorized_users table
CREATE TABLE authorized_users (
    email VARCHAR(255) PRIMARY KEY,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on authorized_users
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Helper functions to check authentication and authorization status
CREATE OR REPLACE FUNCTION is_authorized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.authorized_users
        WHERE email = auth.jwt() ->> 'email'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.authorized_users
        WHERE email = auth.jwt() ->> 'email' AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for authorized_users
CREATE POLICY "Allow select for all authenticated" ON authorized_users 
    FOR SELECT TO authenticated 
    USING (true);


CREATE POLICY "Allow write for admin" ON authorized_users 
    FOR ALL TO authenticated 
    USING (is_admin()) 
    WITH CHECK (is_admin());

-- Policies for statuses
CREATE POLICY "Authorized Select" ON statuses FOR SELECT TO authenticated USING (is_authorized());
CREATE POLICY "Authorized Insert" ON statuses FOR INSERT TO authenticated WITH CHECK (is_authorized());
CREATE POLICY "Authorized Update" ON statuses FOR UPDATE TO authenticated USING (is_authorized()) WITH CHECK (is_authorized());
CREATE POLICY "Authorized Delete" ON statuses FOR DELETE TO authenticated USING (is_authorized());

-- Policies for categories
CREATE POLICY "Authorized Select" ON categories FOR SELECT TO authenticated USING (is_authorized());
CREATE POLICY "Authorized Insert" ON categories FOR INSERT TO authenticated WITH CHECK (is_authorized());
CREATE POLICY "Authorized Update" ON categories FOR UPDATE TO authenticated USING (is_authorized()) WITH CHECK (is_authorized());
CREATE POLICY "Authorized Delete" ON categories FOR DELETE TO authenticated USING (is_authorized());

-- Policies for punchlines
CREATE POLICY "Authorized Select" ON punchlines FOR SELECT TO authenticated USING (is_authorized());
CREATE POLICY "Authorized Insert" ON punchlines FOR INSERT TO authenticated WITH CHECK (is_authorized());
CREATE POLICY "Authorized Update" ON punchlines FOR UPDATE TO authenticated USING (is_authorized()) WITH CHECK (is_authorized());
CREATE POLICY "Authorized Delete" ON punchlines FOR DELETE TO authenticated USING (is_authorized());

-- Policies for punchline_categories
CREATE POLICY "Authorized Select" ON punchline_categories FOR SELECT TO authenticated USING (is_authorized());
CREATE POLICY "Authorized Insert" ON punchline_categories FOR INSERT TO authenticated WITH CHECK (is_authorized());
CREATE POLICY "Authorized Update" ON punchline_categories FOR UPDATE TO authenticated USING (is_authorized()) WITH CHECK (is_authorized());
CREATE POLICY "Authorized Delete" ON punchline_categories FOR DELETE TO authenticated USING (is_authorized());

-- Trigger to make the first user who signs up an admin automatically
CREATE OR REPLACE FUNCTION handle_first_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.authorized_users) THEN
        INSERT INTO public.authorized_users (email, is_admin)
        VALUES (NEW.email, true)
        ON CONFLICT (email) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_first_user_signup();

-- Grant permissions for authorized_users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.authorized_users TO anon, authenticated, service_role;

