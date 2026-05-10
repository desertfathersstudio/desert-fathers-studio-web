-- Add "Door of Prophecies Pack" category
INSERT INTO categories (name)
VALUES ('Door of Prophecies Pack')
ON CONFLICT (name) DO NOTHING;
