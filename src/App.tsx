import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CaseVault } from './components/CaseVault';
import { Financials } from './components/Financials';
import { SmartCalendar } from './components/SmartCalendar';
import { Settings } from './components/Settings';
import { AddCaseModal } from './components/AddCaseModal';
import { CommandPalette } from './components/CommandPalette';
import { LoginPage } from './components/LoginPage';
import { CaseDetailDrawer } from './components/CaseDetailDrawer';
import { CommunicationModal } from './components/CommunicationModal';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { useTheme } from './hooks/useTheme';
import { useAuthStore } from './store/useAuthStore';
import { useCaseStore } from './store/useCaseStore';
import type { Case } from './types';

const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [drawerCase, setDrawerCase] = useState<Case | null>(null);
  const [communicatingCase, setCommunicatingCase] = useState<Case | null>(null);
  const [analyzingCase, setAnalyzingCase] = useState<Case | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, initialized, initAuth } = useAuthStore();
  const { cases } = useCaseStore();

  // Initialize Firebase auth listener once
  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  // Global Ctrl+K / Cmd+K shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsPaletteOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle opening a case from command palette
  const handleOpenCaseFromPalette = useCallback((caseId: string) => {
    const found = cases.find(c => c.id === caseId);
    if (found) {
      setActiveTab('vault');
      setDrawerCase(found);
    }
  }, [cases]);

  // Sync drawer with latest case data after edits
  const syncedDrawerCase = drawerCase?.id
    ? cases.find(c => c.id === drawerCase.id) ?? drawerCase
    : drawerCase;

  // Show loading spinner while Firebase auth initialises
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Show login page if Firebase is configured but user isn't signed in
  if (isFirebaseConfigured && !user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans relative theme-bg theme-text">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'dashboard' && (
          <Dashboard
            onAddCase={() => setIsAddModalOpen(true)}
            onViewCalendar={() => setActiveTab('calendar')}
          />
        )}
        {activeTab === 'vault' && <CaseVault onAddCase={() => setIsAddModalOpen(true)} />}
        {activeTab === 'financials' && <Financials />}
        {activeTab === 'calendar' && <SmartCalendar />}
        {activeTab === 'settings' && <Settings theme={theme} onToggleTheme={toggleTheme} />}
      </main>

      {/* Global Modals & Overlays */}
      {isAddModalOpen && <AddCaseModal onClose={() => setIsAddModalOpen(false)} />}

      {isPaletteOpen && (
        <CommandPalette
          onNavigate={(tab) => setActiveTab(tab)}
          onClose={() => setIsPaletteOpen(false)}
          onOpenCase={handleOpenCaseFromPalette}
        />
      )}

      {syncedDrawerCase && (
        <CaseDetailDrawer
          caseData={syncedDrawerCase}
          onClose={() => setDrawerCase(null)}
          onEdit={() => { /* handled inside vault */ setDrawerCase(null); setActiveTab('vault'); }}
          onCommunicate={() => { setCommunicatingCase(syncedDrawerCase); setDrawerCase(null); }}
          onAnalyze={() => { setAnalyzingCase(syncedDrawerCase); setDrawerCase(null); }}
        />
      )}

      {communicatingCase && (
        <CommunicationModal
          caseData={communicatingCase}
          onClose={() => setCommunicatingCase(null)}
        />
      )}

      {analyzingCase && (
        <AIAnalysisModal
          caseData={analyzingCase}
          onClose={() => setAnalyzingCase(null)}
        />
      )}
    </div>
  );
}

export default App;
