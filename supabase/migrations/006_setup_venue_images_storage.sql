-- Create storage bucket for venue background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-images', 'venue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload venue images
CREATE POLICY "Authenticated users can upload venue images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'venue-images');

-- Allow authenticated users to update their organization's venue images
CREATE POLICY "Users can update their venue images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'venue-images');

-- Allow authenticated users to delete their venue images
CREATE POLICY "Users can delete their venue images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'venue-images');

-- Allow public read access to venue images
CREATE POLICY "Public can read venue images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'venue-images');
