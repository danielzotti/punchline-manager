-- Add position and color columns to statuses table
ALTER TABLE statuses ADD COLUMN position INT NOT NULL DEFAULT 0;
ALTER TABLE statuses ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#6366f1';

-- Update seed/known statuses with specific colors and positions
UPDATE statuses SET position = 1, color = '#94a3b8' WHERE name = 'draft';
UPDATE statuses SET position = 2, color = '#f59e0b' WHERE name = 'da espandere';
UPDATE statuses SET position = 3, color = '#10b981' WHERE name = 'pronta';

-- Assign unique sequential positions starting from 4 to any other statuses
WITH numbered_statuses AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name) + 3 AS new_pos
    FROM statuses
    WHERE name NOT IN ('draft', 'da espandere', 'pronta')
)
UPDATE statuses
SET position = numbered_statuses.new_pos
FROM numbered_statuses
WHERE statuses.id = numbered_statuses.id;
