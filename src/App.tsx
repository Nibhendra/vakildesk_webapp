import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CaseVault } from './components/CaseVault';
import { Financials } from './components/Financials';
import { SmartCalendar } from './components/SmartCalendar';
import { Settings } from './components/Settings';
import { AddCaseModal } from './components/AddCaseModal';
import { useTheme } from './hooks/useTheme';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans relative theme-bg theme-text">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'dashboard' && <Dashboard onAddCase={() => setIsAddModalOpen(true)} />}
        {activeTab === 'vault' && <CaseVault onAddCase={() => setIsAddModalOpen(true)} />}
        {activeTab === 'financials' && <Financials />}
        {activeTab === 'calendar' && <SmartCalendar />}
        {activeTab === 'settings' && <Settings theme={theme} onToggleTheme={toggleTheme} />}
      </main>

      {isAddModalOpen && <AddCaseModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}

export default App;
