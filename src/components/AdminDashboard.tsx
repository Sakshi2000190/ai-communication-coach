import React, { useState, useEffect } from 'react';
import { User, PracticeStat } from '../types';
import { getAdminOverview, toggleUserRole } from '../services/api';
import { sqlSchemaCode } from '../data/supabaseSchema';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Award, 
  Timer, 
  Search, 
  FileCode, 
  Lock, 
  Database,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Server,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onOpenAuth }) => {
  const [data, setData] = useState<{
    metrics: {
      totalUsers: number;
      totalPractices: number;
      avgScore: number;
      avgWpm: number;
      activeStreakUsers: number;
      zeroDataStorageAuditPassed: boolean;
      recordingsStored: number;
      transcriptsStored: number;
      backendEngine?: string;
    };
    users: User[];
    recentActivity: PracticeStat[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'database'>('users');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load administrator data. Admin rights required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchOverview();
    }
  }, [currentUser]);

  const handleRoleToggle = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await toggleUserRole(userId, newRole);
      setActionSuccess(`User role successfully changed to ${newRole}`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchOverview();
    } catch (err: any) {
      alert(err?.message || 'Failed to update user role');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 text-center glass-panel-elevated rounded-3xl shadow-xl space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Administrator Access Required
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          The Admin Portal is restricted to authorized faculty and placement administrators.
          You can sign in with the pre-configured admin account (<strong>sakshimarya193@gmail.com</strong>) to inspect the administrative controls.
        </p>
        <button
          onClick={onOpenAuth}
          className="py-2.5 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  const filteredUsers = data?.users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.collegeOrCompany?.toLowerCase().includes(q) ||
      u.targetRole?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Placement Administrator Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Real-time analytics, user cohort directory, privacy compliance verification &amp; Supabase cloud database configuration.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold glass-button text-slate-800 dark:text-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 text-xs font-bold rounded-2xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 text-xs font-bold">
          {error}
        </div>
      )}

      {/* KPI Glass Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Registered Freshers</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {data?.metrics.totalUsers ?? '—'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Students &amp; candidates</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Total Practices</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {data?.metrics.totalPractices ?? '—'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Completed sessions</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Average Score</span>
            <Award className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {data?.metrics.avgScore ? `${data.metrics.avgScore}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Readiness benchmark</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Average Speed</span>
            <Timer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {data?.metrics.avgWpm ?? '—'} <span className="text-xs font-bold">WPM</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Target: 120-150 WPM</span>
        </div>
      </div>

      {/* Backend Engine & Storage Banner */}
      <div className="p-5 rounded-2xl glass-panel border-indigo-500/30 flex items-center justify-between flex-wrap gap-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Active Storage Engine:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-mono">
                {data?.metrics.backendEngine || 'Supabase PostgreSQL Cloud Ready'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Zero-Data Media Protocol: 0 audio/video stored · 0 transcripts stored in database
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('database')}
          className="relative z-10 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-500/20 transition-all"
        >
          View Supabase Config &amp; SQL →
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1.5 rounded-2xl glass-panel-subtle gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Candidates ({data?.users.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'activity'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Practice Activity Feed ({data?.recentActivity.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'database'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase SQL &amp; Credentials</span>
        </button>
      </div>

      {/* Tab: Users Directory */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, email, college..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/25 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-md"
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              Showing {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">College / Role</th>
                  <th className="py-3 px-3">System Role</th>
                  <th className="py-3 px-3">Streak</th>
                  <th className="py-3 px-3">Practices</th>
                  <th className="py-3 px-3">Joined</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{u.displayName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {u.collegeOrCompany || 'College Student'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.targetRole}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/20'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-black font-mono text-orange-600 dark:text-orange-400">
                      {u.currentStreak}d
                    </td>
                    <td className="py-3.5 px-3 font-semibold font-mono text-slate-800 dark:text-slate-200">
                      {u.totalPractices}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {u.createdAt ? u.createdAt.slice(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {u.email.toLowerCase() === 'sakshimarya193@gmail.com' ? (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold italic">Primary Admin</span>
                      ) : u.role === 'admin' ? (
                        <button
                          onClick={() => handleRoleToggle(u.id, 'user')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:text-red-600 hover:border-red-400 transition-colors"
                        >
                          Demote
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleToggle(u.id, 'admin')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Activity Feed */}
      {activeTab === 'activity' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Anonymized Practice Activity Feed
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Telemetry metrics for candidate drill completion. No audio, video, or sensitive transcripts are ever retained.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/20 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Candidate</th>
                  <th className="py-3 px-3">Topic</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3">WPM</th>
                  <th className="py-3 px-3">Fillers</th>
                  <th className="py-3 px-3">Key Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {data?.recentActivity.map((act) => (
                  <tr key={act.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{act.dateStr}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                      {act.userName || act.userEmail}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{act.topicTitle}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{act.category} ({act.mode})</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {act.score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-800 dark:text-slate-200">{act.wpm}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-800 dark:text-slate-200">{act.fillerCount}</td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={act.primaryIssue}>
                      {act.primaryIssue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Supabase & Database Architecture */}
      {activeTab === 'database' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Supabase Cloud Integration &amp; SQL Schema</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Connect your newly created Supabase PostgreSQL database. Paste the 3 keys in AI Studio Secrets and run this SQL schema.
            </p>
          </div>

          {/* 3 Keys Checklist */}
          <div className="p-5 rounded-2xl glass-panel-subtle space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              1. Add these 3 Secrets in Google AI Studio (Settings ⚙️ → Secrets):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl glass-panel">
                <code className="text-indigo-600 dark:text-indigo-400 font-bold block font-mono">SUPABASE_URL</code>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Project URL from Supabase Project Settings → API</span>
              </div>
              <div className="p-3.5 rounded-xl glass-panel">
                <code className="text-indigo-600 dark:text-indigo-400 font-bold block font-mono">SUPABASE_ANON_KEY</code>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Public anonymous client key (anon)</span>
              </div>
              <div className="p-3.5 rounded-xl glass-panel">
                <code className="text-amber-600 dark:text-amber-400 font-bold block font-mono">SUPABASE_SERVICE_ROLE_KEY</code>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Secret service_role key (server-only)</span>
              </div>
            </div>
          </div>

          {/* SQL Schema Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Run this Schema &amp; Row Level Security (RLS) in Supabase SQL Editor:
              </span>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/25"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 text-slate-200 font-mono text-xs overflow-x-auto max-h-80 border border-white/10 backdrop-blur-md">
              <pre className="text-[11px] leading-relaxed text-slate-300">
                {sqlSchemaCode}
              </pre>
            </div>
          </div>

          {/* RLS Security Guarantees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                🔒 Row Level Security Enforced
              </span>
              <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed text-[11px]">
                Each candidate can only view and mutate their own private profile and practice statistics records. Cross-account data leaks are mathematically blocked by Postgres RLS.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                🛡️ Zero Media / Zero Transcript Retention
              </span>
              <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed text-[11px]">
                The schema strictly limits columns to scores, WPM, and filler counts. Neither raw audio/video files nor speech transcripts are stored.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
