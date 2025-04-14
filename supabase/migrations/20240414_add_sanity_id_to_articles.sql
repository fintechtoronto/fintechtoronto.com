-- Add sanity_id column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS sanity_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS articles_sanity_id_idx ON articles(sanity_id);

-- Add comment to explain the column
COMMENT ON COLUMN articles.sanity_id IS 'Reference to the document ID in Sanity CMS'; 