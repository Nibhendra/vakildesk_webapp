import { Briefcase, LayoutDashboard, Wallet, Settings, Sun, Moon, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: string;
  onToggleTheme: () => void;
}

export function Sidebar({ activeTab, setActiveTab, theme, onToggleTheme }: SidebarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, ariaLabel: 'Go to Dashboard' },
    { id: 'vault', label: 'Case Vault', icon: Briefcase, ariaLabel: 'Access Case Vault' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, ariaLabel: 'View Smart Calendar' },
    { id: 'financials', label: 'Financials', icon: Wallet, ariaLabel: 'View Financials' },
  ];

  const navBtn = (id: string, label: string, ariaLabel: string, Icon: React.ElementType) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        aria-label={ariaLabel}
        aria-current={isActive ? 'page' : undefined}
        title={label}
        className={clsx(
          'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer',
          isActive
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
            : 'theme-muted hover:theme-surface hover:theme-text'
        )}
      >
        <Icon size={20} aria-hidden="true" />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div
      className="w-64 h-full flex flex-col pt-8 border-r theme-surface"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-500 bg-clip-text text-transparent">
          VakilDesk
        </h1>
        <p className="text-sm theme-muted mt-1">Practice Management</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2" role="navigation" aria-label="Main navigation">
        {tabs.map(tab => navBtn(tab.id, tab.label, tab.ariaLabel, tab.icon))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 space-y-1 border-t" style={{ borderColor: 'var(--border)' }}>
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={clsx(
            'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer theme-muted hover:theme-text',
          )}
        >
          <div className="flex items-center space-x-3">
            {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          {/* Toggle pill */}
          <div className={clsx(
            'w-10 h-5 rounded-full transition-colors duration-300 relative flex-shrink-0',
            theme === 'dark' ? 'bg-slate-600' : 'bg-blue-500'
          )}>
            <div className={clsx(
              'w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow',
              theme === 'dark' ? 'translate-x-0.5' : 'translate-x-5'
            )} />
          </div>
        </button>

        {/* Settings */}
        <button
          onClick={() => setActiveTab('settings')}
          aria-label="Open Settings"
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          title="Settings"
          className={clsx(
            'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer',
            activeTab === 'settings'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'theme-muted'
          )}
        >
          <Settings size={20} aria-hidden="true" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
