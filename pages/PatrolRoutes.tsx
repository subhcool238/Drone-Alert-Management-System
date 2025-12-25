
import React, { useState } from 'react';
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
    status: 'ACTIVE' 
  },
  { 
    id: 'PR-02', 
    name: 'Richelieu Roof', 
    type: 'Emergency', 
    duration: '12 min', 
    waypoints: 8, 
    lastRun: 'Yesterday', 
    coverage: 85, 
    status: 'SCHEDULED' 
  },
  { 
    id: 'PR-03', 
    name: 'Night Watch B', 
    type: 'Standard', 
    duration: '45 min', 
    waypoints: 24, 
    lastRun: 'Never', 
    coverage: 0, 
    status: 'DRAFT' 
  }
];

const PatrolRoutes: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<PatrolRoute>(mockRoutes[0]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleSmartSuggestion = async () => {
    setIsAiLoading(true);
    const context = `Route: ${selectedRoute.name}, Status: ${selectedRoute.status}, Coverage: ${selectedRoute.coverage}%`;
    const res = await getSmartSuggestion(context);
    setSuggestion(res);
    setIsAiLoading(false);
  };

  return (
    <div className="flex h-full gap-0 -m-6 overflow-hidden bg-background">
      {/* LEFT SIDEBAR: Route Library */}
      <aside className="w-[380px] flex flex-col border-r border-white/5 bg-background shrink-0 z-10">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Route Library</h2>
            <span className="text-[10px] text-text-muted">8 Routes</span>
          </div>
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
            <input 
              className="w-full bg-panel border border-white/5 rounded-lg py-2 pl-9 pr-3 text-[11px] text-white placeholder-gray-600 focus:border-primary focus:ring-0 outline-none" 
              placeholder="Search routes..." 
              type="text"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="relative">
              <select className="w-full bg-panel border border-white/5 rounded-lg text-[10px] text-white py-2 px-3 appearance-none focus:ring-0 focus:border-primary cursor-pointer outline-none">
                <option>Type: All</option>
                <option>Standard</option>
                <option>Emergency</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[16px]">expand_more</span>
            </div>
            <div className="relative">
              <select className="w-full bg-panel border border-white/5 rounded-lg text-[10px] text-white py-2 px-3 appearance-none focus:ring-0 focus:border-primary cursor-pointer outline-none">
                <option>Status: All</option>
                <option>Active</option>
                <option>Scheduled</option>
                <option>Draft</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-[16px]">expand_more</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-tight">Show coverage gaps</span>
            <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-white/10">
              <span className="translate-x-1 inline-block h-3 w-3 transform rounded-full bg-gray-500 transition" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
          {mockRoutes.map(route => (
            <div 
              key={route.id} 
              onClick={() => setSelectedRoute(route)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                selectedRoute.id === route.id 
                  ? 'bg-primary/5 border-primary shadow-[0_4px_20px_-10px_rgba(6,182,212,0.2)]' 
                  : 'bg-panel border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-sm ${selectedRoute.id === route.id ? 'text-white' : 'text-gray-400'}`}>
                  {route.name}
                </h3>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  route.status === 'ACTIVE' ? 'bg-primary text-black' : 'bg-white/10 text-text-muted'
                }`}>
                  {route.status}
                </span>
              </div>
              <div className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-3">
                {route.type} • {route.duration} • {route.waypoints} Waypoints
              </div>
              
              {route.id === 'PR-02' && (
                <div className="bg-danger/10 border border-danger/20 rounded px-2 py-1.5 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-danger">warning</span>
                  <span className="text-[9px] text-danger font-bold uppercase">Gap &gt; 45min Detected</span>
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-background border border-white/5 rounded-full px-2 py-1">
                  <span className="material-symbols-outlined text-[10px] text-primary">flight</span>
                  <span className="text-[9px] text-white">Sentinel-1</span>
                </div>
                <div className="flex items-center gap-1.5 bg-background border border-white/5 rounded-full px-2 py-1">
                  <span className="material-symbols-outlined text-[10px] text-white">person</span>
                  <span className="text-[9px] text-white">Guard: Pierre</span>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-3">
                <span className="text-[9px] text-text-muted">Last run: {route.lastRun}</span>
                <span className={`text-[9px] font-bold ${route.coverage === 100 ? 'text-success' : 'text-warning'}`}>
                  Coverage: {route.coverage}%
                </span>
              </div>
              {route.status === 'ACTIVE' && (
                <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT: Tactical Map & Editor */}
      <main className="flex-1 flex flex-col bg-background relative overflow-y-auto custom-scrollbar">
        <div className="p-10 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-4xl font-display font-bold text-white tracking-tight">{selectedRoute.name}</h1>
                <div className="flex gap-2">
                  <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">Standard</span>
                  <span className="bg-white/5 text-text-muted border border-white/5 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">Emergency</span>
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] fill-1">check_circle</span> Approved
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
                Primary external perimeter scan including courtyard and pyramid. Automated pathing avoids known blind spots in CCTV sector 4.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button className="bg-background border border-white/10 hover:bg-white/5 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest">Edit Route</button>
              <button className="bg-primary hover:bg-primary/90 text-black px-8 py-2.5 rounded-xl text-xs font-bold shadow-xl shadow-primary/20 transition-all uppercase tracking-widest">Publish</button>
            </div>
          </div>

          <div className="w-full aspect-[21/9] bg-panel rounded-2xl border border-white/5 relative overflow-hidden group shadow-2xl">
            {/* Simulated Satellite Map */}
            <div className="absolute inset-0 grayscale opacity-40 contrast-125 brightness-50">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMpS8VcPMFhpUzqs9ZGZChCwCHQ2g_YI0PWfxlgl-wqonY1w1eUh4eU2egEZH6c-dt6E0bmaePV9vJEH247xA11fyHmzQfRuEaUttE3kzyZhHYKBEA7Wi78uwt7p0UnWBb84lyHakzVhSH5TZjTnc8PRRbLhd8S8RKEKbGjLyJHkffu6OsIOkPuFjLW_SsDrnNP4DsG9Dmr3dnOPHX-84esX-PFny9rvN6wMSshNizEfSIr3L4Fm3lY93DdoPGCRV4-_9w8uqzCvA" 
                alt="Map Base" 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Tactical Overlays */}
            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md border border-white/5 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1">
              <div className="text-[8px] text-text-muted font-bold px-2 py-1 uppercase tracking-widest">Map Layers</div>
              <div className="flex gap-1">
                <button className="px-2.5 py-1.5 bg-primary/20 text-primary text-[9px] font-bold rounded-lg hover:bg-primary/30 transition-colors uppercase">Waypoints</button>
                <button className="px-2.5 py-1.5 bg-danger/10 text-danger border border-danger/20 text-[9px] font-bold rounded-lg hover:bg-danger/20 transition-colors uppercase">Blind Spots</button>
                <button className="px-2.5 py-1.5 bg-white/5 text-text-muted border border-white/10 text-[9px] font-bold rounded-lg hover:bg-white/10 transition-colors uppercase">Zones</button>
              </div>
            </div>

            {/* Floating Metrics */}
            <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-lg border border-white/5 rounded-2xl p-5 shadow-2xl w-72">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Route Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Total Distance</span>
                  <span className="text-white font-mono font-bold text-xs tracking-tighter">2.4 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Est. Duration</span>
                  <span className="text-white font-mono font-bold text-xs tracking-tighter">18 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Battery Usage</span>
                  <span className="text-warning font-mono font-bold text-xs tracking-tighter">~14%</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-3">
                  <span className="text-[11px] text-text-muted">Coverage Est.</span>
                  <span className="text-emerald-400 font-mono font-bold text-xs tracking-tighter">100%</span>
                </div>
              </div>
            </div>

            {/* Path SVG Simulation */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
              <circle cx="75%" cy="45%" r="80" fill="rgba(239, 68, 68, 0.05)" stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="4 4" strokeWidth="1" />
              <text x="75%" y="45%" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold" className="uppercase tracking-widest opacity-80">Unpatrolled &gt; 45m</text>
              
              <polyline 
                points="400,300 600,250 800,100 700,150 500,250 400,300" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="2" 
                strokeDasharray="8 4" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="opacity-60"
              />
              
              {/* Waypoints */}
              <g transform="translate(600, 250)">
                <circle r="10" fill="#151a23" stroke="#06b6d4" strokeWidth="2" />
                <text y="3" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">4</text>
              </g>
              <g transform="translate(800, 100)">
                <circle r="10" fill="#151a23" stroke="#06b6d4" strokeWidth="2" />
                <text y="3" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">5</text>
              </g>
              
              {/* Moving Drone Indicator */}
              <circle cx="500" cy="220" r="14" fill="#06b6d4" className="animate-pulse shadow-lg" />
              <path d="M495 215 L505 225 M505 215 L495 225" stroke="white" strokeWidth="2" />
            </svg>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* ASSIGNMENTS */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Assignments</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Drone Fleet</h4>
                    <button className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold">Reassign</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-3 bg-background border border-primary/20 rounded-xl px-4 py-3 group hover:border-primary transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-primary text-lg">flight</span>
                      <span className="text-xs font-bold text-white">Sentinel-1</span>
                      <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    </div>
                    <button className="flex items-center gap-2 border border-dashed border-white/10 rounded-xl px-4 py-3 text-[10px] text-text-muted hover:text-white hover:border-white/20 transition-all uppercase tracking-widest font-bold">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Assign
                    </button>
                  </div>
                </div>

                <div className="bg-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Guard Units</h4>
                  <div className="flex items-center gap-4 bg-background border border-white/5 rounded-xl px-4 py-3 group hover:border-white/20 transition-all cursor-pointer">
                    <div className="size-10 rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10">
                      <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIDyTcgMziu_SlD9vKbP4lc7DxNC1csn7gAFJhb_yYJrjztwO0ZRepLrW67jMXpMPyMsen9As3YGoOppNjRCQg68Ph_MW8mnBX7r3HL07ukI4CHCM-UqCQtDRUogqeg_I9FwW-35qn_hsMev_h4DsEDgvMBiQ7Txw2fizEwZBYKEtS5lBHn1wUnUFZUj3m9sEUG7VIqSLtK0oGMSX6OZhgUgRqCph62m_tNdVdq-L9AsaC1LWh8L2KC7JESlmEFVM9JqErwIM8FQw" alt="Guard" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Pierre L.</span>
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Zone B-C</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SCHEDULE & AI */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Schedule & Strategy</h3>
                <button 
                  onClick={handleSmartSuggestion}
                  disabled={isAiLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">{isAiLoading ? 'refresh' : 'auto_awesome'}</span>
                  {isAiLoading ? 'Analyzing...' : 'Smart Suggestion'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-panel border border-white/5 rounded-2xl p-6">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold block mb-2">Frequency</span>
                  <div className="text-2xl font-display font-bold text-white">Every 2 Hours</div>
                  <div className="text-emerald-400 text-[10px] font-bold uppercase mt-2 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Next: 16:00
                  </div>
                </div>
                <div className="bg-panel border border-white/5 rounded-2xl p-6">
                  <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold block mb-2">Time Window</span>
                  <div className="text-2xl font-display font-bold text-white">08:00 - 20:00</div>
                  <div className="text-text-muted text-[10px] font-bold uppercase mt-2">Active Mon-Fri</div>
                </div>
              </div>

              {suggestion && (
                <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-purple-400">psychology</span>
                    <div>
                      <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">AI Recommendation</h4>
                      <p className="text-xs text-gray-300 italic leading-relaxed">"{suggestion}"</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRoute.id === 'PR-02' && (
                <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6 flex items-start gap-4">
                  <span className="material-symbols-outlined text-warning text-[24px]">warning</span>
                  <div className="flex-1">
                    <h4 className="text-warning text-[10px] font-bold uppercase tracking-widest mb-1">Coverage Gap Alert</h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Zone "Richelieu Roof" is unpatrolled for over 45 minutes due to overlapping schedules. 
                      Consider adding a temporary waypoint or <button className="text-primary font-bold hover:underline">reassigning Sentinel-2</button>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatrolRoutes;
