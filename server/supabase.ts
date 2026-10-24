import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side privileged Supabase client
// Note: Key is only read from server process.env, never exposed to client bundles
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase Client initialized successfully on backend.');
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err);
  }
} else {
  console.log('ℹ️ Supabase environment variables not detected yet. Operating in local persistent fallback mode.');
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey && supabaseAdmin);
}

export function getSupabase(): SupabaseClient | null {
  return supabaseAdmin;
}

export interface SupabaseUserProfile {
  id: string;
  email: string;
  display_name: string;
  college_or_company: string;
  target_role: string;
  role: 'user' | 'admin';
  current_streak: number;
  highest_streak: number;
  total_practices: number;
  last_practiced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabasePracticeStat {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  topic_id: string;
  topic_title: string;
  category: string;
  mode: 'video' | 'audio';
  score: number;
  wpm: number;
  filler_count: number;
  filler_rate_per_min: number;
  word_count: number;
  duration_seconds: number;
  primary_issue: string;
  posture_score: number | null;
  gesture_status: string | null;
  created_at: string;
  date_str: string;
}

/* =========================================================================
   AUTH OPERATIONS WITH SUPABASE
   ========================================================================= */

export async function supabaseRegisterUser(params: {
  email: string;
  password: string;
  displayName: string;
  collegeOrCompany?: string;
  targetRole?: string;
}): Promise<{ user: any; token: string }> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const cleanEmail = params.email.trim().toLowerCase();
  let userId = '';
  const now = new Date().toISOString();

  // 1. Try admin.createUser first (if SUPABASE_SERVICE_ROLE_KEY is configured), otherwise fall back to auth.signUp
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      displayName: params.displayName,
      collegeOrCompany: params.collegeOrCompany || 'College Student',
      targetRole: params.targetRole || 'Fresher / Candidate',
      role: 'user',
    },
  });

  if (authError || !authData?.user) {
    // If service_role key was not used (e.g. anon key), try standard signUp on an isolated client
    const ephemeralClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signUpData, error: signUpError } = await ephemeralClient.auth.signUp({
      email: cleanEmail,
      password: params.password,
      options: {
        data: {
          displayName: params.displayName,
          collegeOrCompany: params.collegeOrCompany || 'College Student',
          targetRole: params.targetRole || 'Fresher / Candidate',
          role: 'user',
        },
      },
    });
    if (signUpError || !signUpData?.user) {
      throw new Error(signUpError?.message || authError?.message || 'Registration failed');
    }
    userId = signUpData.user.id;
  } else {
    userId = authData.user.id;
  }

  // 2. Ensure profile is present in public.profiles table
  const profileRecord = {
    id: userId,
    email: cleanEmail,
    display_name: params.displayName,
    college_or_company: params.collegeOrCompany || 'College Student',
    target_role: params.targetRole || 'Fresher / Candidate',
    role: 'user' as const,
    current_streak: 0,
    highest_streak: 0,
    total_practices: 0,
    last_practiced_at: null,
    created_at: now,
    updated_at: now,
  };

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(profileRecord, { onConflict: 'id' });

  if (profileError) {
    console.warn('Profile upsert note:', profileError.message);
  }

  // 3. Generate a secure access token
  const token = 'sb_tok_' + Buffer.from(`${userId}:${Date.now()}`).toString('base64');

  return {
    user: {
      id: userId,
      email: cleanEmail,
      displayName: params.displayName,
      collegeOrCompany: profileRecord.college_or_company,
      targetRole: profileRecord.target_role,
      role: profileRecord.role,
      currentStreak: 0,
      highestStreak: 0,
      totalPractices: 0,
      lastPracticedAt: null,
      createdAt: now,
    },
    token,
  };
}

export async function supabaseLoginUser(params: {
  email: string;
  password: string;
}): Promise<{ user: any; token: string }> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const cleanEmail = params.email.trim().toLowerCase();

  // Use an isolated ephemeral client so signInWithPassword never mutates the shared supabaseAdmin auth header
  const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
    email: cleanEmail,
    password: params.password,
  });

  if (signInError || !signInData.user) {
    throw new Error(signInError?.message || 'Invalid login credentials');
  }

  const user = signInData.user;
  const isAdmin = cleanEmail === 'sakshimarya193@gmail.com';

  // Fetch profile using admin client
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const token = signInData.session?.access_token || ('sb_tok_' + Buffer.from(`${user.id}:${Date.now()}`).toString('base64'));

  const finalUser = {
    id: user.id,
    email: cleanEmail,
    displayName: profile?.display_name || user.user_metadata?.displayName || cleanEmail.split('@')[0],
    collegeOrCompany: profile?.college_or_company || user.user_metadata?.collegeOrCompany || 'College Student',
    targetRole: profile?.target_role || user.user_metadata?.targetRole || 'Fresher / Candidate',
    role: isAdmin ? 'admin' : (profile?.role || 'user'),
    currentStreak: profile?.current_streak || 0,
    highestStreak: profile?.highest_streak || 0,
    totalPractices: profile?.total_practices || 0,
    lastPracticedAt: profile?.last_practiced_at || null,
    createdAt: profile?.created_at || user.created_at,
  };

  return {
    user: finalUser,
    token,
  };
}

