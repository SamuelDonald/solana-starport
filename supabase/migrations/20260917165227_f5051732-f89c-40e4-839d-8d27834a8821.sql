CREATE POLICY "Token images are server-only"
ON storage.objects FOR SELECT TO anon, authenticated
USING (false);