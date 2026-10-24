import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  isSupabaseConfigured,
  supabaseRegisterUser,
  supabaseLoginUser,
  supabaseGetUserProfile,
  supabaseSavePracticeStat,
  supabaseGetMyStats,
  supabaseGetAdminOverview,
  supabaseToggleUserRole,
} from './server/supabase';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure database directory and file exist for local fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  collegeOrCompany: string;
  targetRole: string;
  role: 'user' | 'admin';
  currentStreak: number;
  highestStreak: number;
  totalPractices: number;
  lastPracticedAt: string | null;
  createdAt: string;
}

interface PracticeStat {
  id: string;
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
  postureScore: number | null;
  gestureStatus: string | null;
  createdAt: string;
  dateStr: string;
}

interface DatabaseSchema {
  users: Record<string, User>;
  practiceStats: PracticeStat[];
  sessions: Record<string, string>; // token -> userId
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_salt_comm_coach').digest('hex');
}

function getInitialDb(): DatabaseSchema {
  const adminId = 'admin_sakshi_01';
  const fresherId = 'fresher_arjun_02';
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  return {
    users: {
      [adminId]: {
        id: adminId,
        email: 'sakshimarya193@gmail.com',
        passwordHash: hashPassword('admin123'),
        displayName: 'Sakshi Marya',
        collegeOrCompany: 'Program Director / Admin',
        targetRole: 'Career & Placement Mentor',
        role: 'admin',
        currentStreak: 5,
        highestStreak: 12,
        totalPractices: 8,
        lastPracticedAt: now,
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      [fresherId]: {
        id: fresherId,
        email: 'arjun.sharma@college.edu',
        passwordHash: hashPassword('student123'),
        displayName: 'Arjun Sharma',
        collegeOrCompany: 'IIT Delhi / B.Tech CSE 2026',
        targetRole: 'Software Development Engineer',
        role: 'user',
        currentStreak: 3,
        highestStreak: 7,
        totalPractices: 4,
        lastPracticedAt: now,
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    },
    practiceStats: [
      {
        id: 'stat_seed_01',
        userId: fresherId,
        userEmail: 'arjun.sharma@college.edu',
        userName: 'Arjun Sharma',
        topicId: 'intro',
        topicTitle: 'Tell me about yourself',
        category: 'Campus Placement',
        mode: 'video',
        score: 72,
        wpm: 144,
        fillerCount: 6,
        fillerRatePerMin: 3.2,
        wordCount: 168,
        durationSeconds: 70,
        primaryIssue: 'Filler words ("basically", "matlab")',
        postureScore: 0.28,
        gestureStatus: 'good',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        dateStr: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      },
      {
        id: 'stat_seed_02',
        userId: fresherId,
        userEmail: 'arjun.sharma@college.edu',
        userName: 'Arjun Sharma',
        topicId: 'hire_you',
        topicTitle: 'Why should we hire you?',
        category: 'HR Interview',
        mode: 'video',
        score: 84,
        wpm: 138,
        fillerCount: 2,
        fillerRatePerMin: 1.1,
        wordCount: 195,
        durationSeconds: 85,
        primaryIssue: 'Structure (strengthen closing impact)',
        postureScore: 0.19,
        gestureStatus: 'good',
        createdAt: now,
        dateStr: today,
      },
    ],
    sessions: {},
  };
}

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (data && data.users) {
        for (const uid in data.users) {
          if (data.users[uid].email?.toLowerCase() === 'sakshimarya193@gmail.com') {
            data.users[uid].role = 'admin';
          }
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  const initial = getInitialDb();
  writeDb(initial);
  return initial;
}

function writeDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// In-memory token cache for authenticated sessions
const tokenUserCache = new Map<string, any>();

async function getAuthenticatedUser(req: express.Request): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  // 1. Check in-memory token cache
  if (tokenUserCache.has(token)) {
    return tokenUserCache.get(token);
  }

  // 2. If Supabase token (starts with sb_tok_ or contains base64 id)
  if (isSupabaseConfigured()) {
    if (token.startsWith('sb_tok_')) {
      try {
        const decoded = Buffer.from(token.replace('sb_tok_', ''), 'base64').toString('utf-8');
        const userId = decoded.split(':')[0];
        if (userId) {
          const profile = await supabaseGetUserProfile(userId);
          if (profile) {
            tokenUserCache.set(token, profile);
            return profile;
          }
        }
      } catch (e) {
        // fall through
      }
    }
  }

  // 3. Check local database sessions
  const db = readDb();
  const localUserId = db.sessions[token];
  if (localUserId) {
    const user = db.users[localUserId];
    if (user) {
      const { passwordHash: _, ...safeUser } = user;
      tokenUserCache.set(token, safeUser);
      return safeUser;
    }
  }

  return null;
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/* ==========================================================================
   SYSTEM & SUPABASE CONNECTION STATUS
   ========================================================================== */

app.get('/api/system/status', (_req, res) => {
  const configured = isSupabaseConfigured();
  return res.json({
    supabaseConfigured: configured,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    storageEngine: configured ? 'Supabase PostgreSQL Cloud' : 'Local Persistent Fallback',
    setupInstructionsAvailable: true,
  });
});

/* ==========================================================================
   AUTH ENDPOINTS (SUPABASE + LOCAL PERSISTENCE FALLBACK)
   ========================================================================== */

app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName, collegeOrCompany, targetRole } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(displayName).trim();
  const cleanCollege = String(collegeOrCompany || 'College Student').trim();
  const cleanRole = String(targetRole || 'Fresher / Candidate').trim();

  const db = readDb();
  const existingLocalUser = Object.values(db.users).find((u) => u.email.toLowerCase() === cleanEmail);

  let supabaseResult: { user: any; token: string } | null = null;

  // If Supabase is configured, attempt to register in Supabase Auth & Profiles table
  if (isSupabaseConfigured()) {
    try {
      supabaseResult = await supabaseRegisterUser({
        email: cleanEmail,
        password,
        displayName: cleanName,
        collegeOrCompany: cleanCollege,
        targetRole: cleanRole,
      });
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        if (existingLocalUser) {
          return res.status(409).json({
            error: 'An account with this email already exists. Please switch to Sign In to log in.',
          });
        }
      } else {
        console.warn('Supabase registration note (using local persistent store):', msg);
      }
    }
  } else if (existingLocalUser) {
    return res.status(409).json({
      error: 'An account with this email already exists. Please switch to Sign In to log in.',
    });
  }

  const userId = supabaseResult?.user?.id || existingLocalUser?.id || ('usr_' + crypto.randomUUID().slice(0, 8));
  const isAdmin = cleanEmail === 'sakshimarya193@gmail.com';
  const now = new Date().toISOString();

  const newUser: User = {
    id: userId,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    displayName: cleanName,
    collegeOrCompany: cleanCollege,
    targetRole: cleanRole,
    role: isAdmin ? 'admin' : 'user',
    currentStreak: existingLocalUser?.currentStreak || 0,
    highestStreak: existingLocalUser?.highestStreak || 0,
    totalPractices: existingLocalUser?.totalPractices || 0,
    lastPracticedAt: existingLocalUser?.lastPracticedAt || null,
    createdAt: existingLocalUser?.createdAt || now,
  };

  db.users[userId] = newUser;
  const token = supabaseResult?.token || ('tok_' + crypto.randomBytes(24).toString('hex'));
  db.sessions[token] = userId;
  writeDb(db);

  const { passwordHash: _, ...safeUser } = newUser;
  tokenUserCache.set(token, safeUser);
  return res.json({
    user: safeUser,
    token,
    authProvider: supabaseResult ? 'supabase' : 'local',
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required to sign in.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = readDb();
  const localUser = Object.values(db.users).find((u) => u.email.toLowerCase() === cleanEmail);

  // 1. Check local persistent database first (avoids false "Invalid login credentials" on seeded demo accounts or local accounts)
  if (localUser && localUser.passwordHash === hashPassword(password)) {
    if (cleanEmail === 'sakshimarya193@gmail.com' && localUser.role !== 'admin') {
      localUser.role = 'admin';
    }

    // If Supabase is configured, enrich profile stats if available in Supabase
    if (isSupabaseConfigured()) {
      try {
        const sbProfile = await supabaseGetUserProfile(localUser.id);
        if (sbProfile) {
          localUser.currentStreak = sbProfile.currentStreak ?? localUser.currentStreak;
          localUser.highestStreak = sbProfile.highestStreak ?? localUser.highestStreak;
          localUser.totalPractices = sbProfile.totalPractices ?? localUser.totalPractices;
        }
      } catch (_e) {
        // Ignore profile lookup errors for local accounts
      }
    }

    const isSeededDemo =
      localUser.id === 'admin_sakshi_01' || localUser.id === 'fresher_arjun_02';
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    db.sessions[token] = localUser.id;
    writeDb(db);

    const { passwordHash: _, ...safeUser } = localUser;
    tokenUserCache.set(token, safeUser);
    return res.json({
      user: safeUser,
      token,
      authProvider: isSeededDemo ? 'local-demo' : 'local-cached',
    });
  }

  // 2. If not matched locally and Supabase is configured, verify against Supabase Auth
  let supabaseErrorMsg = '';
  if (isSupabaseConfigured()) {
    try {
      const result = await supabaseLoginUser({ email: cleanEmail, password });
      // Sync verified Supabase user into local store so subsequent sessions are fast and resilient
      const sbUser = result.user;
      db.users[sbUser.id] = {
        id: sbUser.id,
        email: cleanEmail,
        passwordHash: hashPassword(password),
        displayName: sbUser.displayName,
        collegeOrCompany: sbUser.collegeOrCompany,
        targetRole: sbUser.targetRole,
        role: sbUser.role,
        currentStreak: sbUser.currentStreak || 0,
        highestStreak: sbUser.highestStreak || 0,
        totalPractices: sbUser.totalPractices || 0,
        lastPracticedAt: sbUser.lastPracticedAt || null,
        createdAt: sbUser.createdAt || new Date().toISOString(),
      };
      db.sessions[result.token] = sbUser.id;
      writeDb(db);

      tokenUserCache.set(result.token, result.user);
      return res.json({ ...result, authProvider: 'supabase' });
    } catch (err: any) {
      supabaseErrorMsg = String(err?.message || '');
    }
  }

  // 3. Return a clear, helpful login error message
  if (!localUser) {
    return res.status(401).json({
      error:
        'Invalid login credentials. If you have not created an account with this email yet, please switch to "Register Fresher" to sign up first, or use one of the Quick 1-Click Evaluation Accounts below.',
      code: 'INVALID_CREDENTIALS',
      details: supabaseErrorMsg || 'Account not found or password mismatch',
    });
  }

  return res.status(401).json({
    error:
      'Invalid login credentials. The password entered does not match this account. Please check your password or use a Quick 1-Click Evaluation Account below.',
    code: 'INVALID_CREDENTIALS',
  });
});

app.get('/api/auth/me', async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    tokenUserCache.delete(token);
    const db = readDb();
    delete db.sessions[token];
    writeDb(db);
  }
  return res.json({ success: true });
});