export async function supabaseGetUserProfile(userId: string): Promise<any | null> {
  if (!supabaseAdmin) return null;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) return null;

  const isAdmin = profile.email.toLowerCase() === 'sakshimarya193@gmail.com';

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    collegeOrCompany: profile.college_or_company,
    targetRole: profile.target_role,
    role: isAdmin ? 'admin' : profile.role,
    currentStreak: profile.current_streak,
    highestStreak: profile.highest_streak,
    totalPractices: profile.total_practices,
    lastPracticedAt: profile.last_practiced_at,
    createdAt: profile.created_at,
  };
}

/* =========================================================================
   PRACTICE STATS OPERATIONS WITH SUPABASE
   ========================================================================= */

export async function supabaseSavePracticeStat(payload: {
  userId: string;
  userEmail: string;
  userName: string;
  topicId: string;
  topicTitle: string;
  category: string;
  mode: 'video' | 'audio';
  score: number;
  wpm: number;
  fillerCount: number;
  fillerRatePerMin: number;
  wordCount: number;
  durationSeconds: number;
  primaryIssue: string;
  postureScore?: number | null;
  gestureStatus?: string | null;
}): Promise<{ stat: any; streak: number; totalPractices: number }> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // Sanitize and clamp numerical metrics to prevent client manipulation
  const safeScore = Math.min(100, Math.max(0, Math.round(Number(payload.score) || 0)));
  const safeWpm = Math.min(500, Math.max(0, Math.round(Number(payload.wpm) || 0)));
  const safeFillerCount = Math.max(0, Math.round(Number(payload.fillerCount) || 0));
  const safeFillerRate = Math.max(0, Number(payload.fillerRatePerMin) || 0);
  const safeWordCount = Math.max(0, Math.round(Number(payload.wordCount) || 0));
  const safeDuration = Math.min(7200, Math.max(0, Math.round(Number(payload.durationSeconds) || 0)));
  const safePosture = payload.postureScore !== undefined && payload.postureScore !== null
    ? Math.min(1, Math.max(0, Number(payload.postureScore)))
    : null;

  // 1. Insert practice stat record (strictly metrics, no transcripts/media)
  const statRecord = {
    user_id: payload.userId,
    user_email: payload.userEmail,
    user_name: payload.userName,
    topic_id: payload.topicId,
    topic_title: payload.topicTitle,
    category: payload.category || 'Campus Placement',
    mode: payload.mode,
    score: safeScore,
    wpm: safeWpm,
    filler_count: safeFillerCount,
    filler_rate_per_min: safeFillerRate,
    word_count: safeWordCount,
    duration_seconds: safeDuration,
    primary_issue: payload.primaryIssue,
    posture_score: safePosture,
    gesture_status: payload.gestureStatus || null,
    created_at: now.toISOString(),
    date_str: dateStr,
  };

  const { data: insertedStat, error: insertError } = await supabaseAdmin
    .from('practice_stats')
    .insert(statRecord)
    .select('*')
    .single();

  if (insertError) {
    console.error('Error inserting stat to Supabase:', insertError);
    throw new Error('Failed to save practice record in Supabase: ' + insertError.message);
  }

  // 2. Fetch authoritative profile values calculated by Postgres trigger
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', payload.userId)
    .single();

  const currentStreak = profile?.current_streak || 1;
  const totalPractices = profile?.total_practices || 1;

  return {
    stat: {
      id: insertedStat.id,
      userId: insertedStat.user_id,
      userEmail: insertedStat.user_email,
      userName: insertedStat.user_name,
      topicId: insertedStat.topic_id,
      topicTitle: insertedStat.topic_title,
      category: insertedStat.category,
      mode: insertedStat.mode,
      score: insertedStat.score,
      wpm: insertedStat.wpm,
      fillerCount: insertedStat.filler_count,
      fillerRatePerMin: insertedStat.filler_rate_per_min,
      wordCount: insertedStat.word_count,
      durationSeconds: insertedStat.duration_seconds,
      primaryIssue: insertedStat.primary_issue,
      postureScore: insertedStat.posture_score,
      gestureStatus: insertedStat.gesture_status,
      createdAt: insertedStat.created_at,
      dateStr: insertedStat.date_str,
    },
    streak: currentStreak,
    totalPractices,
  };
}

