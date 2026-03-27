-- Create the gdtf-library storage bucket (public read, service-role write).
-- The manifest.json sync script reads from the public URL and writes using
-- the service role key (which bypasses RLS), so no explicit write policy is needed.

INSERT INTO storage.buckets (id, name, public)
VALUES ('gdtf-library', 'gdtf-library', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous public reads on all objects in the bucket.
-- (The bucket's public=true flag covers the /object/public URL path;
--  this policy covers authenticated/anon API reads via /object/authenticated.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'gdtf_library_public_read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY gdtf_library_public_read ON storage.objects
        FOR SELECT USING (bucket_id = 'gdtf-library')
    $policy$;
  END IF;
END;
$$;
