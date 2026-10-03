
import React, { useState, useMemo } from 'react';
import Button from '../components/Button';
import { clickableProps } from '../components/a11y';
import { PatrolRoute } from '../types';
import { COLORS } from '../data/theme';
import { PATROL_ROUTES, COVERAGE_GAP, getPatrolRecommendation, getNextRun, PatrolRecommendation } from '../data/patrols';

const PatrolRoutes: React.FC = () => {
  const [routes, setRoutes] = useState<PatrolRoute[]>(PATROL_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute>(PATROL_ROUTES[0]);
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeScope, setTimeScope] = useState('Last 24h');
  const [recommendation, setRecommendation] = useState<PatrolRecommendation | null>(null);

  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      const searchMatch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const gapMatch = !showGapsOnly || r.hasCoverageGap;
      
      let timeMatch = true;
      if (timeScope === 'Current shift') timeMatch = r.status === 'ACTIVE';
      if (timeScope === 'Previous shift') timeMatch = r.lastRun.includes('today') || r.lastRun.includes('Yesterday');

      return searchMatch && gapMatch && timeMatch;
    });
  }, [routes, searchTerm, showGapsOnly, timeScope]);

  // Rule-based recommendation from the shared drone and patrol data
  const handleRecommendation = () => {
    setRecommendation(getPatrolRecommendation(routes));
  };

  // Applied when the recommended drone is already on the recommended route in page state
  const isApplied =
    recommendation?.ok === true &&
    !!routes.find(r => r.id === recommendation.route.id)?.drones.includes(recommendation.drone.name);

  const handleApplyRecommendation = () => {
    if (!recommendation?.ok || isApplied) return;
    const { route, drone } = recommendation;
    const assign = (r: PatrolRoute): PatrolRoute =>
      r.id === route.id ? { ...r, drones: [...r.drones, drone.name] } : r;
    setRoutes(prev => prev.map(assign));
    setSelectedRoute(prev => assign(prev));
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
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.12em]">Route Library</h2>
            <span className="bg-white/5 px-2 py-0.5 rounded text-xs text-text-muted font-bold uppercase">{filteredRoutes.length} Tracks</span>
          </div>

          <div className="relative mb-4">
            <span aria-hidden="true" className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[12px] text-white focus:border-primary/50 placeholder-text-muted outline-none transition-all" 
              placeholder="Search routes..." 
            />
          </div>

          <div className="relative mb-6">
            <select 
              value={timeScope}
              onChange={e => setTimeScope(e.target.value)}
              className="w-full appearance-none bg-background border border-white/10 text-gray-400 text-xs font-bold rounded-xl px-4 py-3 uppercase tracking-wider outline-none cursor-pointer focus:border-primary/30"
            >
              {['Current shift', 'Previous shift', 'Last 24h'].map(o => <option key={o} value={o}>Scope: {o}</option>)}
            </select>
            <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-lg">expand_more</span>
          </div>

          <div className="flex items-center justify-between px-1">
             <div className="flex flex-col">
               <span className="text-xs text-white font-bold uppercase tracking-tight">Show Coverage Gaps</span>
               <span className="text-xs text-text-muted font-bold uppercase tracking-wider mt-0.5">Highlight &gt;30m Unpatrolled</span>
             </div>
             <Button variant="toggle" role="switch" aria-checked={showGapsOnly} 
 onClick={() => setShowGapsOnly(!showGapsOnly)}
 className={`h-6 w-11 ${showGapsOnly ? 'bg-primary' : 'bg-white/10'}`}>
                <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${showGapsOnly ? 'translate-x-6' : 'translate-x-1'}`} />
             </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 custom-scrollbar mt-4">
          {filteredRoutes.map(route => (
            <div 
              key={route.id} 
              {...clickableProps(() => setSelectedRoute(route))}
              aria-pressed={selectedRoute.id === route.id}
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
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{route.type}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-bold uppercase tracking-wide ${
                  route.status === 'ACTIVE' ? 'bg-primary text-black' : 
                  route.status === 'SCHEDULED' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-text-muted'
                }`}>
                  {route.status}
                </span>
              </div>

              {route.hasCoverageGap && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 mb-4 flex items-center gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-danger-light">warning</span>
                  <span className="text-xs text-danger-light font-bold uppercase tracking-wider">Gap: {route.gapDuration} Detected</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {route.drones.map(d => (
                  <div key={d} className="flex items-center gap-1.5 bg-panel border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white uppercase">
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-primary">flight</span> {d}
                  </div>
                ))}
                {route.guards.map(g => (
                  <div key={g} className="flex items-center gap-1.5 bg-panel border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white uppercase">
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-emerald-500">person</span> {g.split(' ')[0]}
                  </div>
                ))}
                {route.drones.length === 0 && route.guards.length === 0 && (
                  <div className="text-xs text-text-muted italic font-bold uppercase tracking-wider">No assets assigned</div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">schedule</span>
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
          
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h1 className="text-6xl font-display font-bold text-white tracking-tighter">{selectedRoute.name}</h1>
                <div className="flex gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                    selectedRoute.type === 'Emergency' ? 'bg-danger/10 border-danger/30 text-danger-light' : 'bg-primary/10 border-primary/30 text-primary'
                  }`}>
                    {selectedRoute.type} Patrol
                  </span>
                  {selectedRoute.approvalStatus !== 'N/A' && (
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      selectedRoute.approvalStatus === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-warning/10 border-warning/30 text-warning'
                    }`}>
                      {selectedRoute.approvalStatus}
                    </span>
                  )}
                  {isRouteNightShift(selectedRoute) && (
                    <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px]">dark_mode</span> Night Protocol
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-muted max-w-3xl leading-relaxed font-medium">
                High-priority tactical deployment focusing on critical assets. Automatically reroutes during battery low-states 
                and leverages advanced obstacle avoidance in high-traffic corridors.
              </p>
            </div>
            <div className="flex gap-4 shrink-0 mt-2">
              <Button variant="secondary" className="bg-background hover:border-white/30 text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.12em] shadow-lg">Edit Configuration</Button>
              <Button variant="primary" className="px-12 py-4 text-xs font-bold shadow-2xl shadow-primary/20 uppercase tracking-[0.12em]">Deploy Now</Button>
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
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Tactical Overlays</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary"></span> Waypoints</span>
                    <span className="font-bold text-text-muted">{selectedRoute.waypoints}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-2"><span className="size-2 rounded-full border-2 border-dashed border-danger"></span> Blind Spots</span>
                    <span className="font-bold text-text-muted">2 Zones</span>
                  </div>
                </div>
              </div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible p-20">
              {/* Path */}
              <polyline 
                points="200,400 400,300 800,350 1000,100 600,150 200,400" 
                fill="none" 
                stroke={COLORS.primary} 
                strokeWidth="3" 
                strokeDasharray="10 6" 
                strokeLinecap="round" 
                className="opacity-40"
              />
              
              {/* Blind Spot Region */}
              <rect x="700" y="250" width="120" height="120" fill="rgba(239, 68, 68, 0.05)" stroke="rgba(239, 68, 68, 0.2)" strokeDasharray="5 5" strokeWidth="2" className="animate-pulse" />
              <text x="760" y="320" textAnchor="middle" fill={COLORS.dangerLight} fontSize="13" fontWeight="bold" className="uppercase tracking-wider">Gap &gt;30m</text>

              {/* Numbered Waypoints */}
              {[
                { x: 400, y: 300, n: 1 },
                { x: 800, y: 350, n: 2 },
                { x: 1000, y: 100, n: 3 },
                { x: 600, y: 150, n: 4 }
              ].map(p => (
                <g key={p.n} transform={`translate(${p.x}, ${p.y})`}>
                  <circle r="14" fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" />
                  <text y="4" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{p.n}</text>
                </g>
              ))}

              {/* Drone Position */}
              <circle cx="900" cy="225" r="18" fill={COLORS.primary} className="animate-pulse shadow-xl" />
              <path d="M895 220 L905 230 M905 220 L895 230" stroke="white" strokeWidth="2" />
            </svg>

            {/* Bottom Metrics Overlay */}
            <div className="absolute bottom-8 right-8 z-20 flex gap-4">
               {[
                 { l: 'Est. Battery Usage', v: '~14%', u: 'Total Flight' },
                 { l: 'Coverage Percentage', v: `${selectedRoute.coverage}%`, u: 'Target Zone' }
               ].map((m, i) => (
                 <div key={i} className="bg-black/80 backdrop-blur-md border border-white/10 px-8 py-5 rounded-3xl shadow-2xl min-w-[200px]">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">{m.l}</span>
                    <div className="text-3xl font-display font-bold text-white tracking-tighter">{m.v}</div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mt-1 block">{m.u}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Assignments & Scheduling Cards */}
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-7 space-y-10">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em]">Assignment Matrix</h3>
                  <Button variant="text" className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">Manage Team</Button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 space-y-6">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-3">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary">flight</span> Assigned Drones
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedRoute.drones.length > 0 ? selectedRoute.drones.map(d => (
                        <div key={d} className="bg-background border border-primary/20 rounded-2xl p-4 flex items-center gap-4 flex-1 min-w-[150px] group hover:border-primary transition-all">
                           <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                           <span className="text-xs font-bold text-white uppercase tracking-widest">{d}</span>
                           <span aria-hidden="true" className="material-symbols-outlined text-text-muted ml-auto group-hover:text-danger-light cursor-pointer text-lg">cancel</span>
                        </div>
                      )) : (
                        <Button variant="bare" className="w-full border-2 border-dashed border-white/5 py-8 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-white hover:border-white/20 transition-all rounded-lg">
                          Add Mission Asset
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 space-y-6">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-3">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-emerald-500">person</span> Guard Units
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedRoute.guards.length > 0 ? selectedRoute.guards.map(g => (
                        <div key={g} className="bg-background border border-white/5 rounded-2xl p-4 flex items-center gap-4 flex-1 min-w-[150px]">
                           <div className="size-8 rounded-full bg-gray-800 flex items-center justify-center text-text-muted">
                             <span aria-hidden="true" className="material-symbols-outlined text-sm">person</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-white uppercase">{g}</span>
                             <span className="text-xs text-text-muted font-bold uppercase tracking-tighter">Zone Backup</span>
                           </div>
                        </div>
                      )) : (
                        <Button variant="bare" className="w-full border-2 border-dashed border-white/5 py-8 text-xs font-bold text-text-muted uppercase tracking-wider hover:text-white hover:border-white/20 transition-all rounded-lg">
                          Task Guard Unit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em]">Route Strategy & Scheduling</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-text-muted font-bold uppercase tracking-[0.12em] block mb-2">Frequency Plan</span>
                      <div className="text-3xl font-display font-bold text-white tracking-tighter">{selectedRoute.frequency}</div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                       <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                         <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Next Run: {getNextRun(selectedRoute)}
                       </span>
                       <span className="text-xs text-text-muted font-mono">UTC+1</span>
                    </div>
                  </div>
                  <div className="bg-panel/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                      <span className="text-xs text-text-muted font-bold uppercase tracking-[0.12em] block mb-2">Operational Window</span>
                      <div className="text-3xl font-display font-bold text-white tracking-tighter">{selectedRoute.startTime} — {selectedRoute.endTime}</div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Active Monday — Friday</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-10">
               <section className="space-y-6">
                 <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em]">Route Recommendations</h3>
                    <Button variant="indigo"
 onClick={handleRecommendation}
 className="text-xs font-bold px-6 py-2.5 uppercase tracking-wider shadow-xl shadow-indigo-600/20 gap-2">
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">lightbulb</span>
                      Get Recommendation
                    </Button>
                 </div>

                 {recommendation ? (
                   <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 relative overflow-hidden group animate-in slide-in-from-bottom duration-500">
                     <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                     <div className="flex gap-6">
                       <div className="size-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                         <span aria-hidden="true" className="material-symbols-outlined text-indigo-400">lightbulb</span>
                       </div>
                       <div>
                         <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Rule-based recommendation</h4>
                         {recommendation.ok ? (
                           <>
                             <p className="text-[13px] text-gray-300 italic leading-relaxed font-medium">{recommendation.summary} {recommendation.reason}</p>
                             {isApplied ? (
                               <p className="mt-6 text-xs text-emerald-500 font-bold uppercase tracking-wider">Applied: {recommendation.drone.name} assigned to {recommendation.route.name}</p>
                             ) : (
                               <Button variant="indigo" onClick={handleApplyRecommendation} className="mt-6 text-xs font-bold px-6 py-2 uppercase tracking-wider">Apply Recommendation</Button>
                             )}
                           </>
                         ) : (
                           <p className="text-[13px] text-gray-300 italic leading-relaxed font-medium">{recommendation.message}</p>
                         )}
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="bg-panel/30 border border-dashed border-white/10 rounded-[2rem] p-12 text-center">
                     <p className="text-xs text-text-muted font-bold uppercase tracking-[0.12em] leading-relaxed">
                       Select Get Recommendation to check coverage gaps and idle drones.
                     </p>
                   </div>
                 )}
               </section>

               {selectedRoute.hasCoverageGap && (
                 <section className="bg-danger/10 border border-danger/20 rounded-[2rem] p-8 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-danger/20 flex items-center justify-center">
                        <span aria-hidden="true" className="material-symbols-outlined text-danger-light">crisis_alert</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-danger-light uppercase tracking-wider">Coverage Criticality</h4>
                        <p className="text-xs text-danger-light font-bold uppercase tracking-wider">Action Required</p>
                      </div>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">
                     Zone <span className="text-white font-bold">"{COVERAGE_GAP.zone}"</span> is currently unpatrolled by any automated track for {COVERAGE_GAP.minutes} minutes. 
                     Recommend adding a high-altitude waypoint at [Sector 4] or tasking a manual guard sweep.
                   </p>
                   <div className="flex gap-3 pt-2">
                     <Button variant="danger" className="text-xs font-bold px-4 py-2 uppercase tracking-wider">Task Guard</Button>
                     <Button variant="secondary" className="bg-white/5 text-white text-xs font-bold px-4 py-2 uppercase tracking-wider hover:bg-white/10">Ignore Once</Button>
                   </div>
                 </section>
               )}

               {isRouteNightShift(selectedRoute) && (
                 <section className="bg-indigo-900/10 border border-indigo-500/20 rounded-[2rem] p-8 space-y-4">
                   <div className="flex items-center gap-4 text-indigo-400">
                      <span aria-hidden="true" className="material-symbols-outlined text-2xl">bedtime</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Night Operation Constraints</h4>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">
                     This route includes non-critical zones during silent hours (22:00–06:00). Safety protocol requires 
                     Team Lead approval for non-critical flight pathing at night.
                   </p>
                   <Button variant="text" className="text-xs font-bold text-indigo-400 uppercase tracking-wider gap-2 hover:translate-x-1 transition-transform">
                     Request Override <span aria-hidden="true" className="material-symbols-outlined text-[14px]">arrow_forward</span>
                   </Button>
                 </section>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER ACTIONS - Floating */}
      <div className="fixed bottom-10 right-10 z-[60] flex gap-3">
         <Button variant="icon" aria-label="Duplicate route" className="size-14 bg-panel border border-white/10 text-gray-400 hover:text-white hover:border-white/30 shadow-2xl">
           <span aria-hidden="true" className="material-symbols-outlined text-[24px]">content_copy</span>
         </Button>
         <Button variant="primary" className="font-bold px-10 shadow-2xl gap-3 group transform active:scale-95">
           <span aria-hidden="true" className="material-symbols-outlined text-2xl">add</span>
           <span className="text-xs font-bold uppercase tracking-[0.12em]">New Tactical Route</span>
         </Button>
      </div>
    </div>
  );
};

export default PatrolRoutes;
