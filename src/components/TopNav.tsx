import React, { useState } from 'react';
import { PageView, User } from '../types';
import { 
  Menu, 
  Moon, 
  Sun, 
  Bell, 
  Flame, 
  Mic2, 
  UserCircle2, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface TopNavProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onToggleSidebarMobile: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onStartPractice: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onOpenAuth,
  onToggleSidebarMobile,
  isDark,
  onToggleTheme,
  onStartPractice,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic greeting based on time of day in India
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const notifications = [
    {
      id: 1,
      title: 'TCS & Infosys Campus Drives',
      desc: 'Practice "Tell me about yourself" & "Project challenges" drills.',
      tag: 'New Drill',
      time: 'Today',
    },
    {
      id: 2,
      title: 'Daily Speaking Streak',
      desc: currentUser?.currentStreak 
        ? `You have a ${currentUser.currentStreak}-day active streak! Keep it alive.`
        : 'Complete a 60-second speech drill today to ignite your streak.',
      tag: 'Streak Alert',
      time: 'Recommended',
    },
    {
      id: 3,
      title: 'Hinglish Filler Elimination',
      desc: 'Track and convert "basically", "matlab", and "you know" into structured corporate English.',
      tag: 'Coach Tip',
      time: 'Pro Tip',
    },
  ];

  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      {/* Glass Top Bar */}
      <div className="glass-panel rounded-2xl px-4 py-3 border border-white/20 dark:border-white/10 shadow-lg flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Welcome Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-cyan-400">
                {getGreeting()}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">·</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                {currentUser ? (currentUser.targetRole || 'Fresher Placement Candidate') : 'Indian Campus Placements'}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
              {currentUser ? currentUser.displayName : 'Job Seeker & Student Portal'}
            </h2>
          </div>
        </div>

        {/* Right: Quick Streak, Practice CTA, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Streak Pill */}
          {currentUser && currentUser.currentStreak > 0 && (
            <div 
              onClick={() => onNavigate('history')}
              title={`${currentUser.currentStreak} day streak`}
              className="cursor-pointer hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-600 dark:text-orange-400 text-xs font-bold hover:scale-105 transition-transform"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
              <span className="tabular-nums">{currentUser.currentStreak}d Streak</span>
            </div>
          )}

          {/* Quick Start Practice Button */}
          <button
            onClick={onStartPractice}
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Practice Drill</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Notifications Flyout */}
            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 glass-panel-elevated rounded-2xl p-4 border border-white/20 dark:border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/20 dark:border-white/10 mb-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Placement Alerts &amp; Tips</span>
                  </span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        onNavigate('practice');
                      }}
                      className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/30 dark:border-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
                          {n.tag}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {n.time}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {n.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Profile Avatar / Auth CTA */}
          {currentUser ? (
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-white/40 dark:bg-slate-800/60 border border-white/40 dark:border-white/10 hover:border-indigo-400/60 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-black text-xs flex items-center justify-center shadow-sm">
                {currentUser.displayName.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[90px] truncate">
                {currentUser.displayName.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <UserCircle2 className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
