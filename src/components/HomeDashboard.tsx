import React, { useState } from 'react';
import { User, PracticeStat, Topic, PageView, PracticeMode } from '../types';
import {
  INTERVIEW_TOPICS,
  RANDOM_TOPICS,
  INTERVIEW_CATEGORIES,
  RANDOM_TOPIC_CATEGORIES,
  getRandomTopic,
  detectPracticeModeFromStat,
} from '../data/topics';
import { 
  Flame, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Timer, 
  Activity, 
  Video, 
  Mic2, 
  ShieldCheck, 
  Compass, 
  CheckCircle2, 
  Clock, 
  Zap,
  Play,
  Shuffle,
  Briefcase,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

interface HomeDashboardProps {
  currentUser: User | null;
  practiceStats: PracticeStat[];
  selectedMode?: 'video' | 'audio';
  onSelectMode?: (mode: 'video' | 'audio') => void;
  selectedPracticeMode?: PracticeMode;
  onSelectPracticeMode?: (practiceMode: PracticeMode) => void;
  onStartPractice: (topic?: Topic, mode?: 'video' | 'audio', practiceMode?: PracticeMode) => void;
  onNavigate: (page: PageView) => void;
  onOpenAuth: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentUser,
  practiceStats,
  selectedMode = 'video',
  onSelectMode,
  selectedPracticeMode = 'interview',
  onSelectPracticeMode,
  onStartPractice,
  onNavigate,
  onOpenAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [spotlightRandomTopic, setSpotlightRandomTopic] = useState<Topic>(() => RANDOM_TOPICS[0]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const practicedToday = practiceStats.some((s) => s.dateStr === todayStr);

  const latestStat = practiceStats[0] || null;
  const totalPractices = currentUser?.totalPractices || practiceStats.length;
  const currentStreak = currentUser?.currentStreak || (practicedToday ? 1 : (latestStat ? 1 : 0));

  const timedStats = practiceStats.filter((s) => (s.wpm || 0) > 0 && (s.durationSeconds || 0) > 0);
  const avgWpm = timedStats.length
    ? Math.round(timedStats.reduce((acc, curr) => acc + (curr.wpm || 0), 0) / timedStats.length)
    : 0;

  const avgScore = practiceStats.length
    ? Math.round(practiceStats.reduce((acc, curr) => acc + (curr.score || 0), 0) / practiceStats.length)
    : 0;

  // Prepare chronological stats for performance chart (oldest to newest, max 10)
  const chartStats = [...practiceStats]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-10);

  const handleSwitchPracticeMode = (nextMode: PracticeMode) => {
    setSelectedCategory('All');
    if (onSelectPracticeMode) {
      onSelectPracticeMode(nextMode);
    }
  };

  const handleGenerateRandomTopic = (categoryOverride?: string) => {
    const cat = categoryOverride ?? selectedCategory;
    const nextTopic = getRandomTopic(cat, spotlightRandomTopic.id);
    setSpotlightRandomTopic(nextTopic);
    return nextTopic;
  };

  // Active categories and topics for selected practiceMode
  const activeCategories =
    selectedPracticeMode === 'random' ? RANDOM_TOPIC_CATEGORIES : INTERVIEW_CATEGORIES;
  const sourceTopics =
    selectedPracticeMode === 'random' ? RANDOM_TOPICS : INTERVIEW_TOPICS;

  const filteredTopics =
    selectedCategory === 'All'
      ? sourceTopics
      : sourceTopics.filter(
          (t) => t.tag.toLowerCase() === selectedCategory.toLowerCase()
        );

  // Render SVG Performance Trend Chart
  const renderTrendChart = () => {
    const width = 640;
    const height = 180;
    const paddingX = 40;
    const paddingY = 30;

    if (chartStats.length === 0) {
      return (
        <div className="h-44 rounded-2xl bg-white/20 dark:bg-slate-900/30 border border-dashed border-white/30 dark:border-white/10 flex flex-col items-center justify-center text-center p-6">
          <Activity className="w-8 h-8 text-indigo-400 dark:text-cyan-400 mb-2 opacity-60" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            No practice sessions recorded yet
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Complete your first speaking drill in Random Topic or Interview mode to generate your live trajectory.
          </p>
          <button
            onClick={() => onStartPractice(undefined, selectedMode, selectedPracticeMode)}
            className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            Start First Drill
          </button>
        </div>
      );
    }

    const chartData = chartStats.length === 1
      ? [{ ...chartStats[0], displayDate: 'Baseline' }, { ...chartStats[0], displayDate: 'Today' }]
      : chartStats.map(s => ({ ...s, displayDate: s.dateStr.slice(5) }));

    const minScore = 40;
    const maxScore = 100;
    const availableWidth = width - paddingX * 2;
    const availableHeight = height - paddingY * 2;

    const points = chartData.map((d, index) => {
      const x = paddingX + (index / (chartData.length - 1)) * availableWidth;
      const scoreClamped = Math.max(minScore, Math.min(maxScore, d.score));
      const y = height - paddingY - ((scoreClamped - minScore) / (maxScore - minScore)) * availableHeight;
      return { x, y, score: d.score, title: d.topicTitle, date: d.displayDate };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    const activePoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : points[points.length - 1];

    return (
      <div className="relative">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Readiness Score Trend</span>
          </div>
          {activePoint && (
            <div className="text-right">
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {activePoint.score}%
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5 truncate max-w-[140px] inline-block align-bottom">
                ({activePoint.title})
              </span>
            </div>
          )}
        </div>

        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-44 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="scoreLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {[60, 80, 100].map((scoreLevel) => {
            const y = height - paddingY - ((scoreLevel - minScore) / (maxScore - minScore)) * availableHeight;
            return (
              <g key={scoreLevel}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={width - paddingX} 
                  y2={y} 
                  stroke="currentColor" 
                  strokeOpacity="0.1" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingX - 8} 
                  y={y + 3} 
                  fill="currentColor" 
                  fillOpacity="0.4" 
                  fontSize="10" 
                  textAnchor="end"
                  className="font-mono tabular-nums"
                >
                  {scoreLevel}
                </text>
              </g>
            );
          })}

          <path d={areaD} fill="url(#scoreAreaGradient)" />

          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#scoreLineGradient)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {points.map((p, idx) => (
            <g 
              key={idx}
              onMouseEnter={() => setHoveredPointIndex(idx)}
              onMouseLeave={() => setHoveredPointIndex(null)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredPointIndex === idx ? '6' : '4'}
                className="fill-white dark:fill-slate-900 stroke-cyan-400 stroke-[2.5px] transition-all duration-150"
              />
              <text
                x={p.x}
                y={height - 10}
                fill="currentColor"
                fillOpacity="0.4"
                fontSize="9"
                textAnchor="middle"
                className="font-mono"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 glass-panel border border-white/30 dark:border-white/10 shadow-2xl">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/20 to-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/15 via-sky-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md text-[11px] font-bold text-indigo-700 dark:text-cyan-300 border border-white/40 dark:border-white/10 mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Spontaneous Speaking &amp; Job Interview Studio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {currentUser ? `Welcome back, ${currentUser.displayName}! 🚀` : 'Speak Confidently in Any Situation 🎙️'}
          </h1>

          <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Practice <strong>Random Topic Speaking</strong> (daily life, AI, education, environment, debates, storytelling) or <strong>Interview Practice</strong> (HR, technical, behavioral, and GDs) with instant Gemini AI feedback and Hinglish filler tracking.
          </p>

          {/* Daily Goal & Action Row */}
          <div className="mt-6 p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                practicedToday 
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                  : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
              }`}>
                {practicedToday ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {practicedToday ? 'Today’s Practice Completed!' : 'Daily Practice Goal: 1 Drill'}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    practicedToday
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {practicedToday ? '1 / 1 Done' : '0 / 1 Pending'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {practicedToday 
                    ? `Great job! Your current streak is active at ${currentStreak} days.` 
                    : 'Choose Random Topic Practice or Interview Practice below to begin your 2-minute session.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const randomTopic = handleGenerateRandomTopic('All');
                  handleSwitchPracticeMode('random');
                  onStartPractice(randomTopic, selectedMode, 'random');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-indigo-600 dark:text-cyan-300 border border-indigo-500/30 shadow-sm active:scale-[0.98] transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Topic</span>
              </button>
              <button
                onClick={() => onStartPractice(undefined, selectedMode, selectedPracticeMode)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  Start {selectedPracticeMode === 'random' ? 'Random Topic' : 'Interview'} Practice
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 1: PRACTICE MODE SELECTION (Random Topic Practice vs Interview Practice) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>Step 1: Select Your Practice Mode</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose between spontaneous speaking on varied everyday topics or structured job interview preparation
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-500/20 self-start sm:self-auto">
            Selected: {selectedPracticeMode === 'random' ? '🎲 Random Topic Practice' : '💼 Interview Practice'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option A: Random Topic Practice */}
          <div
            onClick={() => handleSwitchPracticeMode('random')}
            className={`cursor-pointer glass-panel rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
              selectedPracticeMode === 'random'
                ? 'border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/25 dark:ring-cyan-400/25 shadow-2xl'
                : 'border-white/30 dark:border-white/10 hover:border-cyan-400/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-sm border border-cyan-500/20">
                  <Shuffle className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  selectedPracticeMode === 'random'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {selectedPracticeMode === 'random' ? '✓ Active Practice Mode' : 'Mode A · Spontaneous Speaking'}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                A. Random Topic Practice
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Improve general communication, fluency, confidence, presentation, and spontaneous speaking on real-world topics—not restricted to interview questions.
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {[
                  'Daily life & social issues',
                  'Technology & AI',
                  'Education',
                  'Environment',
                  'Opinion & debate',
                  'Storytelling',
                  'Workplace',
                  'Current affairs',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/20 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchPracticeMode('random');
                  const randomTopic = handleGenerateRandomTopic('All');
                  onStartPractice(randomTopic, selectedMode, 'random');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Start with Random Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchPracticeMode('random');
                }}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Browse 8 Topic Categories ↓
              </button>
            </div>
          </div>

          {/* Option B: Interview Practice */}
          <div
            onClick={() => handleSwitchPracticeMode('interview')}
            className={`cursor-pointer glass-panel rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
              selectedPracticeMode === 'interview'
                ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/25 dark:ring-indigo-400/25 shadow-2xl'
                : 'border-white/30 dark:border-white/10 hover:border-indigo-400/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm border border-indigo-500/20">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  selectedPracticeMode === 'interview'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {selectedPracticeMode === 'interview' ? '✓ Active Practice Mode' : 'Mode B · Career & Placements'}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                B. Interview Practice
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Prepare for campus placements and corporate hiring rounds with structured STAR answers, self-introductions, HR questions, and group discussions.
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3.5">
                {[
                  'Self-introduction',
                  'HR interview',
                  'Technical interview',
                  'Behavioral questions',
                  'Group discussion',
                  'Company-specific questions',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/20 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchPracticeMode('interview');
                  onStartPractice(INTERVIEW_TOPICS[0], selectedMode, 'interview');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md flex items-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Start Interview Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchPracticeMode('interview');
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Browse Interview Questions ↓
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mode-Specific Topic Bank & Random Topic Generator */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>
                {selectedPracticeMode === 'random'
                  ? 'Step 2: Random Topic Practice Bank & Generator'
                  : 'Step 2: Interview Practice Question Bank'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedPracticeMode === 'random'
                ? 'Select a category below, click "Random Topic" to generate a spontaneous topic, or pick any card to start speaking'
                : 'Select an interview category (HR, Technical, Self-introduction, Behavioral, GD, Company-specific) to start practicing'}
            </p>
          </div>

          {selectedPracticeMode === 'random' && (
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => handleGenerateRandomTopic(selectedCategory)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/70 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-white/40 dark:border-white/10 shadow-sm flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
                <span>Generate Another Topic</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const topic = handleGenerateRandomTopic(selectedCategory);
                  onStartPractice(topic, selectedMode, 'random');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Topic &amp; Start</span>
              </button>
            </div>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (selectedPracticeMode === 'random') {
                  handleGenerateRandomTopic(cat);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/40 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Spotlight Random Topic Generator Banner when in Random Topic Mode */}
        {selectedPracticeMode === 'random' && (
          <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="text-2xl p-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/60 shadow-sm shrink-0">
                {spotlightRandomTopic.icon}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                    🎲 Random Topic Spotlight • {spotlightRandomTopic.tag}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                  {spotlightRandomTopic.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
                  {spotlightRandomTopic.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleGenerateRandomTopic(selectedCategory)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white/60 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-white/40 dark:border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Another Topic</span>
              </button>
              <button
                type="button"
                onClick={() => onStartPractice(spotlightRandomTopic, selectedMode, 'random')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-colors"
              >
                <span>Practice This Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() =>
                onStartPractice(topic, selectedMode, topic.practiceMode || selectedPracticeMode)
              }
              className="group cursor-pointer glass-panel rounded-2xl p-5 border border-white/30 dark:border-white/10 hover:border-cyan-400/60 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-2xl p-2 rounded-xl bg-white/40 dark:bg-white/10 backdrop-blur-sm shadow-sm">
                    {topic.icon}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-500/20 truncate">
                    {topic.tag}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                  {topic.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {topic.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-cyan-400">
                <span>
                  Start {selectedPracticeMode === 'random' ? 'Topic' : 'Interview'} Session
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recording Media Mode Selection (Video & Audio vs Audio-Only) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              <span>Recording Setup (Video + Audio or Audio Only)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Both Random Topic Practice and Interview Practice support camera + mic or audio-only/text practice
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-500/20 self-start sm:self-auto">
            Media Setup: {selectedMode === 'video' ? '📹 Video & Audio' : '🎙️ Audio Only'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => onSelectMode && onSelectMode('video')}
            className={`cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
              selectedMode === 'video'
                ? 'border-indigo-500 dark:border-cyan-400 ring-2 ring-indigo-500/25 dark:ring-cyan-400/25 shadow-xl'
                : 'border-white/30 dark:border-white/10 hover:border-indigo-400/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                  <Video className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  selectedMode === 'video'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {selectedMode === 'video' ? '✓ Selected Setup' : 'Camera + Mic'}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Video &amp; Audio Mode
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Uses your webcam and microphone for live transcription, measured speaking WPM, filler detection, and approximate posture feedback.
              </p>
            </div>
          </div>

          <div
            onClick={() => onSelectMode && onSelectMode('audio')}
            className={`cursor-pointer glass-panel rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
              selectedMode === 'audio'
                ? 'border-indigo-500 dark:border-cyan-400 ring-2 ring-indigo-500/25 dark:ring-cyan-400/25 shadow-xl'
                : 'border-white/30 dark:border-white/10 hover:border-cyan-400/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
                  <Mic2 className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  selectedMode === 'audio'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/40 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {selectedMode === 'audio' ? '✓ Selected Setup' : 'Voice Only'}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Audio-Only Mode
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Camera-free vocal practice focused on speaking cadence, clarity of ideas, structure, and eliminating filler crutches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Glassmorphism Statistic Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/25 dark:border-white/10 hover:border-indigo-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {totalPractices}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              drills
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {latestStat ? `Latest on ${latestStat.dateStr}` : 'Begin your journey'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/25 dark:border-white/10 hover:border-cyan-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {avgScore > 0 ? `${avgScore}%` : (latestStat ? `${latestStat.score}%` : '—')}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
            {avgScore >= 75 ? 'Strong Readiness ✨' : (avgScore > 0 ? 'Improving steadily' : 'Unrated')}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/25 dark:border-white/10 hover:border-orange-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Practice Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-orange-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {currentStreak}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-orange-600 dark:text-orange-400 font-medium truncate">
            {currentUser?.highestStreak ? `Record: ${currentUser.highestStreak}d streak` : 'Daily consistency wins'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/25 dark:border-white/10 hover:border-violet-400/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Measured Pace
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {avgWpm > 0 ? avgWpm : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {avgWpm > 0 ? 'WPM' : 'Timed drills'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Benchmark: 120 – 150 WPM
          </p>
        </div>
      </section>

      {/* Performance Trends & Transformation Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 sm:p-6 border border-white/30 dark:border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Communication Readiness Trend
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Scores across your recent Random Topic and Interview sessions
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Full Logs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {renderTrendChart()}
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Target benchmark: <strong>75%+</strong></span>
            <span>Based on {practiceStats.length} verified sessions</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/30 dark:border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Transformation Snapshot
              </h3>
            </div>

            {practiceStats.length >= 2 ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Day 1 Baseline</span>
                    <span className="text-slate-900 dark:text-white tabular-nums">
                      {practiceStats[practiceStats.length - 1].score}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 dark:bg-slate-600 rounded-full"
                      style={{ width: `${practiceStats[practiceStats.length - 1].score}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-indigo-600 dark:text-cyan-400">Latest Session</span>
                    <span className="text-indigo-600 dark:text-cyan-400 font-black tabular-nums">
                      {latestStat?.score}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${latestStat?.score || 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key Focus Area
                  </span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {latestStat?.primaryIssue || 'Filler reduction & structure'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <p>Complete at least 2 practice sessions to see your Day 1 vs Latest growth comparison.</p>
                <div className="inline-block p-2 rounded-xl bg-white/40 dark:bg-slate-800/40 text-[11px] font-medium text-indigo-600 dark:text-cyan-400">
                  Target: 80%+ speech clarity
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('analytics')}
            className="w-full mt-4 py-2.5 px-3 rounded-xl text-xs font-bold bg-white/40 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-white/40 dark:border-white/10 transition-colors text-center"
          >
            Deep Dive Analytics →
          </button>
        </div>
      </section>

      {/* Recent Practice Sessions */}
      <section className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/30 dark:border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Recent Practice Sessions
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Distinguishes Random Topic Practice and Interview Practice sessions
            </p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-indigo-600 dark:text-cyan-400 hover:underline"
          >
            View All ({practiceStats.length})
          </button>
        </div>

        {practiceStats.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No practice sessions recorded yet. Pick a mode and topic above to start your first session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10 text-slate-400 dark:text-slate-500 font-bold">
                  <th className="pb-3 pl-2">Topic &amp; Category</th>
                  <th className="pb-3 text-center">Practice Type</th>
                  <th className="pb-3 text-center">Media</th>
                  <th className="pb-3 text-center">Score</th>
                  <th className="pb-3 text-center">Pace</th>
                  <th className="pb-3 text-center">Duration</th>
                  <th className="pb-3 text-right pr-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {practiceStats.slice(0, 5).map((stat) => {
                  const pMode = detectPracticeModeFromStat(stat);
                  return (
                    <tr key={stat.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-2 max-w-[200px] sm:max-w-xs truncate">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {stat.topicTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {stat.category}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            pMode === 'random'
                              ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25'
                              : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25'
                          }`}
                        >
                          {pMode === 'random' ? '🎲 Random Topic' : '💼 Interview'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/40 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {stat.mode === 'video' ? <Video className="w-3 h-3 text-indigo-500" /> : <Mic2 className="w-3 h-3 text-cyan-400" />}
                          <span className="capitalize">{stat.mode}</span>
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono font-bold tabular-nums">
                        <span className={`px-2 py-0.5 rounded-lg text-xs ${
                          stat.score >= 80 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                            : (stat.score >= 65 
                                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400' 
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400')
                        }`}>
                          {stat.score}%
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {stat.wpm > 0 ? `${stat.wpm} WPM` : 'Typed'}
                      </td>
                      <td className="py-3 text-center font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {stat.durationSeconds > 0 ? `${stat.durationSeconds}s` : '—'}
                      </td>
                      <td className="py-3 text-right pr-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {stat.dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Privacy Guarantee Card */}
      <section className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">Zero-Storage Privacy Architecture: </span>
          Video and audio feeds are analyzed transiently in your browser. Raw recordings and full transcripts are never stored in any database.
        </div>
      </section>
    </div>
  );
};

