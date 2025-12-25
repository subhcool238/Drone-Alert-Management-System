
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { UserPermission, Integration, ThreatType } from '../types';

const mockPermissions: UserPermission[] = [
  { role: 'Administrator', canDeploy: true, canManual: true, manualLimit: 60, canApprovePatrols: true, canChangeSLA: true, canReport: true, canSettings: true, canEmergency: true, canRequestExtensions: true, canAnalytics: true },
  { role: 'Shift Commander', canDeploy: true, canManual: true, manualLimit: 30, canApprovePatrols: true, canChangeSLA: false, canReport: true, canSettings: false, canEmergency: true, canRequestExtensions: true, canAnalytics: true },
  { role: 'Field Operator', canDeploy: true, canManual: true, manualLimit: 10, canApprovePatrols: false, canChangeSLA: false, canReport: false, canSettings: false, canEmergency: false, canRequestExtensions: true, canAnalytics: false },
  { role: 'Viewer Only', canDeploy: false, canManual: false, manualLimit: 0, canApprovePatrols: false, canChangeSLA: false, canReport: false, canSettings: false, canEmergency: false, canRequestExtensions: false, canAnalytics: true },
];

const mockIntegrations: Integration[] = [
  { id: 'INT-01', name: 'Gallagher Access', icon: 'meeting_room', status: 'CONNECTED', lastSync: '2s ago', health: 100 },
  { id: 'INT-02', name: 'Milestone VMS', icon: 'videocam', status: 'CONNECTED', lastSync: '5s ago', health: 98, feedCount: 142 },
  { id: 'INT-03', name: 'ServiceNow ITSM', icon: 'confirmation_number', status: 'DEGRADED', lastSync: '14m ago', health: 45, errors: ['API Rate Limit Warning'] },
];

