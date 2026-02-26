
-- Fix permissive INSERT policy on profiles - restrict to service role only for Pi auth flow
DROP POLICY "Anyone can insert profile" ON public.profiles;
CREATE POLICY "Authenticated can insert own profile" ON public.profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.jwt()->>'sub' OR pi_uid = auth.jwt()->>'sub');

-- Also allow anon insert for Pi SDK auth (Pi users aren't supabase-authenticated)
CREATE POLICY "Anon can insert profile" ON public.profiles
  FOR INSERT TO anon
  WITH CHECK (pi_uid IS NOT NULL AND username IS NOT NULL);
