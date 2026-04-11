import { useState, useEffect } from 'react';
import { Save, User, Phone, MapPin, Award, Building2, CheckCircle2 } from 'lucide-react';

interface AdvocateProfile {
  name: string;
  barNumber: string;
  phone: string;
  email: string;
  address: string;
  chamber: string;
  specialisation: string;
}

const DEFAULT_PROFILE: AdvocateProfile = {
  name: '',
  barNumber: '',
  phone: '',
  email: '',
  address: '',
  chamber: '',
  specialisation: '',
};

const STORAGE_KEY = 'vakildesk_profile';

export function Settings() {
  const [profile, setProfile] = useState<AdvocateProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setProfile(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const field = (
    id: string,
    label: string,
    key: keyof AdvocateProfile,
    placeholder: string,
    Icon: React.ElementType,
    type = 'text'
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <Icon size={15} className="text-slate-500" />
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={profile[key]}
        onChange={e => setProfile(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
          Settings
        </h2>
        <p className="text-slate-400 mt-2">Manage your advocate profile and preferences.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-5 flex items-center gap-2">
            <User size={20} className="text-blue-400" />
            Advocate Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('s-name', 'Full Name', 'name', 'Adv. Rajesh Kumar', User)}
            {field('s-bar', 'Bar Council Number', 'barNumber', 'BAR/UP/12345/2020', Award)}
            {field('s-phone', 'Mobile Number', 'phone', '+91 98765 43210', Phone, 'tel')}
            {field('s-email', 'Email Address', 'email', 'advocate@email.com', Building2, 'email')}
            {field('s-chamber', 'Chamber / Office', 'chamber', 'Chamber No. 45, High Court', Building2)}

            <div className="space-y-1.5">
              <label htmlFor="s-spec" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Award size={15} className="text-slate-500" />
                Specialisation
              </label>
              <select
                id="s-spec"
                value={profile.specialisation}
                onChange={e => setProfile(prev => ({ ...prev, specialisation: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">Select specialisation...</option>
                <option>Criminal Law</option>
                <option>Civil Law</option>
                <option>Corporate Law</option>
                <option>Family Law</option>
                <option>Constitutional Law</option>
                <option>Tax Law</option>
                <option>Labour Law</option>
                <option>Property Law</option>
                <option>General Practice</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="s-address" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <MapPin size={15} className="text-slate-500" />
                Office Address
              </label>
              <textarea
                id="s-address"
                value={profile.address}
                onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full office / chamber address..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">Profile is stored locally on this device.</p>
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

        {/* App Info */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">About VakilDesk</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex justify-between"><span>Version</span><span className="text-slate-300 font-mono">1.0.0</span></div>
            <div className="flex justify-between"><span>Mode</span><span className="text-slate-300">Local / Offline</span></div>
            <div className="flex justify-between"><span>Data Storage</span><span className="text-slate-300">In-Memory + LocalStorage</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