/* ==========================================================================
   PRACTICE & PRIVACY PRESERVATION ENDPOINTS (SUPABASE + LOCAL)
   ========================================================================== */

app.post('/api/practice/save-stat', async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to save your practice progress' });
  }

  // Strict privacy audit: reject if transcript, recordings, or raw text are submitted
  if (
    req.body.transcript ||
    req.body.speechSnippet ||
    req.body.audioBlob ||
    req.body.videoBlob ||
    req.body.media ||
    req.body.recording
  ) {
    return res.status(400).json({
      error: 'Security Violation: Practice transcripts and audio/video recordings must NEVER be sent to or saved in the database.',
    });
  }

  const {
    topicId,
    topicTitle,
    category,
    mode,
    score,
    wpm,
    fillerCount,
    fillerRatePerMin,
    wordCount,
    durationSeconds,
    primaryIssue,
    postureScore,
    gestureStatus,
  } = req.body;

  // Sanitize bounds
  const safeScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
  const safeWpm = Math.min(500, Math.max(0, Math.round(Number(wpm) || 0)));
  const safeFillerCount = Math.max(0, Math.round(Number(fillerCount) || 0));
  const safeFillerRate = Math.max(0, Number(fillerRatePerMin) || 0);
  const safeWordCount = Math.max(0, Math.round(Number(wordCount) || 0));
  const safeDuration = Math.min(7200, Math.max(0, Math.round(Number(durationSeconds) || 0)));
  const safePosture = postureScore !== undefined && postureScore !== null
    ? Math.min(1, Math.max(0, Number(postureScore)))
    : null;

  // If Supabase is configured, save in Supabase practice_stats table
  if (isSupabaseConfigured()) {
    try {
      const result = await supabaseSavePracticeStat({
        userId: user.id,
        userEmail: user.email,
        userName: user.displayName,
        topicId: topicId || 'topic-general',
        topicTitle: topicTitle || 'General Practice',
        category: category || 'Campus Placement',
        mode: mode === 'audio' ? 'audio' : 'video',
        score: safeScore,
        wpm: safeWpm,
        fillerCount: safeFillerCount,
        fillerRatePerMin: safeFillerRate,
        wordCount: safeWordCount,
        durationSeconds: safeDuration,
        primaryIssue: String(primaryIssue || 'General communication practice').slice(0, 100),
        postureScore: safePosture,
        gestureStatus: gestureStatus ? String(gestureStatus).slice(0, 50) : null,
      });
      return res.json({ success: true, storage: 'supabase', ...result });
    } catch (err: any) {
      console.warn('Supabase save error, falling back to local store:', err.message);
    }
  }

  // Local fallback save
  const db = readDb();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const userObj = db.users[user.id];
  if (userObj) {
    const lastDate = userObj.lastPracticedAt ? userObj.lastPracticedAt.slice(0, 10) : null;
    if (!lastDate) {
      userObj.currentStreak = 1;
    } else {
      const diffMs = now.getTime() - new Date(lastDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        userObj.currentStreak += 1;
      } else if (diffDays > 1) {
        userObj.currentStreak = 1;
      }
    }
    userObj.highestStreak = Math.max(userObj.highestStreak || 0, userObj.currentStreak);
    userObj.totalPractices = (userObj.totalPractices || 0) + 1;
    userObj.lastPracticedAt = now.toISOString();
  }

  const newStat: PracticeStat = {
    id: 'stat_' + crypto.randomUUID().slice(0, 8),
    userId: user.id,
    userEmail: user.email,
    userName: user.displayName,
    topicId: topicId || 'topic-general',
    topicTitle: topicTitle || 'General Practice',
    category: category || 'Campus Placement',
    mode: mode === 'audio' ? 'audio' : 'video',
    score: safeScore,
    wpm: safeWpm,
    fillerCount: safeFillerCount,
    fillerRatePerMin: safeFillerRate,
    wordCount: safeWordCount,
    durationSeconds: safeDuration,
    primaryIssue: String(primaryIssue || 'General communication practice').slice(0, 100),
    postureScore: safePosture,
    gestureStatus: gestureStatus ? String(gestureStatus).slice(0, 50) : null,
    createdAt: now.toISOString(),
    dateStr,
  };

  db.practiceStats.push(newStat);
  writeDb(db);

  return res.json({
    success: true,
    storage: 'local',
    stat: newStat,
    streak: userObj?.currentStreak || 1,
    totalPractices: userObj?.totalPractices || 1,
  });
});

