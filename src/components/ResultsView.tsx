import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { AnalysisResult, User, PracticeMode } from '../types';
import { savePracticeStat } from '../services/api';
import { detectPracticeModeFromStat } from '../data/topics';
import { 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  RotateCcw, 
  BookOpen, 
  Check,
  ExternalLink,
  Target
} from 'lucide-react';

interface ResultsViewProps {
  analysis: AnalysisResult;
  stats: {
    topicId?: string;
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
  };
  currentUser: User | null;
  onSaved: (streak: number) => void;
  onPracticeAgain: () => void;
  onOpenAuth: () => void;
  onNavigateHistory: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  analysis,
  stats,
  currentUser,
  onSaved,
  onPracticeAgain,
  onOpenAuth,
  onNavigateHistory,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const effectivePracticeMode: PracticeMode =
    stats.practiceMode ||
    analysis.practiceMode ||
    detectPracticeModeFromStat(stats);

  // Trigger confetti if score is high
  useEffect(() => {
    if (analysis.score >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b'],
        });
      } catch (e) {}
    }
  }, [analysis.score]);

  // Auto-save if user is signed in
  useEffect(() => {
    if (currentUser && !isSaved && !saving) {
      handleSave();
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      // Send ONLY statistics - NEVER transcripts or media
      const res = await savePracticeStat({
        topicId:
          stats.topicId ||
          (effectivePracticeMode === 'random' ? 'rt_' : 'iv_') +
            stats.topicTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30),
        topicTitle: stats.topicTitle,
        category: stats.category,
        mode: stats.mode,
        practiceMode: effectivePracticeMode,
        score: stats.score,
        wpm: stats.wpm,
        fillerCount: stats.fillerCount,
        fillerRatePerMin: stats.fillerRatePerMin,
        wordCount: stats.wordCount,
        durationSeconds: stats.durationSeconds,
        primaryIssue: stats.primaryIssue,
        postureScore: stats.postureScore,
        gestureStatus: stats.gestureStatus,
      });
      setIsSaved(true);
      onSaved(res.streak);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to sync practice stats to your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    const paceLine = stats.wpm > 0 ? `${stats.wpm} WPM` : `${stats.wordCount} words (Typed)`;
    const modeLabel =
      effectivePracticeMode === 'random' ? 'Random Topic Practice' : 'Interview Practice';
    const text = `🔥 I just scored ${analysis.score}% on AI Communication Coach (${modeLabel}) practicing "${stats.topicTitle}"!\n\nDelivery Metrics:\n- Pace: ${paceLine}\n- Fillers: ${stats.fillerCount}\n\nPracticing daily to level up my communication! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 65) return 'text-sky-600 dark:text-sky-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with Score */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 text-center border border-white/30 dark:border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {effectivePracticeMode === 'random'
                  ? '🎲 Random Topic Practice Completed'
                  : '💼 Interview Practice Completed'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-white/30 dark:border-white/10">
              {stats.mode === 'video' ? '📹 Video & Audio Mode' : '🎙️ Audio-Only Mode'}
            </span>
            {analysis.engine && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                !analysis.isFallback && analysis.engine.startsWith('gemini')
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-cyan-300 border-indigo-500/25'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25'
              }`}>
                {!analysis.isFallback && analysis.engine.startsWith('gemini')
                  ? '✨ Evaluated with Gemini AI (3.8 Flash)'
                  : '⚠️ Fallback Analysis (Rule-Based · Not Gemini AI)'}
              </span>
            )}
          </div>

          {/* Prominent Quota Exceeded / Fallback Disclosure Banner */}
          {(analysis.isFallback || analysis.quotaExceeded || analysis.engine === 'telemetry-heuristics') && (
            <div className="max-w-2xl mx-auto mb-5 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-left space-y-1.5">
              <div className="text-xs sm:text-sm font-black text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  {analysis.quotaExceeded
                    ? 'Gemini API Quota Exceeded (HTTP 429) — Local Fallback Analysis'
                    : 'Local Rule-Based Fallback Analysis (Not Generated by Gemini AI)'}
                </span>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                {analysis.quotaMessage ||
                  analysis.fallbackReason ||
                  'The Gemini API quota has been exceeded or the AI service is temporarily unavailable. You may need to wait for your daily/per-minute quota to reset or check your Google AI Studio billing and rate limits. The feedback below was generated by the built-in heuristic fallback analyzer.'}
              </p>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentUser ? `Outstanding Effort, ${currentUser.displayName}!` : 'Great Practice Session!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Mode-aware coaching for <strong>"{stats.topicTitle}"</strong> ({stats.category})
          </p>

          {/* Circular Score Ring */}
          <div className="relative w-36 h-36 mx-auto my-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className="text-cyan-500 dark:text-cyan-400 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * analysis.score) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl sm:text-4xl font-black font-mono tabular-nums ${getScoreColor(analysis.score)}`}>
                {analysis.score}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {effectivePracticeMode === 'random' ? 'Fluency' : 'Readiness'}
              </span>
            </div>
          </div>

          {/* Key Metrics Row (4 cards: Valid WPM, Fillers, Duration/Words, Posture) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Speaking Pace
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono tabular-nums">
                {stats.wpm > 0 && stats.durationSeconds > 0 ? `${stats.wpm} WPM` : 'N/A (Typed)'}
              </div>
              <span className="text-[10px] text-slate-400">
                {stats.wpm > 0 ? 'Target: 120-150' : 'Untimed editor'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fillers
              </span>
              <div className="text-lg font-black text-amber-500 mt-0.5 font-mono tabular-nums">
                {stats.fillerCount}
              </div>
              <span className="text-[10px] text-slate-400">
                {stats.durationSeconds > 0 ? `${stats.fillerRatePerMin}/min` : 'In transcript'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Duration
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono tabular-nums">
                {stats.durationSeconds > 0 ? `${stats.durationSeconds}s` : 'Untimed'}
              </div>
              <span className="text-[10px] text-slate-400">{stats.wordCount} words</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Posture (Approx.)
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
                {stats.mode === 'video' && stats.postureScore !== null
                  ? `${Math.max(0, Math.round((1 - stats.postureScore) * 100))}% Upright`
                  : 'Not tracked'}
              </div>
              <span className="text-[10px] text-slate-400">
                {stats.mode === 'video' && stats.postureScore !== null ? 'Browser camera' : 'Audio / Text mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths Card */}
      <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {effectivePracticeMode === 'random'
              ? 'Positive Speaking Signals (What You Did Well)'
              : 'Panel Positive Signals (What You Did Well)'}
          </span>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 pl-6 list-disc">
          {analysis.strengths.map((str, idx) => (
            <li key={idx} className="leading-relaxed font-medium">
              {str}
            </li>
          ))}
        </ul>
      </div>

      {/* Primary Bottleneck, Corrective Exercise & Immediate Challenge */}
      <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            Main Improvement Area
          </span>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mt-2.5">
            {analysis.primaryBottleneck}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            <strong>
              {effectivePracticeMode === 'random'
                ? 'Audience & Coach Insight:'
                : 'Recruiter Insight:'}
            </strong>{' '}
            {analysis.recruiterPerspective}
          </p>
        </div>

        {/* 3 Actionable Steps */}
        <div className="pt-4 border-t border-white/20 dark:border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            3 Concrete Action Steps For Today
          </h3>
          <ol className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 pl-5 list-decimal font-medium">
            {analysis.actionableSteps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Corrective Exercise */}
        {analysis.correctiveExercise && (
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-xs space-y-1">
            <div className="font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-500" />
              <span>Targeted Corrective Exercise:</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {analysis.correctiveExercise}
            </p>
          </div>
        )}

        {/* Next Session Practice Plan */}
        {analysis.nextSessionPlan && (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs space-y-1">
            <div className="font-bold text-indigo-900 dark:text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Recommended Next Session Goal:</span>
            </div>
            <p className="text-indigo-950 dark:text-slate-200 leading-relaxed font-medium">
              {analysis.nextSessionPlan}
            </p>
          </div>
        )}

        {/* Immediate 60s drill */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <span>⚡</span>
            <span>Immediate 60-Second Challenge:</span>
          </div>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
            {analysis.immediatePracticeChallenge}
          </p>
        </div>
      </div>

      {/* Curated Learning Resources */}
      {analysis.learningResources && analysis.learningResources.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Recommended Learning Resources
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.learningResources.map((res, i) => (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/10 hover:border-cyan-400/50 transition-all flex items-center justify-between gap-3 group"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
                    {res.type}
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-cyan-300">
                    {res.title}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Delivery & Language Assessment Breakdown */}
      {(analysis.clarityAndFluency || analysis.grammarAndVocabulary || analysis.confidenceAndDelivery || analysis.postureAndGestureFeedback) && (
        <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Communication &amp; Language Diagnostic
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {analysis.clarityAndFluency && (
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Clarity &amp; Fluency
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {analysis.clarityAndFluency}
                </p>
              </div>
            )}

            {analysis.grammarAndVocabulary && (
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Grammar &amp; Vocabulary
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {analysis.grammarAndVocabulary}
                </p>
              </div>
            )}

            {analysis.confidenceAndDelivery && (
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Confidence &amp; Cadence
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {analysis.confidenceAndDelivery}
                </p>
              </div>
            )}

            {analysis.postureAndGestureFeedback && (
              <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Visual Presence &amp; Body Language
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {analysis.postureAndGestureFeedback}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hinglish to Corporate English Upgrades */}
      {analysis.hinglishToCorporate && analysis.hinglishToCorporate.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇮🇳 ➔ 💼</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Hinglish to Corporate Phrasing Upgrades
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Convert casual spoken habits into crisp corporate expressions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {analysis.hinglishToCorporate.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 text-xs space-y-1.5"
              >
                <div className="text-rose-500 font-medium line-through">
                  "{item.casual}"
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span>✔</span>
                  <span>"{item.corporate}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Personalized Roadmap */}
      <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>📅</span>
          <span>Your 7-Day Micro-Drill Roadmap</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {analysis.sevenDayPlan.map((planItem, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 text-xs flex gap-2.5"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 font-black flex items-center justify-center shrink-0 text-[11px] font-mono">
                {idx + 1}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {planItem}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save & Sharing Actions */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
        {saveError && (
          <div className="p-3 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {saveError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Sign In to Save Streak</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Saved to your profile &amp; streak!</span>
              </div>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPracticeAgain}
              className="py-2.5 px-4 rounded-xl text-xs font-bold glass-button text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Another Topic</span>
            </button>

            <button
              onClick={onNavigateHistory}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 flex items-center gap-1.5 transition-opacity"
            >
              <span>View Streak History →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
