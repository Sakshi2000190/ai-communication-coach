import React, { useState, useEffect } from 'react';
import { User, PracticeStat, AnalysisResult, Topic, PageView, PracticeMode } from './types';
import { INTERVIEW_TOPICS, RANDOM_TOPICS } from './data/topics';
import { getMe, logoutUser, getMyStats } from './services/api';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { AuthModal } from './components/AuthModal';
import { HomeDashboard } from './components/HomeDashboard';
import { PracticeStudio } from './components/PracticeStudio';
import { ResultsView } from './components/ResultsView';
import { StatsHistory } from './components/StatsHistory';
import { AnalyticsView } from './components/AnalyticsView';
import { ProfileView } from './components/ProfileView';
import { ResourcesView } from './components/ResourcesView';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [practiceStats, setPracticeStats] = useState<PracticeStat[]>([]);
  const [selectedPracticeMode, setSelectedPracticeMode] = useState<PracticeMode>('interview');
  const [selectedTopic, setSelectedTopic] = useState<Topic>(INTERVIEW_TOPICS[0]);
  const [selectedMode, setSelectedMode] = useState<'video' | 'audio'>('video');
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    analysis: AnalysisResult;
    stats: any;
  } | null>(null);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('comm_coach_theme') !== 'light';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('comm_coach_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('comm_coach_theme', 'light');
    }
  }, [isDark]);

  // Initial user fetch
  useEffect(() => {
    let mounted = true;
    async function initUser() {
      try {
        const user = await getMe();
        if (mounted && user) {
          setCurrentUser(user);
          loadUserStats();
        }
      } catch (err) {
        console.warn('Initial session check:', err);
      }
    }
    initUser();
    return () => {
      mounted = false;
    };
  }, []);

  const loadUserStats = async () => {
    try {
      const res = await getMyStats();
      setPracticeStats(res.stats);
      if (currentUser) {
        setCurrentUser((prev) => (prev ? { ...prev, currentStreak: res.streak } : null));
      }
    } catch (err) {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setPracticeStats([]);
    if (currentPage === 'admin' || currentPage === 'profile') {
      setCurrentPage('home');
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadUserStats();
  };

  const handleSelectPracticeMode = (nextPracticeMode: PracticeMode) => {
    setSelectedPracticeMode(nextPracticeMode);
    if (nextPracticeMode === 'random' && selectedTopic.practiceMode !== 'random') {
      setSelectedTopic(RANDOM_TOPICS[0]);
    } else if (nextPracticeMode === 'interview' && selectedTopic.practiceMode === 'random') {
      setSelectedTopic(INTERVIEW_TOPICS[0]);
    }
  };

  const handleStartPractice = (
    topic?: Topic,
    mode?: 'video' | 'audio',
    practiceModeOverride?: PracticeMode
  ) => {
    const targetPracticeMode =
      practiceModeOverride || topic?.practiceMode || selectedPracticeMode;
    setSelectedPracticeMode(targetPracticeMode);

    if (topic) {
      setSelectedTopic(topic);
    } else if (targetPracticeMode === 'random' && selectedTopic.practiceMode !== 'random') {
      setSelectedTopic(RANDOM_TOPICS[0]);
    } else if (targetPracticeMode === 'interview' && selectedTopic.practiceMode === 'random') {
      setSelectedTopic(INTERVIEW_TOPICS[0]);
    }

    if (mode) {
      setSelectedMode(mode);
    }
    setCurrentPage('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = (data: { analysis: AnalysisResult; stats: any }) => {
    setCurrentAnalysis(data);
    setCurrentPage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatsSaved = (newStreak: number) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        currentStreak: newStreak,
        totalPractices: (currentUser.totalPractices || 0) + 1,
      });
    }
    loadUserStats();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300 relative overflow-x-hidden">
      {/* Background Layered Glass Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Navy/Indigo/Violet/Cyan Ambient Orbs */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/10 dark:bg-indigo-600/15 blur-[120px] ambient-orb" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/12 blur-[100px] ambient-orb" />
        <div className="absolute top-1/3 left-10 w-[550px] h-[550px] rounded-full bg-violet-600/10 dark:bg-violet-600/12 blur-[120px] ambient-orb" />
      </div>

      {/* Responsive Glass Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        isOpenMobile={sidebarOpenMobile}
        onCloseMobile={() => setSidebarOpenMobile(false)}
      />

      {/* Main Content Area (Offset on desktop for w-72 sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 relative z-10">
        {/* Glass Top Navigation */}
        <TopNav
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          currentUser={currentUser}
          onOpenAuth={() => setAuthModalOpen(true)}
          onToggleSidebarMobile={() => setSidebarOpenMobile(!sidebarOpenMobile)}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          onStartPractice={() => handleStartPractice(selectedTopic, selectedMode, selectedPracticeMode)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto pb-16">
          {currentPage === 'home' && (
            <HomeDashboard
              currentUser={currentUser}
              practiceStats={practiceStats}
              selectedMode={selectedMode}
              onSelectMode={setSelectedMode}
              selectedPracticeMode={selectedPracticeMode}
              onSelectPracticeMode={handleSelectPracticeMode}
              onStartPractice={handleStartPractice}
              onNavigate={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {(currentPage === 'practice' || currentPage === 'mode' || currentPage === 'topic') && (
            <PracticeStudio
              initialTopic={selectedTopic}
              initialMode={selectedMode}
              initialPracticeMode={selectedPracticeMode}
              onModeChange={setSelectedMode}
              onPracticeModeChange={handleSelectPracticeMode}
              onTopicChange={setSelectedTopic}
              onAnalysisComplete={handleAnalysisComplete}
              onBack={() => setCurrentPage('home')}
            />
          )}

          {currentPage === 'results' && currentAnalysis && (
            <ResultsView
              analysis={currentAnalysis.analysis}
              stats={currentAnalysis.stats}
              currentUser={currentUser}
              onSaved={handleStatsSaved}
              onPracticeAgain={() => setCurrentPage('practice')}
              onOpenAuth={() => setAuthModalOpen(true)}
              onNavigateHistory={() => setCurrentPage('history')}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsView
              currentUser={currentUser}
              stats={practiceStats}
              onStartPractice={() => setCurrentPage('practice')}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {currentPage === 'history' && (
            <StatsHistory
              currentUser={currentUser}
              stats={practiceStats}
              onStartPractice={() => setCurrentPage('practice')}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}

          {currentPage === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onOpenAuth={() => setAuthModalOpen(true)}
              onLogout={handleLogout}
              onStartPractice={() => setCurrentPage('practice')}
            />
          )}

          {currentPage === 'resources' && <ResourcesView />}

          {currentPage === 'admin' && (
            <AdminDashboard
              currentUser={currentUser}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}
        </main>

        {/* Quiet Clean Footer */}
        <footer className="px-6 py-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-white/20 dark:border-white/5 mt-auto">
          <p>
            AI Communication Coach Studio · Tailored for Indian College Placements &amp; Corporate Interviews
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">
            🔒 Zero-Storage: Local browser MediaPipe AI audio/video processing. Audio &amp; video recordings are never saved.
          </p>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
