import { Briefcase, LayoutDashboard, Wallet, Settings, Sun, Moon, Calendar, LogOut, Search } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/useAuthStore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: string;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
}

export function Sidebar({ activeTab, setActiveTab, theme, onToggleTheme, onOpenCommandPalette }: SidebarProps) {
  const { user, signOutUser } = useAuthStore();

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
      className="w-64 h-full flex flex-col pt-6 border-r theme-surface"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="px-6 mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-500 bg-clip-text text-transparent">
          VakilDesk
        </h1>
        <p className="text-sm theme-muted mt-1">Practice Management</p>
      </div>

      {/* Command Palette trigger */}
      <div className="px-4 mb-4">
        <button
          onClick={onOpenCommandPalette}
          id="command-palette-trigger"
          aria-label="Open command palette (Ctrl+K)"
          className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all cursor-pointer text-sm"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-xs bg-slate-700 border border-slate-600 px-1.5 py-0.5 rounded font-mono opacity-70">⌃K</kbd>
        </button>
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
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer theme-muted hover:theme-text"
        >
          <div className="flex items-center space-x-3">
            {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className={clsx('w-10 h-5 rounded-full transition-colors duration-300 relative flex-shrink-0', theme === 'dark' ? 'bg-slate-600' : 'bg-blue-500')}>
            <div className={clsx('w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow', theme === 'dark' ? 'translate-x-0.5' : 'translate-x-5')} />
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
            activeTab === 'settings' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'theme-muted'
          )}
        >
          <Settings size={20} aria-hidden="true" />
          <span className="font-medium">Settings</span>
        </button>

        {/* User section */}
        {user && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 px-4 py-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName ?? 'User'} className="w-8 h-8 rounded-full border border-slate-600" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                  {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user.displayName ?? 'Advocate'}</p>
                <p className="text-xs theme-dim truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={signOutUser}
              aria-label="Sign out"
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer text-sm"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
