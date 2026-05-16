-- Add "Great Lent Pack" category
INSERT INTO categories (name)
VALUES ('Great Lent Pack')
ON CONFLICT (name) DO NOTHING;