const StatusToggle = ({ active, onChange }: { active: boolean; onChange?: () => void }) => (
  <button 
    onClick={onChange}
    className={`relative inline-flex h-5 w-11 items-center rounded-full transition-colors ${active ? 'bg-primary' : 'bg-white/10'}`}
  >
    <span className={`inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const RolesAndPermissions = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Security Hierarchy</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Roles, Overrides, and Operational Limits</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-black font-bold text-[10px] px-8 py-3 rounded-2xl shadow-xl shadow-primary/20 transition-all uppercase tracking-widest">
          Create Custom Role
        </button>
      </div>

      <div className="bg-panel border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/30 text-[9px] uppercase tracking-widest text-gray-500 font-bold border-b border-white/5">
              <th className="px-8 py-6">Role Profile</th>
              <th className="px-4 py-6 text-center">Deploy</th>
              <th className="px-4 py-6 text-center">Manual</th>
              <th className="px-4 py-6 text-center">Approve</th>
              <th className="px-4 py-6 text-center">Emergency</th>
              <th className="px-4 py-6 text-center">Reports</th>
              <th className="px-4 py-6 text-center">Analytics</th>
              <th className="px-8 py-6 text-right">Overrides</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mockPermissions.map(p => (
              <tr key={p.role} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-7">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-background border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">shield_person</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{p.role}</h4>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight mt-0.5">Global Protocol</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-7 text-center"><StatusToggle active={p.canDeploy} /></td>
                <td className="px-4 py-7 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <StatusToggle active={p.canManual} />
                    {p.canManual && <span className="text-[8px] font-mono text-primary font-bold">{p.manualLimit}m limit</span>}
                  </div>
                </td>
                <td className="px-4 py-7 text-center"><StatusToggle active={p.canApprovePatrols} /></td>
                <td className="px-4 py-7 text-center"><StatusToggle active={p.canEmergency} /></td>
                <td className="px-4 py-7 text-center"><StatusToggle active={p.canReport} /></td>
                <td className="px-4 py-7 text-center"><StatusToggle active={p.canAnalytics} /></td>
                <td className="px-8 py-7 text-right">
                  <button className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-all">Edit Matrix</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AlertRulesAndSLA = () => {
  const [confidence, setConfidence] = useState(85);
  
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Response Protocols & SLAs</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Threat Mapping and Escalation Timing</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <section className="col-span-8 bg-panel border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-10">
          <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em]">Severity Tiers</h3>
          <div className="grid grid-cols-4 gap-6">
            {[
              { level: 'Critical', sla: '30s', dispatch: 'Immediate', color: 'text-danger' },
              { level: 'High', sla: '2m', dispatch: 'Auto if fail', color: 'text-warning' },
              { level: 'Medium', sla: '5m', dispatch: 'Manual only', color: 'text-primary' },
              { level: 'Low', sla: '15m', dispatch: 'Log-only', color: 'text-gray-500' },
            ].map(tier => (
              <div key={tier.level} className="bg-background border border-white/5 p-6 rounded-3xl group hover:border-white/20 transition-all text-center">
                 <h4 className={`text-sm font-bold uppercase tracking-widest mb-3 ${tier.color}`}>{tier.level}</h4>
                 <div className="text-2xl font-display font-bold text-white mb-2">{tier.sla} <span className="text-[8px] text-gray-600 uppercase">SLA</span></div>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{tier.dispatch}</p>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-white/5 space-y-6">
            <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em]">Threat Type Response Mapping</h3>
            <div className="space-y-3">
              {[
                { type: ThreatType.HUMAN, sev: 'Critical', action: 'Emergency + Auto-Dispatch' },
                { type: ThreatType.ENVIRONMENTAL, sev: 'High', action: 'BMS Alert + Drone Scan' },
                { type: ThreatType.SENSOR, sev: 'Low', action: 'Log & Analyze Pattern' }
              ].map(map => (
                <div key={map.type} className="bg-background/50 border border-white/5 px-8 py-5 rounded-2xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Threat Category</span>
                    <span className="text-xs font-bold text-white">{map.type}</span>
                  </div>
                  <div className="flex gap-10 items-center">
                     <div className="text-right">
                       <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Response Level</span>
                       <span className="text-xs font-bold text-primary uppercase">{map.sev}</span>
                     </div>
                     <span className="material-symbols-outlined text-gray-700">arrow_forward</span>
                     <div className="bg-background border border-white/10 px-6 py-2 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest">{map.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="col-span-4 flex flex-col gap-10">
          <div className="bg-panel border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-10">Sensor Confidence</h3>
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Motion Trigger Confidence</span>
                  <span className="text-2xl font-display font-bold text-white">{confidence}%</span>
                </div>
                <div className="relative h-1.5 w-full bg-background rounded-full p-0.5">
                   <div className="absolute inset-0 bg-primary/20 rounded-full"></div>
                   <div className="h-full bg-primary rounded-full relative" style={{width: `${confidence}%`}}>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-4 bg-white rounded-full shadow-xl shadow-primary/40 cursor-pointer"></div>
                   </div>
                </div>
              </div>

              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-500">psychology</span>
                  <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">AI Feedback Loop</h4>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium uppercase tracking-tight">
                  Auto-adjust thresholds based on false alarm patterns. 
                  (Detected 12 HVAC vibrations in Sector B, suggesting 5% threshold raise).
                </p>
                <button className="w-full py-3 bg-emerald-500 text-black text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all hover:brightness-110">Enable Auto-Calibration</button>
              </div>
            </div>
          </div>

          <div className="bg-panel border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
            <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-8">Escalation Timing</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-bold uppercase">To Team Lead</span>
                <span className="text-white font-mono font-bold">@ 1:50</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-bold uppercase">To Director</span>
                <span className="text-white font-mono font-bold">@ 10:00</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-bold uppercase">Emergency Trigger</span>
                <span className="text-danger font-bold uppercase">Manual Only</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Integrations = () => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-display font-bold text-white tracking-tight">System Integrations</h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">External Monitoring and Ticketing Hubs</p>
      </div>
      <button className="bg-background border border-white/10 text-white font-bold text-[10px] px-8 py-3 rounded-2xl hover:bg-white/5 transition-all uppercase tracking-widest">Connect New System</button>
    </div>
    
    <div className="grid grid-cols-3 gap-8">
      {mockIntegrations.map(int => (
        <div key={int.id} className="bg-panel border border-white/5 rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-2xl group hover:border-white/10 transition-all">
          <div className="flex justify-between items-start">
            <div className="size-16 rounded-[1.5rem] bg-background border border-white/5 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-4xl">{int.icon}</span>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
              int.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-danger/10 text-danger border-danger/20'
            }`}>
              {int.status}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-display font-bold text-white mb-2">{int.name}</h3>
            <div className="flex items-center gap-2 mb-4">
               <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                 <div className={`h-full ${int.health > 80 ? 'bg-emerald-500' : 'bg-danger'} transition-all duration-1000`} style={{width: `${int.health}%`}}></div>
               </div>
               <span className="text-[10px] font-mono text-gray-500 font-bold">{int.health}%</span>
            </div>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Last Sync: {int.lastSync}</p>
          </div>
          {int.errors && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl">
              {int.errors.map((e, idx) => (
                <p key={idx} className="text-[10px] text-danger font-bold uppercase tracking-widest leading-relaxed">⚠ {e}</p>
              ))}
            </div>
          )}
          <button className="w-full py-4 rounded-2xl border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/5 transition-all mt-auto">Manage Integration</button>
        </div>
      ))}
    </div>
  </div>
);