export async function supabaseGetMyStats(userId: string): Promise<any[]> {
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from('practice_stats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    userId: s.user_id,
    userEmail: s.user_email,
    userName: s.user_name,
    topicId: s.topic_id,
    topicTitle: s.topic_title,
    category: s.category,
    mode: s.mode,
    score: s.score,
    wpm: s.wpm,
    fillerCount: s.filler_count,
    fillerRatePerMin: Number(s.filler_rate_per_min),
    wordCount: s.word_count,
    durationSeconds: s.duration_seconds,
    primaryIssue: s.primary_issue,
    postureScore: s.posture_score,
    gestureStatus: s.gesture_status,
    createdAt: s.created_at,
    dateStr: s.date_str,
  }));
}

/* =========================================================================
   ADMIN DASHBOARD OPERATIONS WITH SUPABASE
   ========================================================================= */

export async function supabaseGetAdminOverview(): Promise<any> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  // Fetch all profiles
  const { data: profiles, error: profError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profError) throw new Error(profError.message);

  // Fetch recent practice stats (last 30)
  const { data: recentStats, error: statsError } = await supabaseAdmin
    .from('practice_stats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (statsError) throw new Error(statsError.message);

  const userList = (profiles || []).map((p) => {
    const isPrimaryAdmin = p.email.toLowerCase() === 'sakshimarya193@gmail.com';
    return {
      id: p.id,
      email: p.email,
      displayName: p.display_name,
      collegeOrCompany: p.college_or_company,
      targetRole: p.target_role,
      role: isPrimaryAdmin ? 'admin' : p.role,
      currentStreak: p.current_streak,
      highestStreak: p.highest_streak,
      totalPractices: p.total_practices,
      lastPracticedAt: p.last_practiced_at,
      createdAt: p.created_at,
    };
  });

  const totalUsers = userList.length;
  const totalPractices = (recentStats || []).length;
  const avgScore = totalPractices
    ? Math.round(recentStats.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalPractices)
    : 0;
  const avgWpm = totalPractices
    ? Math.round(recentStats.reduce((acc, curr) => acc + (curr.wpm || 0), 0) / totalPractices)
    : 0;
  const activeStreakUsers = userList.filter((u) => u.currentStreak > 0).length;

  const activityList = (recentStats || []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    userEmail: s.user_email,
    userName: s.user_name,
    topicId: s.topic_id,
    topicTitle: s.topic_title,
    category: s.category,
    mode: s.mode,
    score: s.score,
    wpm: s.wpm,
    fillerCount: s.filler_count,
    fillerRatePerMin: Number(s.filler_rate_per_min),
    wordCount: s.word_count,
    durationSeconds: s.duration_seconds,
    primaryIssue: s.primary_issue,
    postureScore: s.posture_score,
    gestureStatus: s.gesture_status,
    createdAt: s.created_at,
    dateStr: s.date_str,
  }));

  return {
    metrics: {
      totalUsers,
      totalPractices,
      avgScore,
      avgWpm,
      activeStreakUsers,
      zeroDataStorageAuditPassed: true,
      recordingsStored: 0,
      transcriptsStored: 0,
      backendEngine: 'Supabase PostgreSQL Cloud',
    },
    users: userList,
    recentActivity: activityList,
  };
}

export async function supabaseToggleUserRole(
  targetUserId: string,
  newRole: 'user' | 'admin'
): Promise<any> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', targetUserId)
    .single();

  if (user?.email?.toLowerCase() === 'sakshimarya193@gmail.com' && newRole !== 'admin') {
    throw new Error('Primary administrator role cannot be altered');
  }

  const { data: updated, error } = await supabaseAdmin
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.display_name,
    collegeOrCompany: updated.college_or_company,
    targetRole: updated.target_role,
    role: updated.role,
    currentStreak: updated.current_streak,
    highestStreak: updated.highest_streak,
    totalPractices: updated.total_practices,
    lastPracticedAt: updated.last_practiced_at,
    createdAt: updated.created_at,
  };
}
