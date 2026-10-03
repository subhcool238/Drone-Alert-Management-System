
import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';
import { useLocation } from 'react-router-dom';
import { FleetStatus } from '../types';
import { DRONES } from '../data/drones';
import { INCIDENTS, getOpenIncidents, getSlaState, useSecondsSinceLoad } from '../data/incidents';
import { formatAgo } from '../data/clock';
import { COVERAGE_GAP, getCoverageGapCount, getPatrolRecommendation } from '../data/patrols';
import { buildSystemSummary } from '../data/summary';

const Header: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  // Close the notifications panel when the page changes
  useEffect(() => {
    setShowNotifications(false);
  }, [pathname]);

  // While open: close on a click outside it, or on Escape (focus returns to the bell)
  useEffect(() => {
    if (!showNotifications) return;
    const onMouseDown = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        bellRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showNotifications]);
  const [showShiftBriefing, setShowShiftBriefing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<string | null>(null);

  const secondsSinceLoad = useSecondsSinceLoad();
  const gapCount = getCoverageGapCount();
  const recommendation = getPatrolRecommendation();
  const openIncidents = getOpenIncidents();
  const criticalIncidents = openIncidents.filter(i => i.severity === 'CRITICAL');
  const outOfServiceDrones = DRONES.filter(d => d.status === FleetStatus.FAULT);

  // Rule-based summary from the shared drone, incident and patrol data
  const handleSummary = () => {
    setSummary(buildSystemSummary(secondsSinceLoad));
  };

  // Notification 1 age is live: how long ago INC-2025-083 was detected, counting up
  const awaiting = INCIDENTS.find(i => i.id === 'INC-2025-083');
  const awaitingAge =
    awaiting?.detectedSecondsBeforeLoad !== undefined
      ? formatAgo(awaiting.detectedSecondsBeforeLoad + secondsSinceLoad)
      : 'now';

  const notifications = [
    { id: 1, type: 'Awaiting Response', msg: 'INC-2025-083 awaiting response (High, potential false alarm)', time: awaitingAge, color: 'text-danger-light', icon: 'timer_off' },
    { id: 2, type: 'Escalation', msg: 'Team Lead approval required: North Storage Wing', time: '1m ago', color: 'text-warning', icon: 'priority_high' },
    { id: 3, type: 'Maintenance', msg: 'Watcher-3 lens calibration requested', time: '2m ago', color: 'text-primary', icon: 'settings_backup_restore' },
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
                  <p className="text-xs text-text-muted font-bold uppercase tracking-[0.12em] mt-2">Operator: Isabelle M. <span aria-hidden="true">•</span> 22:00 - 06:00</p>
               </div>
               <Button variant="icon" aria-label="Close" onClick={() => setShowShiftBriefing(false)} className="text-text-muted hover:text-white"><span className="material-symbols-outlined" aria-hidden="true">close</span></Button>
            </div>
            <div className="p-10 grid grid-cols-2 gap-10 bg-background/20">
              <div className="space-y-8">
                <section>
                  <h4 className="text-xs font-bold text-danger-light uppercase tracking-wider mb-4">Critical Incidents ({criticalIncidents.length})</h4>
                  <div className="space-y-3">
                    {criticalIncidents.map(inc => (
                      <div key={inc.id} className="p-3 rounded-xl bg-danger/10 border border-danger/20">
                        <p className="text-xs text-white font-bold">{inc.title}: {inc.location}</p>
                        <p className="text-xs text-danger-light font-bold uppercase mt-1">{(() => {
                          const sla = getSlaState(inc, secondsSinceLoad);
                          if (sla.kind === 'responded') return `Responded in ${sla.text}`;
                          if (sla.kind === 'breached') return 'SLA breached';
                          return `SLA: ${sla.kind === 'ticking' ? sla.text : '-'}`;
                        })()}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                   <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Fleet & Maintenance</h4>
                   <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary">engineering</span>
                      <p className="text-xs text-gray-400 leading-tight">
                        {outOfServiceDrones.length > 0
                          ? outOfServiceDrones.map(d => `${d.name} out of service: ${d.anomalies.join(', ')}.`).join(' ')
                          : 'All drones in service.'}
                      </p>
                   </div>
                </section>
              </div>
              <div className="space-y-8">
                <section>
                  <h4 className="text-xs font-bold text-warning uppercase tracking-wider mb-4">Coverage Gap</h4>
                  <div className="p-5 rounded-2xl bg-warning/5 border border-warning/20">
                    <div className="text-4xl font-display font-bold text-warning mb-1">{gapCount} {gapCount === 1 ? 'Zone' : 'Zones'}</div>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Unpatrolled for {COVERAGE_GAP.minutes} min</p>
                    {recommendation.ok && (
                      <Button variant="bare" className="mt-4 text-xs text-warning font-bold bg-warning/10 px-4 py-2 rounded-lg border border-warning/20 hover:bg-warning/20 transition-all min-h-[32px]">Assign {recommendation.drone.name}</Button>
                    )}
                  </div>
                </section>
                <section>
                   <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Outstanding Tasks</h4>
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-xs text-gray-400"><span className="size-1.5 rounded-full bg-indigo-500"></span> 2 Police Reports Pending</div>
                     <div className="flex items-center gap-2 text-xs text-gray-400"><span className="size-1.5 rounded-full bg-gray-600"></span> Night Mode Audit Due</div>
                   </div>
                </section>
              </div>
            </div>
            <div className="p-10 flex justify-end gap-4 bg-background/50 border-t border-white/5">
              <Button variant="secondary" onClick={() => setShowShiftBriefing(false)} className="px-8 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Back to Ops</Button>
              <Button variant="primary" onClick={() => setShowShiftBriefing(false)} className="px-10 py-3 text-xs font-bold uppercase tracking-wider shadow-xl shadow-primary/20">Acknowledge & Sign</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl group-hover:rotate-180 transition-transform duration-500">hexagon</span>
          <div className="flex flex-col">
            <span className="text-white text-lg font-bold tracking-tight font-display">Musée d'Art Précieux CC</span>
            <span className="text-xs text-text-muted font-bold uppercase tracking-[0.12em] leading-none mt-1">Command Center v1.2.3</span>
          </div>
          <span className="ml-2 text-xs font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 tracking-wider uppercase">Rule-Based</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-6 relative">
        <div className="relative group">
          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">search</span>
          <input 
            value={searchQuery}
            // DO: Fixed typo - changed setSearchTerm to setSearchQuery to match declared state
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-panel border border-white/10 rounded-2xl py-2.5 pl-12 pr-12 text-white text-sm focus:border-primary/50 focus:ring-0 placeholder-text-muted transition-all outline-none" 
            placeholder="Search Drones, Incidents, Guards, Patrols..."
          />
          <Button variant="icon" aria-label="Show rule-based summary" onClick={handleSummary} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">summarize</span>
          </Button>
        </div>

        {summary && (
          <div className="absolute top-full mt-3 left-0 right-0 bg-indigo-600 border border-indigo-500/30 p-4 rounded-2xl shadow-2xl z-[70] animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="material-symbols-outlined text-white text-lg mt-0.5">info</span>
              <div className="flex-1">
                <p className="text-xs text-white/60 font-bold uppercase tracking-wider mb-1">Rule-based summary</p>
                <p className="text-xs text-white/90 font-bold leading-relaxed">{summary}</p>
              </div>
              <Button variant="icon" aria-label="Close summary" onClick={() => setSummary(null)} className="text-white/40 hover:text-white"><span aria-hidden="true" className="material-symbols-outlined text-sm">close</span></Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={notificationsRef}>
          <Button variant="icon"
 ref={bellRef}
 aria-expanded={showNotifications}
 aria-label="Notifications"
 onClick={() => setShowNotifications(!showNotifications)}
 className={`size-10 border relative ${ showNotifications ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-panel border-white/10 text-gray-400 hover:text-white' }`}>
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-danger ring-4 ring-background"></span>
          </Button>

          {showNotifications && (
            <div className="absolute top-full mt-4 right-0 w-[320px] bg-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[70] animate-in fade-in slide-in-from-top-2">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-background/50">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Notifications</h4>
                <Button variant="text" className="text-xs text-primary font-bold uppercase hover:underline">Clear All</Button>
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.map(n => (
                  <div key={n.id} className="p-5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className={`size-8 rounded-xl bg-background border border-white/5 flex items-center justify-center shrink-0 ${n.color}`}>
                        <span aria-hidden="true" className="material-symbols-outlined text-lg">{n.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider ${n.color}`}>{n.type}</span>
                          <span className="text-xs text-text-muted font-bold font-mono">{n.time}</span>
                        </div>
                        <p className="text-xs text-gray-300 font-medium leading-relaxed group-hover:text-white">{n.msg}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 text-center bg-background/50">
                <Button variant="text" className="text-xs font-bold text-text-muted uppercase tracking-wider hover:text-white">View All Activities</Button>
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
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider mt-1">Lead Drone Operator</span>
          </div>
          <span aria-hidden="true" className="material-symbols-outlined text-text-muted text-[18px] ml-2 group-hover:text-white">expand_more</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
