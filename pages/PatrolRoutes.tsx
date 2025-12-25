
import React, { useState, useMemo } from 'react';
import { PatrolRoute } from '../types';
import { getSmartSuggestion } from '../geminiService';

const mockRoutes: PatrolRoute[] = [
  { 
    id: 'PR-01', 
    name: 'Perimeter Alpha', 
    type: 'Standard', 
    duration: '18 min', 
    waypoints: 12, 
    lastRun: '14:20 today', 
    coverage: 100, 
    status: 'ACTIVE',
    drones: ['Sentinel-1'],
    guards: ['Pierre L.'],
    hasCoverageGap: false,
    frequency: 'Every 2 Hours',
    startTime: '08:00',
    endTime: '20:00',
    approvalStatus: 'Approved',
    isNightMode: false
  },
  { 
    id: 'PR-02', 
    name: 'North Storage Wing', 
    type: 'Emergency', 
    duration: '12 min', 
    waypoints: 8, 
    lastRun: 'Yesterday', 
    coverage: 85, 
    status: 'SCHEDULED',
    drones: [],
    guards: ['Sarah J.'],
    hasCoverageGap: true,
    gapDuration: '45 min',
    frequency: 'On Demand',
    startTime: '00:00',
    endTime: '23:59',
    approvalStatus: 'Pending',
    isNightMode: true
  },
  { 
    id: 'PR-03', 
    name: 'Gallery Sweep', 
    type: 'Standard', 
    duration: '45 min', 
    waypoints: 24, 
    lastRun: 'Never', 
    coverage: 0, 
    status: 'DRAFT',
    drones: ['Watcher-3'],
    guards: [],
    hasCoverageGap: false,
    frequency: 'Nightly',
    startTime: '22:00',
    endTime: '06:00',
    approvalStatus: 'N/A',
    isNightMode: true
  }
];