const NotificationChannels = () => {
  const channels = [
    { name: 'Email Server', desc: 'Under Development', icon: 'mail' },
    { name: 'SMS Gateway', desc: 'Under Development', icon: 'chat' },
    { name: 'Radio Comm', desc: 'Ready for Config', icon: 'radio' },
    { name: 'Push Engine', desc: 'Operational', icon: 'notifications_active' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-display font-bold text-white tracking-tight">Notification Channels</h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Manage automated alert delivery systems</p>
      </div>

      <div className="space-y-4 max-w-4xl">
        {channels.map((ch) => (
          <div key={ch.name} className="bg-panel border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-white/10 transition-all shadow-lg">
            <div className="flex items-center gap-6">
              <div className="size-12 rounded-xl bg-background border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">{ch.icon}</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">{ch.name}</h4>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{ch.desc}</p>
              </div>
            </div>
            <button className="text-[11px] font-bold text-gray-700 hover:text-primary uppercase tracking-widest transition-colors px-4 py-2">
              Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const LanguageAndRegion = () => {
  const [isApplyToAll, setIsApplyToAll] = useState(false);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-display font-bold text-white tracking-tight">Language & Region</h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Adjust system localization and time standards</p>
      </div>

      <div className="bg-panel border border-white/5 rounded-[2rem] p-10 max-w-4xl shadow-2xl space-y-10">
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Interface Language</label>
            <div className="relative">
              <select className="w-full appearance-none bg-background border border-white/10 text-white text-sm font-medium rounded-xl pl-5 pr-12 py-3.5 outline-none focus:border-primary/50 transition-all cursor-pointer">
                <option>English (US)</option>
                <option>French (FR)</option>
                <option>Spanish (ES)</option>
                <option>German (DE)</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Region / Timezone</label>
            <div className="relative">
              <select className="w-full appearance-none bg-background border border-white/10 text-white text-sm font-medium rounded-xl pl-5 pr-12 py-3.5 outline-none focus:border-primary/50 transition-all cursor-pointer">
                <option>Paris (CET)</option>
                <option>London (GMT)</option>
                <option>New York (EST)</option>
                <option>Tokyo (JST)</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-white">Apply to all operators?</h4>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">If unchecked, applies to your profile only.</p>
          </div>
          <StatusToggle active={isApplyToAll} onChange={() => setIsApplyToAll(!isApplyToAll)} />
        </div>
      </div>
    </div>
  );
};

const AboutSection = () => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[600px] flex flex-col items-center justify-center text-center">
    <div className="size-24 rounded-3xl bg-primary flex items-center justify-center text-black font-bold text-4xl mb-10 shadow-2xl shadow-primary/30">FS</div>
    <h2 className="text-4xl font-display font-bold text-white tracking-tighter mb-4">FlytBase Security Operations</h2>
    <p className="text-lg text-gray-500 font-medium mb-12">Louvre Museum Command Center Deployment</p>
    
    <div className="grid grid-cols-2 gap-x-20 gap-y-8 max-w-xl text-left border-t border-white/5 pt-12">
       <div>
         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Software Version</span>
         <span className="text-sm font-bold text-white">v1.2.3 (Stable)</span>
       </div>
       <div>
         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">License Type</span>
         <span className="text-sm font-bold text-emerald-500 uppercase">Perpetual Enterprise</span>
       </div>
       <div>
         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Build ID</span>
         <span className="text-sm font-bold text-white">882-LOU-2025</span>
       </div>
       <div>
         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Last System Update</span>
         <span className="text-sm font-bold text-white">24 Dec 2025</span>
       </div>
    </div>
  </div>
);

const Settings: React.FC = () => {
  const location = useLocation();

  const sections = [
    { path: 'roles', label: 'Roles & Permissions', icon: 'shield_person' },
    { path: 'alerts', label: 'Alert Rules & SLAs', icon: 'notifications_active' },
    { path: 'integrations', label: 'Integrations', icon: 'hub' },
    { path: 'channels', label: 'Notif Channels', icon: 'mail' },
    { path: 'region', label: 'Lang & Region', icon: 'language' },
    { path: 'about', label: 'System Info', icon: 'info' },
  ];

  return (
    <div className="flex h-full gap-10 -m-6 bg-background">
      <aside className="w-80 border-r border-white/5 flex flex-col py-10 overflow-y-auto shrink-0 bg-background/50">
        <nav className="space-y-2 px-6">
          {sections.map(section => {
            const fullPath = `/settings/${section.path}`;
            const isActive = location.pathname === fullPath;
            return (
              <Link
                key={section.path}
                to={fullPath}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all relative group ${
                  isActive ? 'text-white bg-white/5 shadow-inner' : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
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

      <main className="flex-1 overflow-y-auto p-16 custom-scrollbar">
        <Routes>
          <Route index element={<Navigate to="roles" replace />} />
          <Route path="roles" element={<RolesAndPermissions />} />
          <Route path="alerts" element={<AlertRulesAndSLA />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="channels" element={<NotificationChannels />} />
          <Route path="region" element={<LanguageAndRegion />} />
          <Route path="about" element={<AboutSection />} />
          <Route path="*" element={
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in duration-700">
              <span className="material-symbols-outlined text-7xl text-white/5 mb-10 scale-125">construction</span>
              <h2 className="text-2xl font-display font-bold text-white mb-3 uppercase tracking-widest">Module Scaling</h2>
              <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">
                Our infrastructure team is configuring this channel. 
                Refer to Alert Rules for primary notification management.
              </p>
            </div>
          } />
        </Routes>
      </main>

      {/* GLOBAL HEALTH WIDGET */}
      <div className="fixed bottom-6 left-80 z-[60] flex items-center gap-4 bg-panel/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-2xl group transition-all hover:border-primary/30">
        <div className="flex items-center gap-2 pr-4 border-r border-white/5">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">System Online</span>
        </div>
        <div className="flex gap-4">
           {[
             { name: 'Access', status: 'bg-emerald-500' },
             { name: 'CCTV', status: 'bg-emerald-500' },
             { name: 'SENS', status: 'bg-warning' }
           ].map(h => (
             <div key={h.name} className="flex items-center gap-1.5 cursor-help" title={`${h.name} Status: Healthy`}>
               <div className={`size-1.5 rounded-full ${h.status}`}></div>
               <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">{h.name}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
