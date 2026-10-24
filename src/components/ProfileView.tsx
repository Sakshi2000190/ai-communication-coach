import React from 'react';
import { User } from '../types';
import { 
  UserCircle, 
  ShieldCheck, 
  Database, 
  Flame, 
  Award, 
  Activity, 
  Lock, 
  Sparkles,
  LogOut,
  Mail,
  Building,
  Target
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onStartPractice: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onStartPractice,
}) => {
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 glass-panel rounded-3xl p-8 text-center border border-white/30 dark:border-white/10 shadow-2xl space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
          <UserCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Sign In to Access Your Candidate Profile
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Create a free candidate profile to automatically track your daily practice streak, monitor WPM speaking cadence improvements, and retain your coaching history.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const isPrimaryAdmin = currentUser.email.toLowerCase() === 'sakshimarya193@gmail.com';

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-cyan-300 border border-indigo-500/20 text-xs font-bold mb-2">
          <UserCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Candidate Profile &amp; Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account &amp; Security Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your registered candidate profile, verified credentials, and database connection.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/30 dark:border-white/10 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Orbs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              {currentUser.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {currentUser.displayName}
                </h2>
                {currentUser.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm">
                    Verified Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-cyan-400 border border-indigo-500/30">
                    Candidate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Details Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/20 dark:border-white/10">
          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Building className="w-3.5 h-3.5" />
              <span>College / Company</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {currentUser.collegeOrCompany || 'College Student'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Target Role</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {currentUser.targetRole || 'Fresher / Candidate'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Current Streak</span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {currentUser.currentStreak} Days Active
            </p>
          </div>
        </div>
      </div>

      {/* Security & Database Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Cloud Engine */}
        <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Database &amp; Storage Architecture
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 flex items-center justify-between">
              <span>Active Engine</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Supabase PostgreSQL Cloud
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 flex items-center justify-between">
              <span>Row Level Security (RLS)</span>
              <span className="font-bold text-slate-900 dark:text-white">
                Strict Zero-Trust Active
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 flex items-center justify-between">
              <span>AI Engine</span>
              <span className="font-bold text-indigo-600 dark:text-cyan-400">
                Gemini 3.8 Flash (Server-Side)
              </span>
            </div>
          </div>
        </div>

        {/* Zero-Storage Privacy Protocol */}
        <div className="glass-panel rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Privacy &amp; Media Protocol
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Our zero-storage security policy ensures absolute privacy for every Indian student and job seeker:
          </p>

          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>No video/audio saved:</strong> Camera &amp; mic frames are discarded immediately after in-browser analysis.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>No persistent speech transcripts:</strong> Minimum necessary text is analyzed in-memory and instantly purged.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Zero client secrets:</strong> Privileged keys are kept strictly in server environment secrets.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
