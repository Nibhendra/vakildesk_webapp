import { useState, useEffect, useMemo, useRef } from 'react';
import { useCaseStore } from '../store/useCaseStore';
import { Search, LayoutDashboard, Briefcase, Calendar, Wallet, Settings, Scale, X } from 'lucide-react';
import clsx from 'clsx';

interface CommandPaletteProps {
  onNavigate: (tab: string) => void;
  onClose: () => void;
  onOpenCase: (caseId: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Go to Dashboard' },
  { id: 'vault', label: 'Case Vault', icon: Briefcase, hint: 'Open Case Vault' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, hint: 'Open Legal Calendar' },
  { id: 'financials', label: 'Financials', icon: Wallet, hint: 'View Financials' },
  { id: 'settings', label: 'Settings', icon: Settings, hint: 'Open Settings' },
];

export function CommandPalette({ onNavigate, onClose, onOpenCase }: CommandPaletteProps) {
  const { cases } = useCaseStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const navResults = NAV_ITEMS.filter(n => !q || n.label.toLowerCase().includes(q) || n.hint.toLowerCase().includes(q))
      .map(n => ({ type: 'nav' as const, ...n }));

    const caseResults = cases
      .filter(c =>
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.caseNumber.toLowerCase().includes(q) ||
        (c.clientName ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(c => ({
        type: 'case' as const,
        id: c.id ?? '',
        label: c.title,
        hint: `${c.caseNumber} · ${c.court}`,
        icon: Scale,
        status: c.status,
      }));

    return [...navResults, ...caseResults];
  }, [query, cases]);

  // Scroll selected item into view
  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      const item = results[selected];
      if (!item) return;
      if (item.type === 'nav') { onNavigate(item.id); onClose(); }
      else { onOpenCase(item.id); onClose(); }
    }
  };

  const handleItemClick = (item: typeof results[0]) => {
    if (item.type === 'nav') { onNavigate(item.id); onClose(); }
    else { onOpenCase(item.id); onClose(); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-panel shadow-2xl shadow-blue-900/30 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/50">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search cases, navigate pages..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <X size={18} />
          </button>
          <kbd className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-96 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No results found.</p>
          ) : (
            <>
              {/* Nav section */}
              {results.some(r => r.type === 'nav') && (
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold px-4 pt-2 pb-1">Navigation</p>
              )}
              {results.filter(r => r.type === 'nav').map((item, i) => {
                const Icon = item.icon;
                const isActive = results.indexOf(item) === selected;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left cursor-pointer',
                      isActive ? 'bg-blue-500/15' : 'hover:bg-slate-700/30'
                    )}
                  >
                    <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                    <span className={clsx('text-sm font-medium', isActive ? 'text-blue-300' : 'text-slate-200')}>
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">{item.hint}</span>
                  </button>
                );
              })}

              {/* Cases section */}
              {results.some(r => r.type === 'case') && (
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold px-4 pt-3 pb-1">Cases</p>
              )}
              {results.filter(r => r.type === 'case').map((item) => {
                const Icon = item.icon;
                const globalIdx = results.indexOf(item);
                const isActive = globalIdx === selected;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left cursor-pointer',
                      isActive ? 'bg-blue-500/15' : 'hover:bg-slate-700/30'
                    )}
                  >
                    <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                    <div className="min-w-0">
                      <p className={clsx('text-sm font-medium truncate', isActive ? 'text-blue-300' : 'text-slate-200')}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{item.hint}</p>
                    </div>
                    {'status' in item && (
                      <span className={clsx(
                        'ml-auto shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
                        item.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-slate-600/20 text-slate-400'
                      )}>
                        {item.status}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700/50 flex items-center gap-4 text-xs text-slate-500">
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 rounded font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="bg-slate-800 border border-slate-700 px-1.5 rounded font-mono">↵</kbd> select</span>
          <span className="ml-auto">Ctrl+K to toggle</span>
        </div>
      </div>
    </div>
  );
}
