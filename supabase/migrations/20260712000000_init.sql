-- 1. Create table statuses
CREATE TABLE statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Create table categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 3. Create table punchlines
CREATE TABLE punchlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    notes TEXT,
    status_id UUID REFERENCES statuses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Create table punchline_categories
CREATE TABLE punchline_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punchline_id UUID REFERENCES punchlines(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(punchline_id, category_id)
);

-- Enable RLS on all tables
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE punchlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE punchline_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (allow everything in local mode)
CREATE POLICY "Public Select" ON statuses FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert" ON statuses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Update" ON statuses FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete" ON statuses FOR DELETE TO public USING (true);

CREATE POLICY "Public Select" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert" ON categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Update" ON categories FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete" ON categories FOR DELETE TO public USING (true);

CREATE POLICY "Public Select" ON punchlines FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert" ON punchlines FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Update" ON punchlines FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete" ON punchlines FOR DELETE TO public USING (true);

CREATE POLICY "Public Select" ON punchline_categories FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert" ON punchline_categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Update" ON punchline_categories FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete" ON punchline_categories FOR DELETE TO public USING (true);

-- Trigger to update updated_at for punchlines
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_punchlines_updated_at
    BEFORE UPDATE ON punchlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant privileges to anon, authenticated, and service_role
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

