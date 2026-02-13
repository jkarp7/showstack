-- ShowStack Licenses Table
-- Run via Supabase SQL editor or as a migration

CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('professional', 'student', 'institutional')),
  modules JSONB NOT NULL DEFAULT '[]',
  maintenance_end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own licenses"
  ON public.licenses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can claim unclaimed licenses"
  ON public.licenses FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- RPC function for license activation
CREATE OR REPLACE FUNCTION public.activate_license(p_license_key TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_license RECORD;
BEGIN
  SELECT * INTO v_license FROM public.licenses
  WHERE license_key = p_license_key AND status = 'active' FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive license key');
  END IF;

  IF v_license.user_id IS NOT NULL AND v_license.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'License already claimed by another account');
  END IF;

  UPDATE public.licenses
  SET user_id = auth.uid(),
      email = (SELECT email FROM auth.users WHERE id = auth.uid()),
      updated_at = NOW()
  WHERE id = v_license.id;

  RETURN jsonb_build_object('success', true, 'license', jsonb_build_object(
    'id', v_license.id, 'licenseKey', v_license.license_key,
    'tier', v_license.tier, 'modules', v_license.modules,
    'maintenanceEndDate', v_license.maintenance_end_date, 'status', v_license.status
  ));
END; $$;
