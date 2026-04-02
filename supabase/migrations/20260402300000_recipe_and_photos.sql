-- Add recipe text and photo URLs to productions
ALTER TABLE productions ADD COLUMN recipe text;
ALTER TABLE productions ADD COLUMN recipe_photos text[] DEFAULT '{}';

-- Create storage bucket for recipe photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-photos',
  'recipe-photos',
  true,
  5242880, -- 5MB max per file (after client compression, photos will be ~100-300KB)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow authenticated (anon key) users to upload/read/delete recipe photos
CREATE POLICY "Allow public read access on recipe-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-photos');

CREATE POLICY "Allow uploads to recipe-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-photos');

CREATE POLICY "Allow deletes from recipe-photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recipe-photos');
