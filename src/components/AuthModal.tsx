import React, { useState } from 'react';
import { User } from '../types';
import { registerUser, loginUser } from '../services/api';
import { X, Lock, Mail, User as UserIcon, GraduationCap, Briefcase, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [collegeOrCompany, setCollegeOrCompany] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer / IT Fresher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await registerUser({
          email,
          password,
          displayName,
          collegeOrCompany,
          targetRole,
        });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await loginUser({ email, password });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginUser({ email: demoEmail, password: demoPass });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel-elevated rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden">
        {/* Subtle decorative glowing corner */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header bar */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/15 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {mode === 'login' ? 'Welcome Back!' : 'Create Student Account'}
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                AI Communication Coach for Placements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1.5 mx-6 mt-4 rounded-2xl glass-panel-subtle border border-white/20 dark:border-white/10">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Register Fresher
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
          {error && (
            <div className="p-3.5 text-xs rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 space-y-2">
              <div className="font-bold leading-relaxed">{error}</div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-500 transition-colors"
                  >
                    Switch to Register Fresher →
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-white/30 dark:border-white/10 font-bold text-[11px] hover:opacity-90 transition-opacity"
                >
                  Continue Practice as Guest
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Preferred Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-white/25 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    College / University
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={collegeOrCompany}
                      onChange={(e) => setCollegeOrCompany(e.target.value)}
                      placeholder="e.g. DTU / VIT / AKTU"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-white/25 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Role
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. SDE Fresher"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-white/25 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-md"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@college.edu"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-white/25 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-white/25 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-md"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Dashboard' : 'Create Free Student Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Logins */}
          <div className="pt-3 border-t border-white/15 dark:border-white/10">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Evaluation Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('sakshimarya193@gmail.com', 'admin123')}
                disabled={loading}
                className="p-2.5 text-xs font-semibold rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-left transition-colors backdrop-blur-sm"
              >
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>🛡️</span> Admin Account
                </div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 truncate mt-0.5">sakshimarya193</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('arjun.sharma@college.edu', 'student123')}
                disabled={loading}
                className="p-2.5 text-xs font-semibold rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-left transition-colors backdrop-blur-sm"
              >
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>🎓</span> Fresher Account
                </div>
                <div className="text-[10px] text-indigo-700 dark:text-indigo-400 truncate mt-0.5">arjun.sharma</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Storage Guarantee: Voice/video never stored</span>
          </div>
        </form>
      </div>
    </div>
  );
};
