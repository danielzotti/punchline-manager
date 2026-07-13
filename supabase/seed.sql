-- Seed statuses
INSERT INTO statuses (name) VALUES 
('draft'),
('da espandere'),
('pronta')
ON CONFLICT (user_id, name) DO NOTHING;

-- Seed categories
INSERT INTO categories (name) VALUES 
('Programmazione'),
('Papere fisiche'),
('Freddure'),
('Humor Nero'),
('Giochi di parole')
ON CONFLICT (user_id, name) DO NOTHING;


-- Seed punchlines & punchline_categories
-- We can do this with inline selects or just let the user create them. Let's add a few!
DO $$
DECLARE
    draft_id UUID;
    expand_id UUID;
    ready_id UUID;
    prog_id UUID;
    fred_id UUID;
    joke_id_1 UUID;
    joke_id_2 UUID;
BEGIN
    SELECT id INTO draft_id FROM statuses WHERE name = 'draft';
    SELECT id INTO expand_id FROM statuses WHERE name = 'da espandere';
    SELECT id INTO ready_id FROM statuses WHERE name = 'pronta';

    SELECT id INTO prog_id FROM categories WHERE name = 'Programmazione';
    SELECT id INTO fred_id FROM categories WHERE name = 'Freddure';

    -- Insert Punchline 1
    INSERT INTO punchlines (text, notes, status_id)
    VALUES ('Ci sono 10 tipi di persone al mondo: chi capisce il binario e chi no.', 'Una punchline classica della programmazione.', ready_id)
    RETURNING id INTO joke_id_1;

    -- Map Punchline 1 to Programmazione and Freddure
    INSERT INTO punchline_categories (punchline_id, category_id)
    VALUES (joke_id_1, prog_id), (joke_id_1, fred_id);

    -- Insert Punchline 2
    INSERT INTO punchlines (text, notes, status_id)
    VALUES ('Perché i programmatori preferiscono il buio? Perché la luce attira i bug!', 'Utile da espandere con altre varianti.', expand_id)
    RETURNING id INTO joke_id_2;

    -- Map Punchline 2 to Programmazione
    INSERT INTO punchline_categories (punchline_id, category_id)
    VALUES (joke_id_2, prog_id);
END $$;
