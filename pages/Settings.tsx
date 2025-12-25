
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

const sections = [
  { path: 'roles', label: 'Roles & Permissions', icon: 'admin_panel_settings' },
  { path: 'alerts', label: 'Alert Rules & SLAs', icon: 'notifications_active' },
  { path: 'integrations', label: 'Integrations', icon: 'hub' },
  { path: 'templates', label: 'Patrol Templates', icon: 'map' },
  { path: 'channels', label: 'Notification Channels', icon: 'mail' },
  { path: 'appearance', label: 'Appearance', icon: 'palette' },
  { path: 'region', label: 'Language & Region', icon: 'language' },
  { path: 'about', label: 'About', icon: 'info' },
];

const StatusIcon = ({ active, badge }: { active: boolean; badge?: string }) => {
  if (badge) {
    return (
      <span className="text-[10px] font-mono text-warning bg-warning/10 px-2 py-1 rounded border border-warning/20 font-bold">
        {badge}
      </span>
    );
  }
  return (
    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${active ? 'bg-success/20' : 'bg-gray-800'}`}>
      <span className={`material-symbols-outlined text-sm ${active ? 'text-success' : 'text-gray-600'}`}>
        {active ? 'check' : 'close'}
      </span>
    </div>
  );
};

const RolesAndPermissions = () => (
  <div className="animate-in fade-in duration-500">
    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
      <h2 className="text-xl font-bold text-white tracking-tight">Roles & Permissions</h2>
      <button className="bg-primary hover:bg-primary/90 text-black font-bold text-[10px] px-4 py-2 rounded shadow-lg shadow-primary/20 transition-all uppercase tracking-widest">
        Add New Role
      </button>
    </div>
    <div className="bg-panel border border-white/5 rounded-lg overflow-hidden shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-background/30 text-[9px] uppercase tracking-widest text-text-muted font-bold border-b border-white/5">
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4 text-center">Deploy Drones</th>
            <th className="px-6 py-4 text-center">Manual Control</th>
            <th className="px-6 py-4 text-center">Approve Patrols</th>
            <th className="px-6 py-4 text-center">Config System</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          <tr className="hover:bg-white/5 transition-colors group">
            <td className="px-6 py-6 font-bold text-white">Administrator</td>
            <td className="px-6 py-6 text-center"><StatusIcon active={true} /></td>
            <td className="px-6 py-6 text-center"><StatusIcon active={true} /></td>
            <td className="px-6 py-6 text-center"><StatusIcon active={true} /></td>
            <td className="px-6 py-6 text-center"><StatusIcon active={true} /></td>
            <td className="px-6 py-6 text-right">
              <button className="text-primary hover:text-white transition-colors font-bold text-xs">Edit</button>
            </td>
          </tr>
          <tr className="hover:bg-white/5 transition-colors group">
            <td className="px-6 py-6 font-bold text-white">Field Operator</td>
            <td className="px-6 py-6 text-center"><StatusIcon active={true} /></td>
            <td className="px-6 py-6 text-center"><StatusIcon active={false} badge="10m Limit" /></td>
            <td className="px-6 py-6 text-center"><StatusIcon active={false} /></td>
            <td className="px-6 py-6 text-center"><StatusIcon active={false} /></td>
            <td className="px-6 py-6 text-right">
              <button className="text-primary hover:text-white transition-colors font-bold text-xs">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="mt-8 flex items-start gap-3 p-4 rounded bg-primary/5 border border-primary/20">
      <span className="material-symbols-outlined text-primary text-[18px]">info</span>
      <p className="text-[11px] text-primary/80 font-medium leading-relaxed uppercase tracking-tight">
        Role changes affect users immediately. Ensure you communicate permission updates to your team to avoid operational disruptions.
      </p>
    </div>
  </div>
);

const AlertRules = () => {
  const [threshold, setThreshold] = useState(85);

  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-white tracking-tight">Alert Rules & SLAs</h1>
      
      <section className="bg-[#0E151B] border border-white/5 rounded-xl p-6 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6">Severity Response Protocols</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B1116] border border-red-900/50 rounded-xl p-5 text-center group hover:border-danger/50 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-danger/5"></div>
            <h3 className="text-danger font-bold text-sm mb-2 uppercase tracking-widest">Critical</h3>
            <div className="text-gray-400 text-xs mb-1 font-mono">SLA: 30s</div>
            <div className="text-gray-500 text-[9px] font-bold uppercase tracking-tight">Auto-dispatch: Immediate</div>
          </div>
          
          <div className="bg-[#0B1116] border border-yellow-900/50 rounded-xl p-5 text-center group hover:border-warning/50 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-warning/5"></div>
            <h3 className="text-warning font-bold text-sm mb-2 uppercase tracking-widest">High</h3>
            <div className="text-gray-400 text-xs mb-1 font-mono">SLA: 2m</div>
            <div className="text-gray-500 text-[9px] font-bold uppercase tracking-tight">Escalate: 1m 50s</div>
          </div>
          
          <div className="bg-[#0B1116] border border-white/5 rounded-xl p-5 text-center group hover:border-white/20 transition-all cursor-pointer">
            <h3 className="text-gray-300 font-bold text-sm mb-2 uppercase tracking-widest">Medium</h3>
            <div className="text-gray-400 text-xs mb-1 font-mono">SLA: 5m</div>
            <div className="text-gray-500 text-[9px] font-bold uppercase tracking-tight">Manual Review</div>
          </div>
          
          <div className="bg-[#0B1116] border border-white/5 rounded-xl p-5 text-center group hover:border-white/20 transition-all cursor-pointer">
            <h3 className="text-gray-500 font-bold text-sm mb-2 uppercase tracking-widest">Low</h3>
            <div className="text-gray-400 text-xs mb-1 font-mono">SLA: 15m</div>
            <div className="text-gray-500 text-[9px] font-bold uppercase tracking-tight">Log Only</div>
          </div>
        </div>
      </section>

      <section className="bg-[#0E151B] border border-white/5 rounded-xl p-6 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6">Threat Type Mapping</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0B1116] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <span className="text-sm font-bold text-gray-200 uppercase tracking-wide">Human Intruder</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Maps to:</span>
              <div className="relative">
                <select className="appearance-none bg-transparent border border-danger text-danger text-xs font-bold rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-danger cursor-pointer uppercase tracking-widest">
                  <option>Critical</option>
                  <option>High</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-danger text-lg pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0B1116] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <span className="text-sm font-bold text-gray-200 uppercase tracking-wide">Environmental (Fire/Water)</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Maps to:</span>
              <div className="relative">
                <select className="appearance-none bg-transparent border border-warning text-warning text-xs font-bold rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-warning cursor-pointer uppercase tracking-widest">
                  <option>High</option>
                  <option>Critical</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-warning text-lg pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0E151B] border border-white/5 rounded-xl p-6 shadow-sm">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6">Sensor Thresholds</h2>
        <div className="mb-10 px-2">
          <div className="flex justify-between items-center mb-6">
            <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">Motion Confidence Threshold</label>
            <span className="text-sm font-bold text-primary font-mono">{threshold}%</span>
          </div>
          <div className="relative w-full h-1 flex items-center">
            <div className="absolute w-full h-1 bg-gray-800 rounded-full"></div>
            <div className="absolute h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]" style={{ width: `${threshold}%` }}></div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={threshold} 
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="absolute w-full h-1 bg-transparent z-20 cursor-pointer appearance-none focus:outline-none 
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-4 
                        [&::-webkit-slider-thumb]:h-4 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-primary 
                        [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(6,182,212,0.2)]"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 group cursor-pointer">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              id="feedback-loop" 
              className="size-4 bg-transparent border-gray-600 rounded text-primary focus:ring-primary focus:ring-offset-background cursor-pointer" 
              defaultChecked 
            />
          </div>
          <label htmlFor="feedback-loop" className="text-sm text-gray-400 font-medium select-none cursor-pointer group-hover:text-gray-200 transition-colors">
            Enable False Alarm Feedback Loop (Auto-adjust thresholds)
          </label>
        </div>
      </section>
    </div>
  );
};

const Integrations = () => (
  <div className="animate-in fade-in duration-500">
    <div className="mb-8 pb-4 border-b border-white/5">
      <h2 className="text-xl font-bold text-white tracking-tight">System Integrations</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[
        { title: 'Access Control', icon: 'meeting_room', status: 'CONNECTED', detail: 'Last sync: 2s ago • 0 Errors' },
        { title: 'CCTV Platform', icon: 'videocam', status: 'CONNECTED', detail: '142/145 Feeds Active' },
      ].map((int, i) => (
        <div key={i} className="bg-panel border border-white/5 rounded-2xl p-6 flex flex-col shadow-2xl group hover:border-white/10 transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-background border border-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">{int.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-white tracking-tight">{int.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{int.status}</span>
                </div>
              </div>
            </div>
            <button className="text-gray-600 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">settings</span>
            </button>
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-8">{int.detail}</p>
          <button className="w-full py-3 px-4 rounded-xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-all">
            Manage
          </button>
        </div>
      ))}
    </div>
  </div>
);

const NotificationChannels = () => (
  <div className="animate-in fade-in duration-500">
    <div className="mb-8 pb-4 border-b border-white/5">
      <h2 className="text-xl font-bold text-white tracking-tight">Notification Channels</h2>
    </div>
    <div className="space-y-4 max-w-4xl">
      {[
        { title: 'Email Server', icon: 'email', sub: 'Under Development' },
        { title: 'SMS Gateway', icon: 'sms', sub: 'Under Development' },
      ].map((channel, i) => (
        <div key={i} className="bg-panel border border-white/5 rounded-2xl p-6 flex items-center justify-between shadow-2xl group hover:border-white/10 transition-all">
          <div className="flex items-center gap-5">
            <div className="size-12 rounded-xl bg-background border border-white/5 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">{channel.icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-white tracking-tight">{channel.title}</h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{channel.sub}</p>
            </div>
          </div>
          <button className="text-gray-700 text-[10px] font-bold uppercase tracking-widest px-4 py-2 cursor-not-allowed">
            Configure
          </button>
        </div>
      ))}
    </div>
  </div>
);

const LanguageAndRegion = () => (
  <div className="animate-in fade-in duration-500">
    <div className="mb-8 pb-4 border-b border-white/5">
      <h2 className="text-xl font-bold text-white tracking-tight">Language & Region</h2>
    </div>
    <div className="bg-panel border border-white/5 rounded-2xl p-8 max-w-4xl shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-2">
          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">Interface Language</label>
          <div className="relative">
            <select className="block w-full pl-4 pr-10 py-3 text-xs bg-background border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-all font-bold tracking-wide uppercase outline-none">
              <option>English (US)</option>
              <option>French (FR)</option>
              <option>Spanish (ES)</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-xl">expand_more</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-widest">Region / Timezone</label>
          <div className="relative">
            <select className="block w-full pl-4 pr-10 py-3 text-xs bg-background border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-all font-bold tracking-wide uppercase outline-none">
              <option>Paris (CET)</option>
              <option>London (GMT)</option>
              <option>New York (EST)</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-xl">expand_more</span>
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-white/5 mb-8"></div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Apply to all operators?</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight mt-1">If unchecked, applies to your profile only.</p>
        </div>
        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
          <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition shadow-lg" />
        </button>
      </div>
    </div>
  </div>
);

const Settings: React.FC = () => {
  const location = useLocation();

  const ConstructionSection = () => (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in duration-700">
      <span className="material-symbols-outlined text-6xl text-white/10 mb-6 scale-125">construction</span>
      <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Section Under Construction</h2>
      <p className="text-[10px] text-text-muted leading-relaxed font-bold uppercase tracking-tight">
        Our tactical team is currently deploying this module. Select 'Alert Rules & SLAs' or 'Roles' for live configurations.
      </p>
    </div>
  );

  return (
    <div className="flex h-full gap-8 -m-6 bg-background">
      {/* Settings Navigation Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col py-8 overflow-y-auto shrink-0 bg-background/50">
        <nav className="space-y-1 px-4">
          {sections.map(section => {
            const fullPath = `/settings/${section.path}`;
            const isActive = location.pathname === fullPath;
            return (
              <Link
                key={section.path}
                to={fullPath}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all relative group ${
                  isActive 
                    ? 'text-white bg-white/5 shadow-inner' 
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                )}
                <span className={`material-symbols-outlined text-[20px] transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}>
                  {section.icon}
                </span>
                {section.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <Routes>
          <Route index element={<Navigate to="roles" replace />} />
          <Route path="roles" element={<RolesAndPermissions />} />
          <Route path="alerts" element={<AlertRules />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="channels" element={<NotificationChannels />} />
          <Route path="region" element={<LanguageAndRegion />} />
          <Route path="*" element={<ConstructionSection />} />
        </Routes>
      </main>
    </div>
  );
};

export default Settings;
