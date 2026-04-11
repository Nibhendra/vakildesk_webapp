import { Briefcase, LayoutDashboard, Wallet, Settings } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, ariaLabel: 'Go to Dashboard' },
    { id: 'vault', label: 'Case Vault', icon: Briefcase, ariaLabel: 'Access Case Vault' },
    { id: 'financials', label: 'Financials', icon: Wallet, ariaLabel: 'View Financials' },
  ];

  return (
    <div className="w-64 h-full glass-panel border-l-0 border-y-0 rounded-none flex flex-col pt-8">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-500 bg-clip-text text-transparent">
          VakilDesk
        </h1>
        <p className="text-sm text-slate-400 mt-1">Practice Management</p>
      </div>

      <nav className="flex-1 px-4 space-y-2" role="navigation" aria-label="Main navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              title={tab.label}
              className={clsx(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50 mt-auto">
        <button
          onClick={() => setActiveTab('settings')}
          aria-label="Open Settings"
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          title="Settings"
          className={clsx(
            'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer',
            activeTab === 'settings'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}
        >
          <Settings size={20} aria-hidden="true" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
