// Authoritative Supabase PostgreSQL Schema & Security Script
// Kept in 100% sync with root /supabase-schema.sql
export const sqlSchemaCode = `-- =========================================================================
-- AI Communication Coach: Hardened Supabase PostgreSQL Schema & Migrations
-- Version: 2.0 (Security Hardened, Zero-Trust RLS, Anti-Cheating & Concurrency-Safe)
-- Designed for: Fresh Projects AND Existing Databases (Safe Idempotent Migrations)
-- Privacy-First: Zero Audio/Video Storage & Zero Speech Transcripts Stored
-- Timezone: Indian Standard Time (Asia/Kolkata) Calendar Streaks
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Base Tables Creation (Safe for fresh projects where tables don't exist yet)

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  college_or_company TEXT DEFAULT 'College Student',
  target_role TEXT DEFAULT 'Fresher / Candidate',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  highest_streak INTEGER NOT NULL DEFAULT 0 CHECK (highest_streak >= 0),
  total_practices INTEGER NOT NULL DEFAULT 0 CHECK (total_practices >= 0),
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.practice_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  topic_id TEXT NOT NULL,
  topic_title TEXT NOT NULL,
  category TEXT DEFAULT 'Campus Placement',
  mode TEXT NOT NULL CHECK (mode IN ('video', 'audio')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  wpm INTEGER NOT NULL CHECK (wpm >= 0 AND wpm <= 500),
  filler_count INTEGER NOT NULL CHECK (filler_count >= 0),
  filler_rate_per_min NUMERIC NOT NULL DEFAULT 0 CHECK (filler_rate_per_min >= 0),
  word_count INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0 AND duration_seconds <= 7200),
  primary_issue TEXT DEFAULT 'General practice',
  posture_score NUMERIC CHECK (posture_score IS NULL OR (posture_score >= 0 AND posture_score <= 1)),
  gesture_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  date_str TEXT NOT NULL
);

-- 3. Explicit Migrations for Existing Tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_or_company TEXT DEFAULT 'College Student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'Fresher / Candidate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS highest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_practices INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_practiced_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS user_email TEXT DEFAULT '';
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS topic_id TEXT DEFAULT '';
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS topic_title TEXT DEFAULT '';
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Campus Placement';
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'video';
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS wpm INTEGER DEFAULT 0;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS filler_count INTEGER DEFAULT 0;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS filler_rate_per_min NUMERIC DEFAULT 0;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS primary_issue TEXT DEFAULT 'General practice';
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS posture_score NUMERIC;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS gesture_status TEXT;
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.practice_stats ADD COLUMN IF NOT EXISTS date_str TEXT DEFAULT '';

-- 3B. Backfill NULL Values on Existing Rows to Satisfy Invariants
UPDATE public.profiles SET display_name = '' WHERE display_name IS NULL;
UPDATE public.profiles SET college_or_company = 'College Student' WHERE college_or_company IS NULL;
UPDATE public.profiles SET target_role = 'Fresher / Candidate' WHERE target_role IS NULL;
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;
UPDATE public.profiles SET current_streak = 0 WHERE current_streak IS NULL;
UPDATE public.profiles SET highest_streak = 0 WHERE highest_streak IS NULL;
UPDATE public.profiles SET total_practices = 0 WHERE total_practices IS NULL;
UPDATE public.profiles SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
UPDATE public.profiles SET updated_at = timezone('utc'::text, now()) WHERE updated_at IS NULL;

UPDATE public.practice_stats SET user_name = '' WHERE user_name IS NULL;
UPDATE public.practice_stats SET category = 'Campus Placement' WHERE category IS NULL;
UPDATE public.practice_stats SET mode = 'video' WHERE mode IS NULL;
UPDATE public.practice_stats SET score = 0 WHERE score IS NULL;
UPDATE public.practice_stats SET wpm = 0 WHERE wpm IS NULL;
UPDATE public.practice_stats SET filler_count = 0 WHERE filler_count IS NULL;
UPDATE public.practice_stats SET filler_rate_per_min = 0 WHERE filler_rate_per_min IS NULL;
UPDATE public.practice_stats SET word_count = 0 WHERE word_count IS NULL;
UPDATE public.practice_stats SET duration_seconds = 0 WHERE duration_seconds IS NULL;
UPDATE public.practice_stats SET primary_issue = 'General practice' WHERE primary_issue IS NULL;
UPDATE public.practice_stats SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
UPDATE public.practice_stats SET date_str = (created_at AT TIME ZONE 'Asia/Kolkata')::DATE::TEXT WHERE date_str IS NULL OR date_str = '';

-- 4. Optimized Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_practice_stats_user_id ON public.practice_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_stats_user_created ON public.practice_stats(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_stats_created_at ON public.practice_stats(created_at DESC);

-- 5. Revoke Insecure Default Grants & Setup Table Privileges
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.practice_stats FROM anon;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, DELETE ON public.practice_stats TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.practice_stats TO service_role;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_stats ENABLE ROW LEVEL SECURITY;

-- 7. Verified Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_email TEXT;
  v_verified BOOLEAN;
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT 
    LOWER(COALESCE(email, '')), 
    (email_confirmed_at IS NOT NULL)
  INTO v_email, v_verified
  FROM auth.users
  WHERE id = auth.uid();

  IF v_verified IS NOT TRUE OR v_email = '' THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN (v_role = 'admin');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 8. Explicit Initial Administrator Provisioning Function
CREATE OR REPLACE FUNCTION public.promote_initial_admin(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_confirmed_at TIMESTAMPTZ;
  clean_email TEXT;
BEGIN
  clean_email := LOWER(TRIM(admin_email));

  SELECT id, email_confirmed_at INTO v_user_id, v_confirmed_at
  FROM auth.users
  WHERE LOWER(email) = clean_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist in auth.users. Please sign up first.', clean_email;
  END IF;

  IF v_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Email % is not yet confirmed. Please verify the email address before admin promotion.', clean_email;
  END IF;

  UPDATE public.profiles
  SET role = 'admin', updated_at = timezone('utc'::text, now())
  WHERE id = v_user_id;

  RETURN 'SUCCESS: User ' || clean_email || ' (ID: ' || v_user_id || ') has been successfully promoted to admin.';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.promote_initial_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_initial_admin(TEXT) TO service_role;

-- 9. Profile Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Security Violation: Ordinary users cannot modify their account role or promote themselves to admin.';
    END IF;

    IF (NEW.current_streak IS DISTINCT FROM OLD.current_streak) OR
       (NEW.highest_streak IS DISTINCT FROM OLD.highest_streak) OR
       (NEW.total_practices IS DISTINCT FROM OLD.total_practices) OR
       (NEW.last_practiced_at IS DISTINCT FROM OLD.last_practiced_at) THEN
      RAISE EXCEPTION 'Security Violation: Practice streaks and totals are system-calculated and cannot be manually altered.';
    END IF;
  END IF;

  NEW.id := OLD.id;
  NEW.email := OLD.email;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 10. Practice Stat Validation & Sanitization Trigger
CREATE OR REPLACE FUNCTION public.validate_practice_stat_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.user_id := auth.uid();
  END IF;

  SELECT email, display_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Invalid user_id: Profile record does not exist for ID %', NEW.user_id;
  END IF;

  NEW.user_email := v_user_email;
  IF NEW.user_name IS NULL OR TRIM(NEW.user_name) = '' THEN
    NEW.user_name := COALESCE(v_user_name, split_part(v_user_email, '@', 1));
  END IF;

  IF NEW.score < 0 OR NEW.score > 100 THEN
    RAISE EXCEPTION 'Invalid metric: Score must be between 0 and 100.';
  END IF;
  IF NEW.wpm < 0 OR NEW.wpm > 500 THEN
    RAISE EXCEPTION 'Invalid metric: WPM must be between 0 and 500.';
  END IF;
  IF NEW.filler_count < 0 THEN
    NEW.filler_count := 0;
  END IF;
  IF NEW.duration_seconds < 0 OR NEW.duration_seconds > 7200 THEN
    RAISE EXCEPTION 'Invalid metric: Duration exceeds realistic practice threshold (0-7200s).';
  END IF;

  IF NEW.created_at IS NULL THEN
    NEW.created_at := timezone('utc'::text, now());
  END IF;
  NEW.date_str := (NEW.created_at AT TIME ZONE 'Asia/Kolkata')::DATE::TEXT;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_practice_stat_insert ON public.practice_stats;
CREATE TRIGGER tr_validate_practice_stat_insert
  BEFORE INSERT ON public.practice_stats
  FOR EACH ROW EXECUTE FUNCTION public.validate_practice_stat_insert();

-- 11. Authoritative Streak & Totals Calculator (Concurrency-Safe with Row Locking)
CREATE OR REPLACE FUNCTION public.handle_practice_stat_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_last_practice TIMESTAMPTZ;
  v_curr_streak INT;
  v_high_streak INT;
  v_total_practices INT;
  v_session_date DATE;
  v_last_date DATE;
  v_day_diff INT;
  v_is_future_or_current BOOLEAN;
BEGIN
  SELECT last_practiced_at, current_streak, highest_streak, total_practices
  INTO v_last_practice, v_curr_streak, v_high_streak, v_total_practices
  FROM public.profiles 
  WHERE id = NEW.user_id
  FOR UPDATE;

  v_total_practices := COALESCE(v_total_practices, 0) + 1;
  v_session_date := (NEW.created_at AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_is_future_or_current := (v_last_practice IS NULL) OR (NEW.created_at >= v_last_practice);

  IF v_last_practice IS NULL THEN
    v_curr_streak := 1;
    v_last_practice := NEW.created_at;
  ELSIF v_is_future_or_current THEN
    v_last_date := (v_last_practice AT TIME ZONE 'Asia/Kolkata')::DATE;
    v_day_diff := v_session_date - v_last_date;

    IF v_day_diff = 0 THEN
      v_curr_streak := GREATEST(COALESCE(v_curr_streak, 1), 1);
    ELSIF v_day_diff = 1 THEN
      v_curr_streak := COALESCE(v_curr_streak, 0) + 1;
    ELSE
      v_curr_streak := 1;
    END IF;

    v_last_practice := NEW.created_at;
  ELSE
    v_curr_streak := GREATEST(COALESCE(v_curr_streak, 1), 1);
  END IF;

  v_high_streak := GREATEST(COALESCE(v_high_streak, 0), v_curr_streak);

  UPDATE public.profiles
  SET
    current_streak = v_curr_streak,
    highest_streak = v_high_streak,
    total_practices = v_total_practices,
    last_practiced_at = v_last_practice,
    updated_at = timezone('utc'::text, now())
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_practice_stat_insert ON public.practice_stats;
CREATE TRIGGER tr_handle_practice_stat_insert
  AFTER INSERT ON public.practice_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_practice_stat_insert();

-- 12. Row Level Security Policies for PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR ALL USING (public.is_admin());

-- 13. Row Level Security Policies for PRACTICE_STATS
DROP POLICY IF EXISTS "Users can view own stats" ON public.practice_stats;
DROP POLICY IF EXISTS "Admins can view all stats" ON public.practice_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON public.practice_stats;
DROP POLICY IF EXISTS "Users can delete own stats" ON public.practice_stats;
DROP POLICY IF EXISTS "Admins can manage all stats" ON public.practice_stats;

CREATE POLICY "Users can view own stats" ON public.practice_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all stats" ON public.practice_stats FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can delete own stats" ON public.practice_stats FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all stats" ON public.practice_stats FOR ALL USING (public.is_admin());

-- 14. Safe Auth Hook: Provision Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, display_name, college_or_company, target_role, role, current_streak, highest_streak, total_practices
  ) VALUES (
    NEW.id,
    LOWER(NEW.email),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'displayName', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'collegeOrCompany', ''), 'College Student'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'targetRole', ''), 'Fresher / Candidate'),
    'user',
    0, 0, 0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(NULLIF(public.profiles.display_name, ''), EXCLUDED.display_name),
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING 'User with email % already registered under a different auth ID. Preserving original ownership.', NEW.email;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Unexpected error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
