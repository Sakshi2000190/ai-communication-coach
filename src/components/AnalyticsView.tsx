import React from 'react';
import { PracticeStat, User } from '../types';
import { 
  LineChart, 
  TrendingUp, 
  Timer, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Compass, 
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AnalyticsViewProps {
  currentUser: User | null;
  stats: PracticeStat[];
  onStartPractice: () => void;
  onOpenAuth: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentUser,
  stats,
  onStartPractice,
  onOpenAuth,
}) => {
  const totalDrills = stats.length;
  const avgScore = totalDrills
    ? Math.round(stats.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalDrills)
    : 0;

  const avgWpm = totalDrills
    ? Math.round(stats.reduce((acc, curr) => acc + (curr.wpm || 0), 0) / totalDrills)
    : 0;

  const totalFillers = stats.reduce((acc, curr) => acc + (curr.fillerCount || 0), 0);
  const avgFillersPerSession = totalDrills ? (totalFillers / totalDrills).toFixed(1) : '0';

  const firstStat = stats[stats.length - 1] || null;
  const latestStat = stats[0] || null;

  // Pace status
  const getPaceStatus = (wpm: number) => {
    if (wpm < 110) return { label: 'Slow (Deliberate)', color: 'text-amber-500', advice: 'Pick up cadence slightly to sound proactive.' };
    if (wpm > 165) return { label: 'Rushed (High speed)', color: 'text-amber-500', advice: 'Slow down; take intentional pauses at commas.' };
    return { label: 'Optimal Interview Pace', color: 'text-emerald-500', advice: 'Clear, crisp, and easily intelligible to Indian HR panels.' };
  };

  const paceInfo = getPaceStatus(avgWpm);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-500/20 text-xs font-bold mb-2">
            <LineChart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quantitative Communication Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Performance &amp; Speech Trajectory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Auditing your pace, Hinglish filler density, and body language across campus interview drills.
          </p>
        </div>

        <button
          onClick={onStartPractice}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-md shadow-indigo-600/20 transition-all"
        >
          <span>New Drill</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Readiness Index */}
        <div className="glass-panel rounded-2xl p-5 border border-white/25 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Readiness Index
            </span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {avgScore > 0 ? `${avgScore}/100` : '—'}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {avgScore >= 75 ? 'Meets Top MNC Threshold' : 'Target: 75+ for Tier-1 Drives'}
          </p>
        </div>

        {/* Avg WPM Pace */}
        <div className="glass-panel rounded-2xl p-5 border border-white/25 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Pace
            </span>
            <Timer className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {avgWpm > 0 ? `${avgWpm}` : '—'} <span className="text-xs text-slate-400 font-sans">WPM</span>
          </div>
          <p className={`text-xs font-medium mt-1 ${paceInfo.color}`}>
            {paceInfo.label}
          </p>
        </div>

        {/* Avg Fillers per Drill */}
        <div className="glass-panel rounded-2xl p-5 border border-white/25 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Filler Density
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {avgFillersPerSession} <span className="text-xs text-slate-400 font-sans">avg</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {totalFillers} total crutch words detected
          </p>
        </div>

        {/* Drills Completed */}
        <div className="glass-panel rounded-2xl p-5 border border-white/25 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sample Size
            </span>
            <Activity className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {totalDrills} <span className="text-xs text-slate-400 font-sans">sessions</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {currentUser?.currentStreak || 0}-day continuous streak
          </p>
        </div>
      </div>

      {/* Deep Dive Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speaking Pace Analysis */}
        <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Speaking Cadence &amp; Pace Gauge
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Indian recruitment panels at companies like TCS, Infosys, and Deloitte evaluate whether freshers rush when nervous.
            The optimal conversational interview range is <strong>120 – 150 Words Per Minute</strong>.
          </p>

          <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-900/50 border border-white/30 dark:border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Your Typical Pace</span>
              <span className="font-mono text-indigo-600 dark:text-cyan-400 tabular-nums">{avgWpm || 135} WPM</span>
            </div>

            {/* Gauge visualization */}
            <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="w-[30%] bg-amber-400/40 text-[9px] font-bold text-center leading-4 text-amber-800 dark:text-amber-200 truncate">Slow</div>
              <div className="w-[40%] bg-emerald-500/60 text-[9px] font-bold text-center leading-4 text-emerald-900 dark:text-emerald-100 truncate">Ideal (120-150)</div>
              <div className="w-[30%] bg-amber-500/40 text-[9px] font-bold text-center leading-4 text-amber-800 dark:text-amber-200 truncate">Rushed</div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              💡 {paceInfo.advice}
            </p>
          </div>
        </div>

        {/* Hinglish & Filler Word Crutches */}
        <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hinglish &amp; Filler Crutch Frequency
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The coach tracks commonly overused hesitation crutches in college placements.
          </p>

          <div className="space-y-2.5">
            {[
              { word: '"basically"', freq: 'High Frequency', advice: 'Substitute with: "In essence" or state your point directly.' },
              { word: '"you know"', freq: 'Casual Habit', advice: 'Pause silently for 1 second instead of seeking validation.' },
              { word: '"matlab / like"', freq: 'Language Switch Crutch', advice: 'Structure sentences using the STAR framework before speaking.' },
            ].map((f, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                    {f.word}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {f.advice}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                  {f.freq}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transformation Timeline */}
      <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Session Progression Audit
        </h3>

        {stats.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No session history found. Start your first practice drill to establish your baseline.
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((s, idx) => (
              <div 
                key={s.id}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-400/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    #{stats.length - idx}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.topicTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {s.category} · {s.mode.toUpperCase()} mode · {s.durationSeconds}s duration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block font-sans">Speed</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{s.wpm} WPM</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block font-sans">Fillers</span>
                    <span className="font-bold text-amber-500">{s.fillerCount}</span>
                  </div>
                  <div className="text-right pl-2 border-l border-white/20 dark:border-white/10">
                    <span className="text-slate-400 text-[10px] block font-sans">Score</span>
                    <span className={`font-black text-sm ${s.score >= 75 ? 'text-emerald-500' : 'text-cyan-400'}`}>
                      {s.score}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
