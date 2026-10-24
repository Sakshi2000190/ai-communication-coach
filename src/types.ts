export interface User {
  id: string;
  email: string;
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

export type PracticeMode = 'random' | 'interview';

export interface PracticeStat {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  topicId: string;
  topicTitle: string;
  category: string;
  mode: 'video' | 'audio';
  practiceMode?: PracticeMode;
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

export interface TopicResource {
  title: string;
  type: string;
  url: string;
}

export interface AnalysisResult {
  score: number;
  practiceMode?: PracticeMode;
  strengths: string[];
  actionableSteps: string[];
  primaryBottleneck: string;
  recruiterPerspective: string;
  clarityAndFluency?: string;
  grammarAndVocabulary?: string;
  confidenceAndDelivery?: string;
  postureAndGestureFeedback?: string | null;
  correctiveExercise?: string;
  learningResources?: TopicResource[];
  nextSessionPlan?: string;
  hinglishToCorporate: Array<{
    casual: string;
    corporate: string;
  }>;
  immediatePracticeChallenge: string;
  sevenDayPlan: string[];
  engine?: string;
  isFallback?: boolean;
  quotaExceeded?: boolean;
  quotaMessage?: string;
  fallbackReason?: string;
}

export interface Topic {
  id: string;
  practiceMode?: PracticeMode;
  tag: string;
  icon: string;
  title: string;
  desc: string;
  tips: string[];
  sampleOpener: string;
  resources?: TopicResource[];
}

export type PageView = 'home' | 'mode' | 'topic' | 'practice' | 'results' | 'history' | 'analytics' | 'profile' | 'resources' | 'admin';

