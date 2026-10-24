import React from 'react';
import { PageView, User } from '../types';
import { 
  Sparkles, 
  LayoutDashboard, 
  Mic2, 
  LineChart, 
  History, 
  UserCircle, 
  ShieldCheck, 
  LogOut, 
  Flame,
  X,
  Lock,
  LogIn
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'home' as PageView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Overview & Goals',
    },
    {
      id: 'practice' as PageView,
      label: 'Practice Sessions',
      icon: Mic2,
      desc: 'Video & Audio Drills',
      highlight: true,
    },
    {
      id: 'analytics' as PageView,
      label: 'Performance Analytics',
      icon: LineChart,
      desc: 'WPM & Filler Trends',
    },
    {
      id: 'history' as PageView,
      label: 'Practice History',
      icon: History,
      desc: 'Streak & Records',
    },
    {
      id: 'profile' as PageView,
      label: 'Profile & Settings',
      icon: UserCircle,
      desc: 'Account & Preferences',
    },
  ];

  const handleItemClick = (page: PageView) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col p-4`}
      >
        {/* Glass Card Shell */}
        <div className="flex-1 flex flex-col justify-between glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Gradient in Glass Card */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />

          {/* Top Section */}
          <div className="space-y-6 relative z-10">
            {/* Header / Brand */}
            <div className="flex items-center justify-between pb-4 border-b border-white/20 dark:border-white/10">
              <div 
                onClick={() => handleItemClick('home')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-[14px] bg-slate-950/30 backdrop-blur-sm flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5 text-cyan-200" />
                  </div>
                </div>
                <div>
                  <h1 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                    AI Communication
                  </h1>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 tracking-wider uppercase">
                    Coach Studio
                  </span>
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Streak Quick Stat */}
            {currentUser && currentUser.currentStreak > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/25 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-orange-500" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentUser.currentStreak} Day Streak
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Keep up the daily momentum</p>
                  </div>
                </div>
                <span className="text-xs font-black text-orange-500 tabular-nums">🔥 Active</span>
              </div>
            )}

            {/* Navigation Menu */}
            <nav className="space-y-1.5" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-tight truncate">
                          {item.label}
                        </span>
                        {item.highlight && !isActive && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        )}
                      </div>
                      <p
                        className={`text-[11px] truncate ${
                          isActive
                            ? 'text-indigo-100'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Admin Portal Tab (Strictly for verified admin) */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleItemClick('admin')}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left transition-all duration-200 group mt-2 ${
                    currentPage === 'admin'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30'
                      : 'text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      currentPage === 'admin'
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold tracking-tight block">
                      Admin Dashboard
                    </span>
                    <p
                      className={`text-[11px] truncate ${
                        currentPage === 'admin'
                          ? 'text-amber-100'
                          : 'text-amber-600/70 dark:text-amber-400/70'
                      }`}
                    >
                      Candidates &amp; Activity
                    </p>
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Bottom User Area */}
          <div className="pt-4 border-t border-white/20 dark:border-white/10 relative z-10 space-y-3">
            {currentUser ? (
              <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/30 dark:border-white/5 flex items-center justify-between">
                <div 
                  onClick={() => handleItemClick('profile')}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                    {currentUser.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                      {currentUser.displayName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.targetRole || 'Fresher / Candidate'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}

            {/* Privacy Seal */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight">
              🔒 Zero-Storage: Audio/video processed only in memory
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
