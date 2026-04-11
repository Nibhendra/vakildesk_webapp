import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CaseVault } from './components/CaseVault';
import { Financials } from './components/Financials';
import { Settings } from './components/Settings';
import { AddCaseModal } from './components/AddCaseModal';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex bg-slate-900 text-slate-50 h-[100dvh] w-full overflow-hidden font-sans relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'dashboard' && <Dashboard onAddCase={() => setIsAddModalOpen(true)} />}
        {activeTab === 'vault' && <CaseVault onAddCase={() => setIsAddModalOpen(true)} />}
        {activeTab === 'financials' && <Financials />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {isAddModalOpen && <AddCaseModal onClose={() => setIsAddModalOpen(false)} />}
    </div>
  );
}

export default App;