app.get('/api/practice/my-stats', async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isSupabaseConfigured()) {
    try {
      const stats = await supabaseGetMyStats(user.id);
      if (stats && stats.length > 0) {
        return res.json({
          stats,
          storage: 'supabase',
          streak: user.currentStreak || 0,
          highestStreak: user.highestStreak || 0,
          totalPractices: user.totalPractices || stats.length,
          lastPracticedAt: user.lastPracticedAt,
        });
      }
    } catch (err: any) {
      console.warn('Supabase getMyStats error, using local fallback:', err.message);
    }
  }

  const db = readDb();
  const myStats = db.practiceStats
    .filter((s) => s.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const userObj = db.users[user.id] || user;

  return res.json({
    stats: myStats,
    storage: 'local',
    streak: userObj.currentStreak || 0,
    highestStreak: userObj.highestStreak || 0,
    totalPractices: userObj.totalPractices || myStats.length,
    lastPracticedAt: userObj.lastPracticedAt,
  });
});

/* ==========================================================================
   SECURE GEMINI AI SPEECH ANALYSIS (NO PERSISTENCE OF TRANSCRIPTS/MEDIA)
   ========================================================================== */

function generateHeuristicFallback(params: {
  practiceMode: 'random' | 'interview';
  topicTitle: string;
  category: string;
  mode: 'video' | 'audio';
  wpm: number;
  fillerCount: number;
  durationSeconds: number;
  wordCount: number;
  postureSummary?: any;
  gestureSummary?: any;
  snippet: string;
}): any {
  const {
    practiceMode,
    topicTitle,
    category,
    mode,
    wpm,
    fillerCount,
    durationSeconds,
    wordCount,
    postureSummary,
    snippet,
  } = params;

  const isRandomMode = practiceMode === 'random';
  const hasMeasuredDuration = durationSeconds > 0 && wpm > 0;

  let score = 74;
  if (hasMeasuredDuration) {
    if (wpm >= 115 && wpm <= 155) score += 10;
    else if (wpm < 90 || wpm > 180) score -= 12;
    else if (wpm < 110) score -= 5;
  } else {
    if (wordCount >= 40) score += 8;
    else if (wordCount < 15) score -= 8;
  }

  const fillerRatioPer100Words = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;
  if (fillerCount === 0 && wordCount >= 20) score += 8;
  else if (fillerRatioPer100Words > 6) score -= 14;
  else if (fillerRatioPer100Words > 3) score -= 6;

  if (mode === 'video' && postureSummary?.slouchScore !== undefined && postureSummary.slouchScore !== null) {
    if (postureSummary.slouchScore < 0.28) score += 5;
    else if (postureSummary.slouchScore > 0.5) score -= 6;
  }

  score = Math.min(95, Math.max(38, Math.round(score)));

  const bottleneck =
    fillerCount >= 3
      ? 'Hinglish Filler Word Dependency ("Basically", "You know", "Matlab")'
      : hasMeasuredDuration && wpm < 100
      ? 'Hesitant Speaking Cadence & Long Mid-Sentence Pauses'
      : hasMeasuredDuration && wpm > 165
      ? 'Rushed Delivery Pace & Limited Breathing Pauses'
      : isRandomMode
      ? 'Spontaneous Topic Structure: Needs Clearer Opening Hook & Conclusion'
      : 'Interview Answer Structure: Needs Clearer STAR / Impact Examples';

  const paceNote = hasMeasuredDuration
    ? `Maintained a measured speaking pace of ${wpm} WPM over ${durationSeconds} seconds.`
    : `Delivered a clear ${wordCount}-word written/transcribed response (speaking duration was not timed in this session).`;

  const postureNote =
    mode === 'video' && postureSummary
      ? `Approximate browser camera check (${postureSummary.postureLabel || 'Tracked'}): keep your shoulders relaxed and camera near eye level. Note: browser vision tracking is an approximate visual aid.`
      : 'Posture and visual body-language tracking were not active for this session (audio-only or text response mode—not counted against your score).';

  return {
    score,
    practiceMode,
    strengths: [
      isRandomMode
        ? `Stayed relevant to the spontaneous topic "${topicTitle}" (${category}) with clear core ideas.`
        : `Addressed the interview prompt "${topicTitle}" (${category}) with a focused, professional tone.`,
      paceNote,
      fillerCount === 0
        ? 'Expressed thoughts cleanly with zero detected Hinglish or English filler crutches.'
        : `Completed a ${wordCount}-word response while keeping your main message understandable.`,
    ],
    actionableSteps: isRandomMode
      ? [
          'Structure spontaneous topics into 3 parts: a 15-second hook, 2 supporting examples, and a crisp takeaway.',
          'Replace vocalized fillers ("matlab", "basically", "um") with a 1-second silent pause between ideas.',
          'Use signposting phrases ("First", "For instance", "To sum up") so listeners can follow your flow effortlessly.',
        ]
      : [
          'Open with a direct 15-second headline answer before diving into project or academic details.',
          'Use the STAR framework (Situation, Task, Action, Result) to quantify your personal contribution.',
          'Replace casual Hinglish connectors with deliberate silent pauses to project interview composure.',
        ],
    clarityAndFluency: hasMeasuredDuration
      ? `Your delivery paced at ${wpm} WPM across ${durationSeconds}s. Pausing cleanly at sentence boundaries will further sharpen your fluency.`
      : `Your ${wordCount}-word response communicates the central idea clearly. Practice reading it aloud with intentional pauses between clauses.`,
    grammarAndVocabulary:
      snippet.length > 0
        ? isRandomMode
          ? 'Vocabulary is natural and accessible. Try incorporating varied transition phrases ("Furthermore", "From another perspective") to elevate spontaneous speeches.'
          : 'Sentence framing is conversational. Upgrade general verbs ("did", "worked on") to action verbs ("implemented", "collaborated", "optimized").'
        : 'Continue expanding active vocabulary in daily speaking drills.',
    confidenceAndDelivery: isRandomMode
      ? 'For extempore and random topics, vary your vocal pitch on key words and finish sentences with a steady downward inflection.'
      : 'Project steady vocal assurance on opening statements and avoid trailing off at the end of technical explanations.',
    postureAndGestureFeedback: postureNote,
    correctiveExercise: isRandomMode
      ? 'The 3-Point Impromptu Drill: Pick any everyday object or topic, take 10 seconds to think of 1 opening line + 2 examples, and speak aloud for 60 seconds without stopping.'
      : 'The 60-Second STAR Sprint: State one project challenge in 1 sentence, 2 actions YOU took in 30 seconds, and 1 measurable result in 15 seconds.',
    learningResources: isRandomMode
      ? [
          {
            title: 'Impromptu Speaking: PREP Framework (Point, Reason, Example, Point)',
            type: 'Speaking Framework',
            url: 'https://www.youtube.com/results?search_query=impromptu+speaking+PREP+method+communication',
          },
          {
            title: 'How to Stop Using Filler Words in Spontaneous Speech',
            type: 'Vocal Drill',
            url: 'https://www.youtube.com/results?search_query=eliminate+filler+words+public+speaking',
          },
        ]
      : [
          {
            title: 'Mastering STAR Behavioral & HR Interview Answers',
            type: 'Interview Guide',
            url: 'https://www.youtube.com/results?search_query=STAR+method+interview+answers+freshers',
          },
          {
            title: 'Campus Placement Self-Introduction & Technical Pitch',
            type: 'Placement Prep',
            url: 'https://www.youtube.com/results?search_query=campus+placement+interview+preparation+india',
          },
        ],
    nextSessionPlan: isRandomMode
      ? `Generate another Random Topic in "${category}" and aim to speak for 90 seconds using the PREP (Point-Reason-Example-Point) structure.`
      : `Re-practice "${topicTitle}" focusing on a crisp opening statement and zero filler words in the first 45 seconds.`,
    primaryBottleneck: bottleneck,
    recruiterPerspective: isRandomMode
      ? 'In group discussions, presentations, and everyday communication, listeners connect best when your opening stance is clear and backed by relatable real-life examples.'
      : 'Hiring panels look for structured thinking, authentic ownership of projects, and calm delivery without relying on memorized scripts or casual fillers.',
    hinglishToCorporate: [
      {
        casual: 'Actually matlab my point is that...',
        corporate: 'The core takeaway I would like to highlight is...',
      },
      {
        casual: 'Basically we did this in our college project',
        corporate: 'Our team designed and executed this module during our academic capstone.',
      },
      {
        casual: 'Like you know it is very useful for everyone',
        corporate: 'This approach delivers practical value across diverse user groups.',
      },
    ],
    immediatePracticeChallenge: isRandomMode
      ? `Take 60 seconds right now: summarize your main opinion on "${topicTitle}" in 3 crisp sentences aloud without using "basically", "matlab", or "um".`
      : `Take 60 seconds right now: deliver your opening 3 sentences for "${topicTitle}" aloud, pausing silently for 1 full second after each period.`,
    sevenDayPlan: isRandomMode
      ? [
          'Day 1: 60-Second Random Topic Opener (Point + Reason)',
          'Day 2: Storytelling Drill: Describe a Memorable Experience with Vivid Detail',
          'Day 3: Zero-Filler Spontaneous Speaking (Silent Pause Replacement)',
          'Day 4: Opinion & Debate Topic: Present Both Sides Fairly in 90 Seconds',
          'Day 5: Pacing & Vocal Variety Drill (120–150 WPM Target)',
          'Day 6: Workplace & Current Affairs Summary in 4 Bullet Points',
          'Day 7: Full 2-Minute Unscripted Extempore Challenge',
        ]
      : [
          'Day 1: 90-Second Crisp Self-Introduction (Present-Past-Future)',
          'Day 2: STAR Technique for Technical Project & Bug-Solving Stories',
          'Day 3: Controlled 130 WPM Pacing Drill with Zero Hinglish Fillers',
          'Day 4: Behavioral Questions: Strengths, Weakness & Team Conflict',
          'Day 5: Company-Specific Research & "Why Should We Hire You?"',
          'Day 6: Group Discussion Entry, Balanced Argument & Summary',
          'Day 7: Full 2-Minute Mock HR & Technical Panel Simulation',
        ],
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// Track Gemini quota exhaustion cooldown to prevent repeated retries when quota is exceeded
let geminiQuotaCooldownUntil = 0;

function isGeminiQuotaError(err: any): boolean {
  if (!err) return false;
  const status = err?.status ?? err?.code ?? err?.error?.code;
  if (status === 429 || String(status) === '429') return true;
  const msg = String(err?.message || err?.error?.message || JSON.stringify(err) || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

function extractCleanGeminiErrorMessage(err: any): string {
  if (!err) return 'API error';
  const raw = String(err?.message || err?.error?.message || '');
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return String(parsed.error.message);
    }
  } catch (_e) {
    // Not a raw JSON string
  }
  return raw || 'Service temporarily unavailable';
}

const GEMINI_QUOTA_USER_MESSAGE =
  'Gemini API quota has been exceeded (HTTP 429 RESOURCE_EXHAUSTED). You may need to wait for your daily or per-minute quota to reset, or check your Google AI Studio billing and rate limits. Showing local rule-based fallback analysis below (not generated by Gemini AI).';

const analyzeHandler = async (req: express.Request, res: express.Response) => {
  try {
    const rawPracticeMode = String(req.body.practiceMode || 'interview').trim().toLowerCase();
    const practiceMode: 'random' | 'interview' =
      rawPracticeMode === 'random' ? 'random' : 'interview';

    const rawTopicTitle = String(
      req.body.topicTitle ?? req.body.topic ?? req.body.title ?? ''
    ).trim();
    const topicTitle =
      rawTopicTitle || (practiceMode === 'random' ? 'General Speaking Topic' : 'Self Introduction');

    const rawCategory = String(
      req.body.category ?? req.body.topicCategory ?? ''
    ).trim();
    const category =
      rawCategory || (practiceMode === 'random' ? 'Daily life and social issues' : 'Self-introduction');

    const mode: 'video' | 'audio' = req.body.mode === 'audio' ? 'audio' : 'video';

    // Normalize field names across frontend / client variations
    const rawSnippet =
      req.body.speechSnippet ??
      req.body.transcript ??
      req.body.responseText ??
      req.body.practiceText ??
      req.body.text ??
      '';
    let snippet = String(rawSnippet || '').trim();

    const audioBase64 = req.body.audioBase64;
    const audioMimeType = req.body.audioMimeType;
    const speechRecognitionFailed = Boolean(req.body.speechRecognitionFailed);
    const postureSummary = req.body.postureSummary;
    const gestureSummary = req.body.gestureSummary;
    const targetRole = req.body.targetRole;

    // Check optional authenticated user to personalize advice for their target role
    const authUser = await getAuthenticatedUser(req);
    const candidateRole = authUser?.targetRole || targetRole || 'Student / Communicator';

    let quotaExceeded = Date.now() < geminiQuotaCooldownUntil;
    let transcriptionFailed = false;
    let transcriptionErrorMsg = '';

    // Only attempt audio transcription if NO manual or browser transcript text was provided
    if (!snippet && audioBase64 && process.env.GEMINI_API_KEY) {
      if (quotaExceeded) {
        transcriptionFailed = true;
        transcriptionErrorMsg = GEMINI_QUOTA_USER_MESSAGE;
      } else {
        try {
          const rawMime = String(audioMimeType || (mode === 'video' ? 'video/webm' : 'audio/webm')).trim();
          const cleanMimeType = rawMime.split(';')[0].trim().toLowerCase();
          const isVideo = mode === 'video' || cleanMimeType.startsWith('video/');

          // Single transcription call — NEVER chain fallback retries when quota or network fails
          const transResponse = await withTimeout(
            ai.models.generateContent({
              model: isVideo ? 'gemini-3.8-flash' : 'gemini-3.5-transcribe',
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: isVideo
                        ? (cleanMimeType.startsWith('video/') ? cleanMimeType : 'video/webm')
                        : (cleanMimeType.startsWith('audio/') ? cleanMimeType : 'audio/webm'),
                      data: String(audioBase64),
                    },
                  },
                  {
                    text: 'Transcribe the spoken words in this practice recording accurately. Output only the plain text transcript.',
                  },
                ],
              },
            }),
            12000,
            'Speech transcription'
          );
          snippet = (transResponse.text || '').trim();
        } catch (transErr: any) {
          transcriptionFailed = true;
          if (isGeminiQuotaError(transErr)) {
            quotaExceeded = true;
            geminiQuotaCooldownUntil = Date.now() + 60_000;
            transcriptionErrorMsg = GEMINI_QUOTA_USER_MESSAGE;
            console.warn('Gemini transcription skipped due to HTTP 429 RESOURCE_EXHAUSTED quota limit.');
          } else {
            transcriptionErrorMsg = transErr?.message || 'Speech transcription service unavailable';
            console.warn('Transcription service note:', transcriptionErrorMsg);
          }
        }
      }
    }

    const hasTranscript = Boolean(snippet && snippet.length > 0);

    // Validate that either text or recorded media was provided
    if (!hasTranscript && !audioBase64) {
      if (speechRecognitionFailed) {
        return res.status(400).json({
          error:
            'Browser live speech transcription was unavailable (network error) and the manual editor is empty. Please type or paste your response in the Manual Practice Editor below to analyze.',
        });
      }
      return res.status(400).json({
        error: 'Please speak into your microphone or type your response in the practice editor before analyzing.',
      });
    }

    // If audio was recorded but no transcript is available, distinguish quota/transcription errors from empty audio
    // Never treat a transcription failure as proof that the user did not speak!
    if (!hasTranscript && audioBase64) {
      if (quotaExceeded) {
        return res.status(429).json({
          error:
            'Gemini API quota has been exceeded (HTTP 429 RESOURCE_EXHAUSTED), so automatic audio transcription is currently unavailable. Please wait for your quota to reset or check your Google AI Studio billing and rate limits — or type/paste your response in the Manual Practice Editor below (or click "Use Sample Opener") to run instant local fallback analysis.',
          quotaExceeded: true,
        });
      }
      if (transcriptionFailed || speechRecognitionFailed) {
        return res.status(503).json({
          error:
            'Automatic speech transcription is currently unavailable due to a speech recognition or network error (your microphone recording was received, not silent). Please type or summarize your response in the Manual Practice Editor below to analyze your session.',
          transcriptionUnavailable: true,
        });
      }
      return res.status(400).json({
        error:
          'Transcription completed, but no spoken words could be extracted from the recording. Please type or edit your response in the Manual Practice Editor below before analyzing.',
      });
    }

    // Word count & accurate metric calculations (never invent speaking duration or WPM when not timed)
    const words = snippet.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const rawDuration = Math.min(7200, Math.max(0, Math.round(Number(req.body.durationSeconds) || 0)));
    const safeDuration = rawDuration; // 0 if typed-only without recording timer

    let safeWpm = Math.min(500, Math.max(0, Math.round(Number(req.body.wpm) || 0)));
    if (safeDuration > 0 && wordCount > 0) {
      safeWpm = Math.round(wordCount / (safeDuration / 60));
    } else if (safeDuration === 0) {
      safeWpm = 0; // Do not invent WPM when no speaking duration was measured
    }

    let safeFillerCount = Math.max(0, Math.round(Number(req.body.fillerCount) || 0));
    let detectedFillers = Array.isArray(req.body.detectedFillers) ? req.body.detectedFillers : [];

    // If client didn't supply filler count, detect from transcript
    if (safeFillerCount === 0 && words.length > 0) {
      const fillerRegex = /\b(basically|actually|literally|like|you know|matlab|yaani|so yeah|right|sort of|kind of|i mean)\b/gi;
      const matches = snippet.match(fillerRegex) || [];
      safeFillerCount = matches.length;
      if (detectedFillers.length === 0) {
        detectedFillers = Array.from(new Set(matches.map((m) => m.toLowerCase())));
      }
    }

    const defaultFallback = generateHeuristicFallback({
      practiceMode,
      topicTitle,
      category,
      mode,
      wpm: safeWpm,
      fillerCount: safeFillerCount,
      durationSeconds: safeDuration,
      wordCount,
      postureSummary,
      gestureSummary,
      snippet,
    });

    let fallbackReason = '';

    // Call Gemini 3.8 Flash for mode-aware feedback ONLY if API key is present and quota is not exhausted
    if (process.env.GEMINI_API_KEY && !quotaExceeded) {
      try {
        const transcriptSection = `Candidate Response (transient text to be evaluated and immediately discarded):
"${snippet.slice(0, 2500)}"`;

        const durationAndPaceLine =
          safeDuration > 0
            ? `- Measured Speaking Duration: ${safeDuration} seconds\n- Measured Speaking Speed: ${safeWpm} Words Per Minute (Ideal benchmark: 120-150 WPM)`
            : `- Delivery Format: Manual text editor / untimed response (${wordCount} words). Speaking duration and WPM were NOT measured—do NOT invent a WPM number or penalize for missing WPM.`;

        const postureLine =
          mode === 'video' && postureSummary
            ? `- Approximate Browser Posture Metric: ${JSON.stringify(postureSummary)} (Note: approximate browser canvas estimate; do not claim medical/clinical precision)\n- Approximate Gesture Metric: ${gestureSummary ? JSON.stringify(gestureSummary) : 'Normal'}`
            : `- Visual/Posture Tracking: Not active for this session (${mode === 'audio' ? 'Audio-only mode' : 'Text-only / camera not active'}). Do NOT report missing posture/video metrics as a failure.`;

        const modeRoleInstructions =
          practiceMode === 'random'
            ? `You are an encouraging, perceptive Public Speaking & Spontaneous Communication Coach.
This session is in **RANDOM TOPIC PRACTICE** mode (NOT a job interview).
Evaluate the speaker on:
- Relevance to the selected topic ("${topicTitle}" in category "${category}")
- Clarity of ideas, originality, and examples
- Speech structure (engaging opening hook, coherent body points, memorable conclusion)
- Fluency, transitions, and filler-word usage
- Available delivery metrics only (if WPM or posture was not measured, do not invent them or treat them as errors).`
            : `You are a Senior Executive Placement Director and Interview Communication Coach evaluating candidates for campus placements and job interviews.
This session is in **INTERVIEW PRACTICE** mode.
Evaluate the candidate on:
- Direct relevance to the interview question ("${topicTitle}" in category "${category}")
- Clarity, conciseness, and answer structure (e.g., STAR method for behavioral/technical, Present-Past-Future for introductions)
- Professionalism, ownership, and impact
- Available delivery metrics only (if WPM or posture was not measured, do not invent them or treat them as errors).`;

        const prompt = `${modeRoleInstructions}

Session Context:
- Practice Mode: ${practiceMode === 'random' ? 'Random Topic Practice (General Communication & Spontaneous Speaking)' : 'Interview Practice (Placement & Job Interview Prep)'}
- Candidate Profile / Role: "${candidateRole}"
- Selected Topic: "${topicTitle}" (Category: ${category})
${durationAndPaceLine}
- Filler Word Count: ${safeFillerCount} (detected words: ${JSON.stringify(detectedFillers)})
${postureLine}

${transcriptSection}

Return a JSON object with:
1. "score": Integer 0 to 100 representing overall quality for this ${practiceMode === 'random' ? 'spontaneous speaking topic' : 'interview question'}.
2. "strengths": Array of EXACTLY 3 specific, encouraging points highlighting what the speaker did well in content relevance, structure/vocabulary, and available delivery metrics.
3. "actionableSteps": Array of EXACTLY 3 concrete, actionable steps to improve their response to "${topicTitle}".
4. "clarityAndFluency": 2-3 sentences evaluating idea flow, transitions, and fluency.
5. "grammarAndVocabulary": 2-3 sentences evaluating language precision and word choice based on their text.
6. "confidenceAndDelivery": 2-3 sentences advising on vocal pacing/projection (respecting whether WPM was measured or untimed).
7. "postureAndGestureFeedback": 1-2 sentences on visual presence if video posture was tracked, or a brief neutral note that posture was not tracked in this mode (never claim approximate posture tracking is 100% exact).
8. "correctiveExercise": 1-2 sentences describing a specific 2-minute corrective speaking exercise tailored to their main improvement area.
9. "nextSessionPlan": 1-2 sentences with a focus goal for their next practice session.
10. "primaryBottleneck": Short concise title of their single main improvement area.
11. "recruiterPerspective": 1-2 sentences explaining how an ${practiceMode === 'random' ? 'audience or communication evaluator' : 'interview panellist or hiring manager'} perceives this response.
12. "hinglishToCorporate": Array of 2 to 3 objects { "casual": string, "corporate": string } showing upgrades from casual/filler phrasing to polished expression relevant to their topic.
13. "immediatePracticeChallenge": One specific 60-second speaking challenge the user can do right now.
14. "sevenDayPlan": Array of 7 strings (Day 1 through Day 7) providing a daily improvement plan tailored to ${practiceMode === 'random' ? 'spontaneous speaking and fluency' : 'interview mastery'}.`;

        const activeGeminiModel = 'gemini-3-flash-preview';
        const response = await withTimeout(
          ai.models.generateContent({
            model: activeGeminiModel,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  actionableSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  clarityAndFluency: { type: Type.STRING },
                  grammarAndVocabulary: { type: Type.STRING },
                  confidenceAndDelivery: { type: Type.STRING },
                  postureAndGestureFeedback: { type: Type.STRING },
                  correctiveExercise: { type: Type.STRING },
                  nextSessionPlan: { type: Type.STRING },
                  primaryBottleneck: { type: Type.STRING },
                  recruiterPerspective: { type: Type.STRING },
                  hinglishToCorporate: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        casual: { type: Type.STRING },
                        corporate: { type: Type.STRING },
                      },
                      required: ['casual', 'corporate'],
                    },
                  },
                  immediatePracticeChallenge: { type: Type.STRING },
                  sevenDayPlan: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'score',
                  'strengths',
                  'actionableSteps',
                  'clarityAndFluency',
                  'grammarAndVocabulary',
                  'confidenceAndDelivery',
                  'postureAndGestureFeedback',
                  'correctiveExercise',
                  'nextSessionPlan',
                  'primaryBottleneck',
                  'recruiterPerspective',
                  'hinglishToCorporate',
                  'immediatePracticeChallenge',
                  'sevenDayPlan',
                ],
              },
            },
          }),
          20000,
          'Gemini coaching evaluation'
        );

        const outputText = response.text || '{}';
        const analysis = JSON.parse(outputText);

        // Sanitize score bounds & attach mode metadata + learning resources
        analysis.score = Math.min(100, Math.max(0, Math.round(Number(analysis.score) || 72)));
        analysis.practiceMode = practiceMode;
        analysis.learningResources = defaultFallback.learningResources;
        analysis.engine = activeGeminiModel;
        analysis.isFallback = false;
        analysis.quotaExceeded = false;

        // Prompt, audio, and transcript are never written to any database
        return res.json({
          analysis,
          engine: activeGeminiModel,
          isFallback: false,
          quotaExceeded: false,
        });
      } catch (geminiError: any) {
        const cleanMsg = extractCleanGeminiErrorMessage(geminiError);
        if (isGeminiQuotaError(geminiError)) {
          quotaExceeded = true;
          geminiQuotaCooldownUntil = Date.now() + 60_000;
          fallbackReason = GEMINI_QUOTA_USER_MESSAGE;
          console.warn('Gemini evaluation hit HTTP 429 RESOURCE_EXHAUSTED; returning labeled heuristic fallback.');
        } else {
          fallbackReason = `Gemini AI service unavailable (${cleanMsg}). Showing local rule-based fallback analysis (not generated by Gemini AI).`;
          console.warn('Gemini API call warning, falling back to telemetry heuristics:', cleanMsg);
        }
      }
    } else if (!process.env.GEMINI_API_KEY) {
      fallbackReason = 'GEMINI_API_KEY is not configured. Showing local rule-based fallback analysis.';
    } else if (quotaExceeded) {
      fallbackReason = GEMINI_QUOTA_USER_MESSAGE;
    }

    // Clearly label fallback analysis so it is never mistaken for Gemini AI output
    const labeledFallback = {
      ...defaultFallback,
      engine: 'telemetry-heuristics',
      isFallback: true,
      quotaExceeded,
      quotaMessage: quotaExceeded ? GEMINI_QUOTA_USER_MESSAGE : undefined,
      fallbackReason: fallbackReason || 'Evaluated using local rule-based heuristics (not Gemini AI).',
    };

    return res.json({
      analysis: labeledFallback,
      engine: 'telemetry-heuristics',
      isFallback: true,
      quotaExceeded,
      quotaMessage: quotaExceeded ? GEMINI_QUOTA_USER_MESSAGE : undefined,
      fallbackReason: labeledFallback.fallbackReason,
    });
  } catch (err: any) {
    console.error('Error analyzing practice session:', err);
    return res.status(500).json({
      error: 'AI Communication Coach encountered an issue analyzing this session. Please check your connection and try again.',
      details: err?.message || String(err),
    });
  }
};

