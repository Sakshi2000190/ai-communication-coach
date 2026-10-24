import { User, PracticeStat, AnalysisResult } from '../types';

const TOKEN_KEY = 'comm_coach_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function registerUser(payload: {
  email: string;
  password: string;
  displayName: string;
  collegeOrCompany?: string;
  targetRole?: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register');
  }
  setStoredToken(data.token);
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid credentials');
  }
  setStoredToken(data.token);
  return data;
}

export async function getMe(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      setStoredToken(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (err) {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    // continue
  }
  setStoredToken(null);
}

export async function savePracticeStat(payload: {
  topicId: string;
  topicTitle: string;
  category: string;
  mode: 'video' | 'audio';
  practiceMode?: 'random' | 'interview';
  score: number;
  wpm: number;
  fillerCount: number;
  fillerRatePerMin: number;
  wordCount: number;
  durationSeconds: number;
  primaryIssue: string;
  postureScore?: number | null;
  gestureStatus?: string | null;
}): Promise<{ stat: PracticeStat; streak: number; totalPractices: number }> {
  const modePrefix = payload.practiceMode === 'random' ? 'Random Topic' : 'Interview';
  const rawCategory = (payload.category || '').trim();
  const formattedCategory =
    rawCategory.toLowerCase().startsWith('random topic') ||
    rawCategory.toLowerCase().startsWith('interview')
      ? rawCategory
      : `${modePrefix} • ${rawCategory || (payload.practiceMode === 'random' ? 'General Speaking' : 'Campus Placement')}`;

  const res = await fetch('/api/practice/save-stat', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      category: formattedCategory,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save practice statistics');
  }
  return data;
}

export async function getMyStats(): Promise<{
  stats: PracticeStat[];
  streak: number;
  highestStreak: number;
  totalPractices: number;
  lastPracticedAt: string | null;
}> {
  const res = await fetch('/api/practice/my-stats', {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch practice statistics');
  }
  return data;
}

export async function analyzePracticeWithGemini(payload: {
  topicTitle: string;
  category: string;
  mode?: 'video' | 'audio';
  practiceMode?: 'random' | 'interview';
  speechSnippet: string;
  audioBase64?: string;
  audioMimeType?: string;
  speechRecognitionFailed?: boolean;
  wpm: number;
  durationSeconds: number;
  fillerCount: number;
  detectedFillers: string[];
  postureSummary?: { slouchScore: number; postureLabel: string } | null;
  gestureSummary?: { status: string } | null;
  targetRole?: string;
}): Promise<AnalysisResult> {
  const trimmedSnippet = (payload.speechSnippet ?? '').trim();
  const normalizedPracticeMode: 'random' | 'interview' =
    payload.practiceMode === 'random' ? 'random' : 'interview';

  // Client-side validation before making an API request
  if (!trimmedSnippet && !payload.audioBase64) {
    throw new Error(
      'Please speak into your microphone or type your response in the practice editor before analyzing.'
    );
  }

  const res = await fetch('/api/coach/analyze', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      practiceMode: normalizedPracticeMode,
      speechSnippet: trimmedSnippet,
      transcript: trimmedSnippet,
      responseText: trimmedSnippet,
      practiceText: trimmedSnippet,
      // Do not send audioBase64 if valid text is already present to avoid redundant transcription calls
      audioBase64: trimmedSnippet ? undefined : payload.audioBase64,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze practice session');
  }
  const analysis: AnalysisResult = {
    ...data.analysis,
    engine: data.analysis?.engine || data.engine,
    isFallback: Boolean(data.analysis?.isFallback ?? data.isFallback),
    quotaExceeded: Boolean(data.analysis?.quotaExceeded ?? data.quotaExceeded),
    quotaMessage: data.analysis?.quotaMessage || data.quotaMessage,
    fallbackReason: data.analysis?.fallbackReason || data.fallbackReason,
  };
  return analysis;
}

export async function getAdminOverview(): Promise<{
  metrics: {
    totalUsers: number;
    totalPractices: number;
    avgScore: number;
    avgWpm: number;
    activeStreakUsers: number;
    zeroDataStorageAuditPassed: boolean;
    recordingsStored: number;
    transcriptsStored: number;
  };
  users: User[];
  recentActivity: PracticeStat[];
}> {
  const res = await fetch('/api/admin/overview', {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Forbidden: Admin access required');
  }
  return data;
}

export async function toggleUserRole(
  targetUserId: string,
  newRole: 'user' | 'admin'
): Promise<User> {
  const res = await fetch('/api/admin/toggle-role', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ targetUserId, newRole }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update user role');
  }
  return data.user;
}
