import { useState, useEffect } from 'react';
import { Save, User, Phone, MapPin, Award, Building2, CheckCircle2, Sun, Moon, Bell, Database, Info } from 'lucide-react';

interface AdvocateProfile {
  name: string;
  barNumber: string;
  phone: string;
  email: string;
  address: string;
  chamber: string;
  specialisation: string;
}

interface Prefs {
  notifyUrgent: boolean;
  showClosed: boolean;
  dateFormat: string;
}

const STORAGE_KEY = 'vakildesk_profile';
const PREFS_KEY = 'vakildesk_prefs';

const DEFAULT_PROFILE: AdvocateProfile = { name: '', barNumber: '', phone: '', email: '', address: '', chamber: '', specialisation: '' };
const DEFAULT_PREFS: Prefs = { notifyUrgent: true, showClosed: false, dateFormat: 'medium' };

interface SettingsProps {
  theme: string;
  onToggleTheme: () => void;
}

export function Settings({ theme, onToggleTheme }: SettingsProps) {
  const [profile, setProfile] = useState<AdvocateProfile>(DEFAULT_PROFILE);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem(STORAGE_KEY);
    if (p) try { setProfile(JSON.parse(p)); } catch { /* ignore */ }
    const q = localStorage.getItem(PREFS_KEY);
    if (q) try { setPrefs(JSON.parse(q)); } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearData = () => {
    if (!confirm('Clear all stored profile data? This cannot be undone.')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFS_KEY);
    setProfile(DEFAULT_PROFILE);
    setPrefs(DEFAULT_PREFS);
  };

  const inputClass = 'w-full rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors theme-input border';

  const Toggle = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative w-10 h-5 rounded-full transition-colors duration-300 cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{ backgroundColor: checked ? '#3b82f6' : 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-amber-500">
          Settings
        </h2>
        <p className="theme-muted mt-2">Manage your profile, preferences, and appearance.</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── Appearance ── */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold theme-text mb-5 flex items-center gap-2">
            {theme === 'dark' ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-400" />}
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium theme-text">Theme Mode</p>
              <p className="text-sm theme-muted mt-0.5">
                Currently using <span className="font-semibold text-blue-400">{theme} mode</span>
              </p>
            </div>
            <button
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer font-medium text-sm border theme-surface-2 theme-muted hover:text-blue-400 hover:border-blue-500/50"
              style={{ borderColor: 'var(--border)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>

        {/* ── App Preferences ── */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold theme-text mb-5 flex items-center gap-2">
            <Bell size={20} className="text-blue-400" />
            App Preferences
          </h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="pref-urgent" className="font-medium theme-text cursor-pointer">Highlight Urgent Cases</label>
                <p className="text-sm theme-muted mt-0.5">Show red border on cases with hearing in 48 hours</p>
              </div>
              <Toggle id="pref-urgent" checked={prefs.notifyUrgent} onChange={() => setPrefs(p => ({ ...p, notifyUrgent: !p.notifyUrgent }))} />
            </div>
            <div className="border-t" style={{ borderColor: 'var(--border)' }} />
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="pref-closed" className="font-medium theme-text cursor-pointer">Show Closed Cases on Dashboard</label>
                <p className="text-sm theme-muted mt-0.5">Include closed cases in the dashboard view</p>
              </div>
              <Toggle id="pref-closed" checked={prefs.showClosed} onChange={() => setPrefs(p => ({ ...p, showClosed: !p.showClosed }))} />
            </div>
            <div className="border-t" style={{ borderColor: 'var(--border)' }} />
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="pref-date" className="font-medium theme-text">Date Display Format</label>
                <p className="text-sm theme-muted mt-0.5">How hearing dates are shown across the app</p>
              </div>
              <select
                id="pref-date"
                value={prefs.dateFormat}
                onChange={e => setPrefs(p => ({ ...p, dateFormat: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm cursor-pointer focus:outline-none focus:border-blue-500 theme-input border"
                style={{ borderColor: 'var(--border)' }}
              >
                <option value="short">Short (Apr 11)</option>
                <option value="medium">Medium (11 Apr 2026)</option>
                <option value="long">Long (11 April, 2026)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Advocate Profile ── */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold theme-text mb-5 flex items-center gap-2">
            <User size={20} className="text-blue-400" />
            Advocate Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                ['s-name', 'Full Name', 'name', 'Adv. Rajesh Kumar', User],
                ['s-bar', 'Bar Council Number', 'barNumber', 'BAR/UP/12345/2020', Award],
                ['s-phone', 'Mobile Number', 'phone', '+91 98765 43210', Phone],
                ['s-email', 'Email Address', 'email', 'advocate@email.com', Building2],
                ['s-chamber', 'Chamber / Office', 'chamber', 'Chamber No. 45, High Court', Building2],
              ] as [string, string, keyof AdvocateProfile, string, React.ElementType][]
            ).map(([id, label, key, placeholder, Icon]) => (
              <div key={id} className="space-y-1.5">
                <label htmlFor={id} className="text-sm font-medium theme-muted flex items-center gap-2">
                  <Icon size={14} className="opacity-60" />
                  {label}
                </label>
                <input
                  id={id}
                  type="text"
                  value={profile[key]}
                  onChange={e => setProfile(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inputClass}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label htmlFor="s-spec" className="text-sm font-medium theme-muted flex items-center gap-2">
                <Award size={14} className="opacity-60" />
                Specialisation
              </label>
              <select
                id="s-spec"
                value={profile.specialisation}
                onChange={e => setProfile(prev => ({ ...prev, specialisation: e.target.value }))}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Select specialisation...</option>
                {['Criminal Law','Civil Law','Corporate Law','Family Law','Constitutional Law','Tax Law','Labour Law','Property Law','General Practice'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="s-address" className="text-sm font-medium theme-muted flex items-center gap-2">
                <MapPin size={14} className="opacity-60" /> Office Address
              </label>
              <textarea
                id="s-address"
                value={profile.address}
                onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full office / chamber address..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs theme-dim">Profile is stored locally on this device.</p>
            <button
              onClick={handleSave}
              aria-label="Save profile"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all font-medium cursor-pointer"
            >
              {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
              <span>{saved ? 'Saved!' : 'Save Profile'}</span>
            </button>
          </div>
        </div>

        {/* ── Data Management ── */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold theme-text mb-4 flex items-center gap-2">
            <Database size={20} className="text-blue-400" />
            Data Management
          </h3>
          <p className="text-sm theme-muted mb-4">
            All case data is stored in-memory for this session. Profile and preferences are saved in your browser's local storage.
          </p>
          <button
            onClick={handleClearData}
            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm cursor-pointer font-medium"
          >
            Clear Saved Profile Data
          </button>
        </div>

        {/* ── About ── */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold theme-text mb-4 flex items-center gap-2">
            <Info size={20} className="text-blue-400" />
            About VakilDesk
          </h3>
          <div className="space-y-2 text-sm">
            {([
              ['Version', '1.0.0'],
              ['Mode', 'Local / Offline'],
              ['Data Storage', 'In-Memory + LocalStorage'],
              ['Theme', `${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode`],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="theme-muted">{label}</span>
                <span className="theme-text font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
