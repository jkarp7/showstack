-- ShowStack Licenses Table
-- Run via Supabase SQL editor or as a migration

CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('professional', 'student', 'institutional')),
  modules JSONB NOT NULL DEFAULT '[]',
  maintenance_end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common lookup patterns
CREATE INDEX idx_licenses_user_id ON public.licenses(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_licenses_email ON public.licenses(email);
CREATE INDEX idx_licenses_email_unclaimed ON public.licenses(email) WHERE user_id IS NULL AND status = 'active';

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Users can read licenses already claimed by them (user_id set)
CREATE POLICY "Users can read own licenses"
  ON public.licenses FOR SELECT USING (auth.uid() = user_id);

-- Users can read unclaimed licenses matching their email (for auto-claim window)
CREATE POLICY "Users can read licenses matching their email"
  ON public.licenses FOR SELECT USING (
    user_id IS NULL
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can claim unclaimed licenses matching their verified email
CREATE POLICY "Users can claim unclaimed licenses"
  ON public.licenses FOR UPDATE
  USING (
    user_id IS NULL
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (auth.uid() = user_id);

-- Audit table for license claim events
CREATE TABLE IF NOT EXISTS public.license_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.license_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs (no user access)
-- Admins access via Supabase dashboard

-- RPC function for email-based license claiming
-- Called on sign-in: finds an unclaimed license matching the user's email and claims it
-- Uses SECURITY DEFINER to bypass RLS for the atomic claim operation.
-- Safety: auth.uid() ensures only the authenticated user's email is used,
-- and the function only claims licenses matching that exact email.
CREATE OR REPLACE FUNCTION public.claim_license_by_email()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_license RECORD;
  v_user_email TEXT;
  v_user_id UUID;
BEGIN
  -- Verify caller is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unable to determine user email');
  END IF;

  -- Check if user already has a claimed license (prevent double-claiming)
  IF EXISTS (SELECT 1 FROM public.licenses WHERE user_id = v_user_id AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has an active license');
  END IF;

  -- Find an unclaimed license matching this email
  SELECT * INTO v_license FROM public.licenses
  WHERE email = v_user_email AND user_id IS NULL AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No unclaimed license found for this email');
  END IF;

  -- Claim the license
  UPDATE public.licenses
  SET user_id = v_user_id,
      updated_at = NOW()
  WHERE id = v_license.id;

  -- Audit log
  INSERT INTO public.license_audit_log (license_id, user_id, user_email, action, details)
  VALUES (v_license.id, v_user_id, v_user_email, 'claim_by_email', jsonb_build_object(
    'tier', v_license.tier,
    'license_key', v_license.license_key
  ));

  RETURN jsonb_build_object('success', true, 'license', jsonb_build_object(
    'id', v_license.id, 'licenseKey', v_license.license_key,
    'tier', v_license.tier, 'modules', v_license.modules,
    'maintenanceEndDate', v_license.maintenance_end_date, 'status', v_license.status
  ));
END; $$;
