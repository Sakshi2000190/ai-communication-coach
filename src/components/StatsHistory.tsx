import React, { useState } from 'react';
import { PracticeStat, User } from '../types';
import { detectPracticeModeFromStat } from '../data/topics';
import { 
  Flame, 
  TrendingUp, 
  Calendar, 
  Share2, 
  Award, 
  Timer, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

interface StatsHistoryProps {
  currentUser: User | null;
  stats: PracticeStat[];
  onStartPractice: () => void;
  onOpenAuth: () => void;
}

export const StatsHistory: React.FC<StatsHistoryProps> = ({
  currentUser,
  stats,
  onStartPractice,
  onOpenAuth,
}) => {
  const [modeFilter, setModeFilter] = useState<'all' | 'random' | 'interview'>('all');
  const currentStreak = currentUser?.currentStreak || (stats.length > 0 ? 1 : 0);
  const highestStreak = currentUser?.highestStreak || currentStreak;

  const firstSession = stats[stats.length - 1] || null;
  const latestSession = stats[0] || null;

  const filteredStats = stats.filter((s) => {
    if (modeFilter === 'all') return true;
    return detectPracticeModeFromStat(s) === modeFilter;
  });

  // Compute 7 days of current week
  const getWeekDays = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 for Mon
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);

    const practicedDates = new Set(stats.map((s) => s.dateStr));

    return days.map((name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      const isDone = practicedDates.has(str);
      const isToday = str === now.toISOString().slice(0, 10);
      return { name, dateStr: str, isDone, isToday };
    });
  };

  const weekDays = getWeekDays();

  const handleShare = () => {
    const text = `🔥 I am on a ${currentStreak}-day practice streak on AI Communication Coach! Latest score: ${latestSession ? latestSession.score + '%' : 'Practicing'} preparing for speaking & campus interviews.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    if (score >= 65) return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
    if (score >= 50) return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    return 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/20 text-orange-600 dark:text-orange-400">
              <Flame className="w-5 h-5 fill-orange-500" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Streak &amp; Performance History
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Track daily practice consistency across Random Topic &amp; Interview drills, pace improvements, and Hinglish filler reduction.
          </p>
        </div>

        <button
          onClick={handleShare}
          className="self-start sm:self-auto inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Streak on WhatsApp</span>
        </button>
      </div>

      {/* Streak & Weekly Tracker Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/20 dark:border-white/10 pb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
              <Flame className="w-9 h-9 fill-orange-500 text-orange-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                  {currentStreak}
                </span>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Day Streak
                </span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-0.5">
                {currentStreak > 0 ? '🔥 You are on fire! Consistent practice builds real confidence.' : 'Complete 1 drill today to start your speaking streak!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="text-center sm:text-left">
              <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Personal Best</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{highestStreak} days</span>
            </div>
            <div className="w-px h-10 bg-white/20 dark:border-white/10" />
            <div className="text-center sm:text-left">
              <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Total Drills</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{stats.length} sessions</span>
            </div>
          </div>
        </div>

        {/* 7-Day Week Row */}
        <div className="relative z-10">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>This Week's Consistency Grid:</span>
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
            {weekDays.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day.name}</span>
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                    day.isDone
                      ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/40'
                      : 'border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-900/40'
                  } ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900' : ''}`}
                >
                  {day.isDone ? '✓' : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day 1 vs Today Comparison */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Skill Growth (Day 1 Diagnostic vs Latest Practice)
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              <span>Day 1 Diagnostic Score</span>
              <span className="text-slate-900 dark:text-white font-mono font-black">{firstSession ? `${firstSession.score}%` : '—'}</span>
            </div>
            <div className="w-full h-3 bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden border border-white/20 dark:border-white/10">
              <div
                className="h-full bg-slate-400 dark:bg-slate-500 transition-all duration-500 rounded-full"
                style={{ width: `${firstSession?.score || 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Latest Practice Performance
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-sm">
                {latestSession ? `${latestSession.score}%` : '—'}
              </span>
            </div>
            <div className="w-full h-3 bg-indigo-500/10 dark:bg-indigo-950/60 rounded-full overflow-hidden border border-indigo-500/20">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 transition-all duration-500 rounded-full shadow-sm"
                style={{ width: `${latestSession?.score || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Complete Performance History Table */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recorded Practice Sessions
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl glass-panel-subtle">
              <button
                type="button"
                onClick={() => setModeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  modeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({stats.length})
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('random')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  modeFilter === 'random'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🎲 Random Topic
              </button>
              <button
                type="button"
                onClick={() => setModeFilter('interview')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  modeFilter === 'interview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                💼 Interview
              </button>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              Showing {filteredStats.length} session{filteredStats.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {filteredStats.length === 0 ? (
          <div className="py-14 text-center text-slate-500 dark:text-slate-400 glass-panel-subtle rounded-2xl">
            <p className="text-sm font-semibold">No practice sessions found for this filter.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Start a 2-minute Random Topic or Interview drill to record your performance.</p>
            <button
              onClick={onStartPractice}
              className="mt-4 py-2.5 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
            >
              Start Practice Drill →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Practice Mode</th>
                  <th className="py-3 px-3">Topic &amp; Category</th>
                  <th className="py-3 px-3">Media</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">WPM</th>
                  <th className="py-3 px-3">Hinglish Fillers</th>
                  <th className="py-3 px-3">Key Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filteredStats.map((s) => {
                  const pMode = detectPracticeModeFromStat(s);
                  const cleanCat = s.category.replace(/^(Random Topic|Interview)\s*•\s*/i, '');
                  return (
                    <tr key={s.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {s.dateStr}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          pMode === 'random'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                        }`}>
                          {pMode === 'random' ? '🎲 Random Topic' : '💼 Interview'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {s.topicTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{cleanCat}</div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-white/20 dark:border-white/10">
                          {s.mode === 'video' ? '📹 Video' : '🎙️ Audio'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full font-black font-mono text-xs border ${getScoreBadge(s.score)}`}>
                          {s.score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {s.wpm > 0 ? s.wpm : 'Typed'}
                      </td>
                      <td className="py-3.5 px-3 font-semibold font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {s.fillerCount} ({s.fillerRatePerMin}/m)
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={s.primaryIssue}>
                        {s.primaryIssue}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Privacy Note */}
        <div className="pt-4 border-t border-white/20 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Data Storage: Only performance numbers are saved</span>
          </span>
          <span>No audio, video, or transcripts stored in any cloud storage</span>
        </div>
      </div>
    </div>
  );
};
