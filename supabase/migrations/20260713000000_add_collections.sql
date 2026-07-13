-- 1. Create table collections
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- 2. Create table collection_items
CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('punchline', 'linked_text')),
    punchline_id UUID REFERENCES punchlines(id) ON DELETE CASCADE,
    text_content TEXT,
    CONSTRAINT check_item_type CHECK (
        (item_type = 'punchline' AND punchline_id IS NOT NULL AND text_content IS NULL) OR
        (item_type = 'linked_text' AND text_content IS NOT NULL AND punchline_id IS NULL)
    )
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Policies for collections (users can only access their own)
CREATE POLICY "Users can select their own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON collections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON collections FOR DELETE USING (auth.uid() = user_id);

-- Policies for collection_items (tied to collection ownership)
CREATE POLICY "Users can select their own collection items" ON collection_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_items.collection_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own collection items" ON collection_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_items.collection_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their own collection items" ON collection_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_items.collection_id AND user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_items.collection_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their own collection items" ON collection_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_items.collection_id AND user_id = auth.uid())
);

-- Grant privileges to anon, authenticated, and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE collections TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE collection_items TO anon, authenticated, service_role;