const PatrolRoutes: React.FC = () => {
  const [routes, setRoutes] = useState<PatrolRoute[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute>(mockRoutes[0]);
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      const searchMatch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const gapMatch = !showGapsOnly || r.hasCoverageGap;
      return searchMatch && gapMatch;
    });
  }, [routes, searchTerm, showGapsOnly]);

  const handleSmartSuggestion = async () => {
    setIsAiLoading(true);
    const context = `
      Route: ${selectedRoute.name}
      Type: ${selectedRoute.type}
      Coverage: ${selectedRoute.coverage}%
      Gaps: ${selectedRoute.hasCoverageGap ? selectedRoute.gapDuration : 'None'}
      Assigned: ${selectedRoute.drones.join(', ')}
    `;
    const res = await getSmartSuggestion(context);
    setSuggestion(res);
    setIsAiLoading(false);
  };

  const isRouteNightShift = (route: PatrolRoute) => {
    const startHour = parseInt(route.startTime.split(':')[0]);
    return startHour >= 22 || startHour < 6;
  };

  return (
    <div className="flex h-full gap-0 -m-6 overflow-hidden bg-background">
      {/* LEFT SIDEBAR: Route Library */}
      <aside className="w-[400px] flex flex-col border-r border-white/5 bg-panel shrink-0 z-30 shadow-2xl">
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Route Library</h2>
            <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] text-gray-500 font-bold uppercase">{filteredRoutes.length} Tracks</span>
          </div>

          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[12px] text-white focus:border-primary/50 placeholder-gray-600 outline-none transition-all" 
              placeholder="Search by route name..." 
            />
          </div>

          <div className="flex items-center justify-between px-1">
             <div className="flex flex-col">
               <span className="text-[10px] text-white font-bold uppercase tracking-tight">Show Coverage Gaps</span>
               <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Highlight >30m Unpatrolled</span>
             </div>
             <button 
              onClick={() => setShowGapsOnly(!showGapsOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showGapsOnly ? 'bg-primary' : 'bg-white/10'}`}
             >
                <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${showGapsOnly ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar mt-4">
          {filteredRoutes.map(route => (
            <div 
              key={route.id} 
              onClick={() => setSelectedRoute(route)}
              className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer relative group ${
                selectedRoute.id === route.id 
                  ? 'bg-primary/5 border-primary shadow-[0_4px_20px_-10px_rgba(6,182,212,0.3)]' 
                  : 'bg-background border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                  <h3 className={`font-bold text-sm tracking-tight ${selectedRoute.id === route.id ? 'text-white' : 'text-gray-300'}`}>
                    {route.name}
                  </h3>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{route.type}</span>
                </div>
                <span className={`text-[8px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider ${
                  route.status === 'ACTIVE' ? 'bg-primary text-black' : 
                  route.status === 'SCHEDULED' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-500'
                }`}>
                  {route.status}
                </span>
              </div>

              {route.hasCoverageGap && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 mb-4 flex items-center gap-3 animate-pulse">
                  <span className="material-symbols-outlined text-[16px] text-danger">warning</span>
                  <span className="text-[10px] text-danger font-bold uppercase tracking-widest">Gap: {route.gapDuration} Detected</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {route.drones.map(d => (
                  <div key={d} className="flex items-center gap-1.5 bg-panel border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold text-white uppercase">
                    <span className="material-symbols-outlined text-[14px] text-primary">flight</span> {d}
                  </div>
                ))}
                {route.guards.map(g => (
                  <div key={g} className="flex items-center gap-1.5 bg-panel border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold text-white uppercase">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">person</span> {g.split(' ')[0]}
                  </div>
                ))}
                {route.drones.length === 0 && route.guards.length === 0 && (
                  <div className="text-[9px] text-gray-600 italic font-bold uppercase tracking-widest">No assets assigned</div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>{route.duration}</span>
                </div>
                <span className={route.coverage >= 100 ? 'text-emerald-500' : 'text-warning'}>
                  {route.coverage}% Coverage
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT: Tactical Map & Editor */}
      <main className="flex-1 flex flex-col bg-background relative overflow-y-auto custom-scrollbar">
        <div className="p-12 max-w-[1500px] mx-auto w-full flex flex-col gap-10">
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h1 className="text-6xl font-display font-bold text-white tracking-tighter">{selectedRoute.name}</h1>
                <div className="flex gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    selectedRoute.type === 'Emergency' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-primary/10 border-primary/30 text-primary'
                  }`}>
                    {selectedRoute.type} Patrol
                  </span>
                  {selectedRoute.approvalStatus !== 'N/A' && (
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      selectedRoute.approvalStatus === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-warning/10 border-warning/30 text-warning'
                    }`}>
                      {selectedRoute.approvalStatus}
                    </span>
                  )}
                  {isRouteNightShift(selectedRoute) && (
                    <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">dark_mode</span> Night Protocol
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 max-w-3xl leading-relaxed font-medium">
                High-priority tactical deployment focusing on critical assets. Automatically reroutes during battery low-states 
                and leverages advanced obstacle avoidance in high-traffic corridors.
              </p>
            </div>
            <div className="flex gap-4 shrink-0 mt-2">
              <button className="bg-background border border-white/10 hover:border-white/30 text-white px-8 py-4 rounded-2xl text-[11px] font-bold transition-all uppercase tracking-[0.2em] shadow-lg">Edit Configuration</button>
              <button className="bg-primary hover:bg-primary/90 text-black px-12 py-4 rounded-2xl text-[11px] font-bold shadow-2xl shadow-primary/20 transition-all uppercase tracking-[0.2em]">Deploy Now</button>
            </div>
          </div>

          {/* Tactical Map Visualization */}
          <div className="w-full h-[500px] bg-panel rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 grayscale opacity-40 mix-blend-screen contrast-125">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMpS8VcPMFhpUzqs9ZGZChCwCHQ2g_YI0PWfxlgl-wqonY1w1eUh4eU2egEZH6c-dt6E0bmaePV9vJEH247xA11fyHmzQfRuEaUttE3kzyZhHYKBEA7Wi78uwt7p0UnWBb84lyHakzVhSH5TZjTnc8PRRbLhd8S8RKEKbGjLyJHkffu6OsIOkPuFjLW_SsDrnNP4DsG9Dmr3dnOPHX-84esX-PFny9rvN6wMSshNizEfSIr3L4Fm3lY93DdoPGCRV4-_9w8uqzCvA" className="w-full h-full object-cover" alt="Satellite Layout" />
            </div>

            {/* Overlays */}
            <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
              <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl w-64">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Tactical Overlays</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-white">
                    <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary"></span> Waypoints</span>
                    <span className="font-bold text-gray-500">{selectedRoute.waypoints}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white">
                    <span className="flex items-center gap-2"><span className="size-2 rounded-full border-2 border-dashed border-danger"></span> Blind Spots</span>
                    <span className="font-bold text-gray-500">2 Zones</span>
                  </div>
                </div>
              </div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible p-20">
              {/* Path */}
              <polyline 
                points="200,400 400,300 800,350 1000,100 600,150 200,400" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="3" 
                strokeDasharray="10 6" 
                strokeLinecap="round" 
                className="opacity-40"
              />
              
              {/* Blind Spot Region */}
              <rect x="700" y="250" width="120" height="120" fill="rgba(239, 68, 68, 0.05)" stroke="rgba(239, 68, 68, 0.2)" strokeDasharray="5 5" strokeWidth="2" className="animate-pulse" />
              <text x="760" y="320" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold" className="uppercase tracking-widest opacity-60">Gap &gt;30m</text>

              {/* Numbered Waypoints */}
              {[
                { x: 400, y: 300, n: 1 },
                { x: 800, y: 350, n: 2 },
                { x: 1000, y: 100, n: 3 },
                { x: 600, y: 150, n: 4 }
              ].map(p => (
                <g key={p.n} transform={`translate(${p.x}, ${p.y})`}>
                  <circle r="14" fill="#151a23" stroke="#06b6d4" strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{p.n}</text>
                </g>
              ))}

              {/* Drone Position */}
              <circle cx="900" cy="225" r="18" fill="#06b6d4" className="animate-pulse shadow-xl" />
              <path d="M895 220 L905 230 M905 220 L895 230" stroke="white" strokeWidth="2" />
            </svg>

            {/* Bottom Metrics Overlay */}
            <div className="absolute bottom-8 right-8 z-20 flex gap-4">
               {[
                 { l: 'Est. Battery Usage', v: '~14%', u: 'Total Flight' },
                 { l: 'Coverage Percentage', v: `${selectedRoute.coverage}%`, u: 'Target Zone' }
               ].map((m, i) => (
                 <div key={i} className="bg-black/80 backdrop-blur-md border border-white/10 px-8 py-5 rounded-3xl shadow-2xl min-w-[200px]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">{m.l}</span>
                    <div className="text-3xl font-display font-bold text-white tracking-tighter">{m.v}</div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 block">{m.u}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Assignments & Scheduling Cards */}
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-7 space-y-10">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Assignment Matrix</h3>
                  <button className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">Manage Team</button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 space-y-6">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-primary">flight</span> Active Drones
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedRoute.drones.length > 0 ? selectedRoute.drones.map(d => (
                        <div key={d} className="bg-background border border-primary/20 rounded-2xl p-4 flex items-center gap-4 flex-1 min-w-[150px] group hover:border-primary transition-all">
                           <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                           <span className="text-xs font-bold text-white uppercase tracking-widest">{d}</span>
                           <span className="material-symbols-outlined text-gray-700 ml-auto group-hover:text-danger cursor-pointer text-lg">cancel</span>
                        </div>
                      )) : (
                        <button className="w-full border-2 border-dashed border-white/5 rounded-2xl py-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white hover:border-white/20 transition-all">
                          Add Mission Asset
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 space-y-6">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-emerald-500">person</span> Guard Units
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedRoute.guards.length > 0 ? selectedRoute.guards.map(g => (
                        <div key={g} className="bg-background border border-white/5 rounded-2xl p-4 flex items-center gap-4 flex-1 min-w-[150px]">
                           <div className="size-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                             <span className="material-symbols-outlined text-sm">person</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-white uppercase">{g}</span>
                             <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Zone Backup</span>
                           </div>
                        </div>
                      )) : (
                        <button className="w-full border-2 border-dashed border-white/5 rounded-2xl py-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white hover:border-white/20 transition-all">
                          Task Guard Unit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Route Strategy & Scheduling</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] block mb-2">Frequency Plan</span>
                      <div className="text-3xl font-display font-bold text-white tracking-tighter">{selectedRoute.frequency}</div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                       <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                         <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Next Run: 16:00
                       </span>
                       <span className="text-[10px] text-gray-600 font-mono">UTC+1</span>
                    </div>
                  </div>
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] block mb-2">Operational Window</span>
                      <div className="text-3xl font-display font-bold text-white tracking-tighter">{selectedRoute.startTime} — {selectedRoute.endTime}</div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Monday — Friday</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-10">
               <section className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Intelligence Engine</h3>
                    <button 
                      onClick={handleSmartSuggestion}
                      disabled={isAiLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-6 py-2.5 rounded-full uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">{isAiLoading ? 'refresh' : 'auto_awesome'}</span>
                      {isAiLoading ? 'Analyzing...' : 'Smart Optimization'}
                    </button>
                 </div>
                 
                 {suggestion ? (
                   <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 relative overflow-hidden group animate-in slide-in-from-bottom duration-500">
                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                     <div className="flex gap-6">
                       <div className="size-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                         <span className="material-symbols-outlined text-indigo-400">psychology</span>
                       </div>
                       <div>
                         <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">AI Tactical Insight</h4>
                         <p className="text-[13px] text-gray-300 italic leading-relaxed font-medium">"{suggestion}"</p>
                         <button className="mt-6 text-[10px] text-white font-bold bg-indigo-600 px-6 py-2 rounded-xl uppercase tracking-widest hover:brightness-110 transition-all">Apply Recommendation</button>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-panel/30 border border-dashed border-white/10 rounded-[2rem] p-12 text-center">
                     <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-relaxed">
                       Enable Smart Optimization to analyze coverage gaps and propose mission-specific adjustments.
                     </p>
                   </div>
                 )}
               </section>

               {selectedRoute.hasCoverageGap && (
                 <section className="bg-danger/10 border border-danger/20 rounded-[2rem] p-8 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-danger/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-danger">crisis_alert</span>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-danger uppercase tracking-widest">Coverage Criticality</h4>
                        <p className="text-[10px] text-danger/60 font-bold uppercase tracking-widest">Action Required</p>
                      </div>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">
                     Zone <span className="text-white font-bold">"North Storage"</span> is currently unpatrolled by any automated track for >45 minutes. 
                     Recommend adding a high-altitude waypoint at [Sector 4] or tasking a manual guard sweep.
                   </p>
                   <div className="flex gap-3 pt-2">
                     <button className="bg-danger/80 hover:bg-danger text-white text-[9px] font-bold px-4 py-2 rounded-lg uppercase tracking-widest transition-all">Task Guard</button>
                     <button className="bg-white/5 border border-white/10 text-white text-[9px] font-bold px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-white/10 transition-all">Ignore Once</button>
                   </div>
                 </section>
               )}

               {isRouteNightShift(selectedRoute) && (
                 <section className="bg-indigo-900/10 border border-indigo-500/20 rounded-[2rem] p-8 space-y-4">
                   <div className="flex items-center gap-4 text-indigo-400">
                      <span className="material-symbols-outlined text-2xl">bedtime</span>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest">Night Operation Constraints</h4>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">
                     This route includes non-critical zones during silent hours (22:00–06:00). Safety protocol requires 
                     Director-level override for non-critical flight pathing at night.
                   </p>
                   <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                     Request Override <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                   </button>
                 </section>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER ACTIONS - Floating */}
      <div className="fixed bottom-10 right-10 z-[60] flex gap-3">
         <button className="size-14 rounded-full bg-panel border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all shadow-2xl">
           <span className="material-symbols-outlined text-[24px]">content_copy</span>
         </button>
         <button className="bg-primary hover:bg-primary/90 text-black font-bold px-10 rounded-full shadow-2xl flex items-center justify-center gap-3 group transition-all transform active:scale-95">
           <span className="material-symbols-outlined text-2xl">add</span>
           <span className="text-[11px] font-bold uppercase tracking-[0.2em]">New Tactical Route</span>
         </button>
      </div>
    </div>
  );
};

export default PatrolRoutes;
