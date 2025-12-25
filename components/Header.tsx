
import React, { useState } from 'react';
import { getSmartSuggestion } from '../geminiService';

const Header: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShiftBriefing, setShowShiftBriefing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiStatus = async () => {
    setIsAiLoading(true);
    const suggestion = await getSmartSuggestion("Full museum status query: 2 active alerts, 1 coverage gap, fleet battery avg 84%.");
    setAiResponse(suggestion);
    setIsAiLoading(false);
  };

  const notifications = [
    { id: 1, type: 'SLA Breach', msg: 'INC-2025-082 exceeded response SLA', time: '2m ago', color: 'text-danger', icon: 'timer_off' },
    { id: 2, type: 'Escalation', msg: 'Team Lead approval required: Perimeter Alpha', time: '12m ago', color: 'text-warning', icon: 'priority_high' },
    { id: 3, type: 'Maintenance', msg: 'Sentinel-4 due for lens calibration', time: '1h ago', color: 'text-primary', icon: 'settings_backup_restore' },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0 z-[60] bg-background">
      {/* Shift Briefing Modal */}
      {showShiftBriefing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-panel border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-white/5 flex justify-between items-start">
               <div>
                  <h2 className="text-3xl font-display font-bold text-white tracking-tight">Shift Handover Briefing</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">Operator: Isabelle M. • 14:00 - 22:00</p>
               </div>
               <button onClick={() => setShowShiftBriefing(false)} className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">close</button>
            </div>
            <div className="p-10 grid grid-cols-2 gap-10 bg-background/20">
              <div className="space-y-8">
                <section>
                  <h4 className="text-[10px] font-bold text-danger uppercase tracking-widest mb-4">Critical Incidents (2)</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/20">
                      <p className="text-xs text-white font-bold">Motion: Storage Area B</p>
                      <p className="text-[10px] text-danger/70 font-bold uppercase mt-1">SLA Breach: -2m 14s</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-white font-bold">Sensor: Perimeter North</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Status: Investigating</p>
                    </div>
                  </div>
                </section>
                <section>
                   <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Fleet & Maintenance</h4>
                   <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <span className="material-symbols-outlined text-primary">engineering</span>
                      <p className="text-xs text-gray-400 leading-tight">Sentinel-4 lens recalibration in progress. Return to service: 18:00.</p>
                   </div>
                </section>
              </div>
              <div className="space-y-8">
                <section>
                  <h4 className="text-[10px] font-bold text-warning uppercase tracking-widest mb-4">Coverage Intelligence</h4>
                  <div className="p-5 rounded-2xl bg-warning/5 border border-warning/20">
                    <div className="text-4xl font-display font-bold text-warning mb-1">1 Zone</div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Unpatrolled for >45 min</p>
                    <button className="mt-4 text-[9px] text-warning font-bold bg-warning/10 px-4 py-2 rounded-lg border border-warning/20 hover:bg-warning/20 transition-all">Assign Sentinel-2</button>
                  </div>
                </section>
                <section>
                   <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Outstanding Tasks</h4>
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-xs text-gray-400"><span className="size-1.5 rounded-full bg-indigo-500"></span> 2 Police Reports Pending</div>
                     <div className="flex items-center gap-2 text-xs text-gray-400"><span className="size-1.5 rounded-full bg-gray-600"></span> Night Mode Audit Due</div>
                   </div>
                </section>
              </div>
            </div>
            <div className="p-10 flex justify-end gap-4 bg-background/50 border-t border-white/5">
              <button onClick={() => setShowShiftBriefing(false)} className="px-8 py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400">Back to Ops</button>
              <button onClick={() => setShowShiftBriefing(false)} className="px-10 py-3 rounded-xl bg-primary text-black text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20">Acknowledge & Sign</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <span className="material-symbols-outlined text-primary text-2xl group-hover:rotate-180 transition-transform duration-500">hexagon</span>
          <div className="flex flex-col">
            <span className="text-white text-base font-bold tracking-tight font-display">Louvre Museum CC</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-none mt-1">Command Center v1.2.3</span>
          </div>
          <span className="ml-2 text-[8px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 tracking-widest uppercase">AI-Assisted</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-12 relative">
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">search</span>
          <input 
            value={searchQuery}
            // DO: Fixed typo - changed setSearchTerm to setSearchQuery to match declared state
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-panel border border-white/10 rounded-2xl py-2.5 pl-12 pr-12 text-white text-sm focus:border-primary/50 focus:ring-0 placeholder-gray-600 transition-all outline-none" 
            placeholder="Search Drones, Incidents, Guards, Patrols..."
          />
          <button onClick={handleAiStatus} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors">
            <span className={`material-symbols-outlined text-[20px] ${isAiLoading ? 'animate-spin' : ''}`}>psychology</span>
          </button>
        </div>
        
        {aiResponse && (
          <div className="absolute top-full mt-3 left-0 right-0 bg-indigo-600 border border-indigo-500/30 p-4 rounded-2xl shadow-2xl z-[70] animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-white text-lg mt-0.5">auto_awesome</span>
              <div className="flex-1">
                <p className="text-[11px] text-white/90 font-bold leading-relaxed">{aiResponse}</p>
              </div>
              <button onClick={() => setAiResponse(null)} className="text-white/40 hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`size-10 rounded-2xl border flex items-center justify-center transition-all relative ${
              showNotifications ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-panel border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-danger ring-4 ring-background"></span>
          </button>

          {showNotifications && (
            <div className="absolute top-full mt-4 right-0 w-[320px] bg-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[70] animate-in fade-in slide-in-from-top-2">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-background/50">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Active Notifications</h4>
                <button className="text-[9px] text-primary font-bold uppercase hover:underline">Clear All</button>
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.map(n => (
                  <div key={n.id} className="p-5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className={`size-8 rounded-xl bg-background border border-white/5 flex items-center justify-center shrink-0 ${n.color}`}>
                        <span className="material-symbols-outlined text-lg">{n.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${n.color}`}>{n.type}</span>
                          <span className="text-[8px] text-gray-600 font-bold">{n.time}</span>
                        </div>
                        <p className="text-xs text-gray-300 font-medium leading-relaxed group-hover:text-white">{n.msg}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 text-center bg-background/50">
                <button className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">View All Activities</button>
              </div>
            </div>
          )}
        </div>
        
        <div 
          onClick={() => setShowShiftBriefing(true)}
          className="flex items-center gap-3 bg-panel border border-white/5 rounded-2xl px-4 py-2 hover:bg-white/5 transition-all cursor-pointer group"
        >
          <div className="size-8 rounded-full bg-cover bg-center ring-2 ring-gray-700 group-hover:ring-primary transition-all" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuBf32ztAlYOtIpntZ8GA11lvp6qLHk4YFeTDSw2GGGzZ_T3fufgI3tj2NFGL64ooFOiqLN5SEnfaHSUCtC4kV99HEw65A0pYFLJfs39KkY_rBVYAMJwFTkKW7BBuzYWb9rulMpCXtkH2QplNzBBbxZ4HsGyB_I-SHQaLYYXHCMdpHrtxwoofh7EE1N5yhhREZ5ee4gdB7ALoDFblzUT6IaQE9VZNMLyL2k0UKWarhn6k-r6CzMy_C1PMSa444Q0y7--XdgSTo0UMwg)' }}></div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white group-hover:text-primary transition-colors leading-none">Isabelle M.</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Shift Commander</span>
          </div>
          <span className="material-symbols-outlined text-gray-600 text-[18px] ml-2 group-hover:text-white">expand_more</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