app.post('/api/coach/analyze', analyzeHandler);
app.post('/api/ai/analyze', analyzeHandler);

/* ==========================================================================
   ADMIN DASHBOARD ENDPOINTS
   ========================================================================== */

app.get('/api/admin/overview', async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Administrator privileges required.' });
  }

  if (isSupabaseConfigured()) {
    try {
      const overview = await supabaseGetAdminOverview();
      return res.json(overview);
    } catch (err: any) {
      console.warn('Supabase admin overview error, using fallback:', err.message);
    }
  }

  const db = readDb();
  const userList = Object.values(db.users).map((u) => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });

  const totalUsers = userList.length;
  const totalPractices = db.practiceStats.length;
  const avgScore = totalPractices
    ? Math.round(db.practiceStats.reduce((acc, curr) => acc + curr.score, 0) / totalPractices)
    : 0;
  const avgWpm = totalPractices
    ? Math.round(db.practiceStats.reduce((acc, curr) => acc + curr.wpm, 0) / totalPractices)
    : 0;
  const activeStreakUsers = userList.filter((u) => u.currentStreak > 0).length;

  const recentActivity = [...db.practiceStats]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 25);

  return res.json({
    metrics: {
      totalUsers,
      totalPractices,
      avgScore,
      avgWpm,
      activeStreakUsers,
      zeroDataStorageAuditPassed: true,
      recordingsStored: 0,
      transcriptsStored: 0,
      backendEngine: 'Local Persistent Store (Supabase credentials pending)',
    },
    users: userList,
    recentActivity,
  });
});

app.post('/api/admin/toggle-role', async (req, res) => {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Administrator privileges required.' });
  }

  const { targetUserId, newRole } = req.body;
  if (!targetUserId || !['user', 'admin'].includes(newRole)) {
    return res.status(400).json({ error: 'Target user ID and valid role (user|admin) required' });
  }

  if (isSupabaseConfigured()) {
    try {
      const updatedUser = await supabaseToggleUserRole(targetUserId, newRole);
      return res.json({ success: true, user: updatedUser });
    } catch (err: any) {
      console.warn('Supabase role toggle error:', err.message);
    }
  }

  const db = readDb();
  const targetUser = db.users[targetUserId];
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  if (targetUser.email.toLowerCase() === 'sakshimarya193@gmail.com' && newRole !== 'admin') {
    return res.status(400).json({ error: 'Primary admin role cannot be revoked' });
  }

  targetUser.role = newRole;
  writeDb(db);

  return res.json({ success: true, user: targetUser });
});

/* ==========================================================================
   VITE MIDDLEWARE & SERVER STARTUP
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Communication Coach server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
