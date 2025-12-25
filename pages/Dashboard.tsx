
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreatType, Incident, Guard } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'status' | 'patrols' | 'guards'>('feed');
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');
  const [viewMode, setViewMode] = useState<'default' | 'thermal'>('default');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('ALT-01');
  const [showShiftHandover, setShowShiftHandover] = useState(false);
  const [patrolsPaused, setPatrolsPaused] = useState(false);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('All');
  const [threatFilter, setThreatFilter] = useState('All');
  const [mapLayers, setMapLayers] = useState({ drones: true, guards: true, blindSpots: true });

  const [alerts, setAlerts] = useState<Incident[]>([
    {
      id: 'ALT-01',
      severity: 'CRITICAL',
      threat: ThreatType.HUMAN,
      title: 'Motion Detected',
      location: 'Storage Area B (North)',
      slaLimit: 300,
      elapsed: 6,
      status: 'Investigating',
      assignedTo: 'Sentinel-1',
      assignmentStatus: 'En route',
      eta: '01:30',
      timestamp: '2m ago',
      confidence: 92,
      priority: 'P1',
      respondedBy: 'Isabelle M.',
      responseTime: 'N/A',
      timeline: []
    },
    {
      id: 'ALT-02',
      severity: 'HIGH',
      threat: ThreatType.SENSOR,
      title: 'Signal Degradation',
      location: 'Watcher-3 @ Richelieu',
      slaLimit: 600,
      elapsed: 45,
      status: 'Investigating',
      assignedTo: 'None',
      assignmentStatus: 'Queued',
      eta: '03:00',
      timestamp: '12m ago',
      confidence: 41,
      priority: 'P2',
      isLikelyFalseAlarm: true,
      respondedBy: 'System',
      responseTime: 'N/A',
      timeline: []
    },
    {
      id: 'ALT-03',
      severity: 'MEDIUM',
      threat: ThreatType.ENVIRONMENTAL,
      title: 'Temp Spike',
      location: 'Server Room 4',
      slaLimit: 300,
      elapsed: 180,
      status: 'Investigating',
      assignedTo: 'None',
      assignmentStatus: 'Queued',
      eta: '04:15',
      timestamp: '15m ago',
      confidence: 68,
      priority: 'P3',
      respondedBy: 'System',
      responseTime: 'N/A',
      timeline: []
    }
  ]);

  const guards: Guard[] = [
    { id: 'G-01', name: 'Pierre L.', location: 'Sector 4', status: 'Patrolling', assignment: 'Perimeter B' },
    { id: 'G-02', name: 'Sarah J.', location: 'Main Gate', status: 'Stationary', assignment: 'Check-in' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setAlerts(prev => prev.map(a => ({ ...a, elapsed: a.elapsed + 1 })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredAlerts = useMemo(() => {
    const filtered = alerts.filter(a => {
      const sevMatch = severityFilter === 'All' || a.severity === severityFilter.toUpperCase();
      const threatMatch = threatFilter === 'All' || a.threat === threatFilter.toUpperCase();
      return sevMatch && threatMatch;
    });

    return [...filtered].sort((a, b) => {
      const pMap: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
      const priorityDiff = (pMap[a.priority || 'P4'] || 4) - (pMap[b.priority || 'P4'] || 4);
      if (priorityDiff !== 0) return priorityDiff;
      return b.elapsed - a.elapsed;
    });
  }, [alerts, severityFilter, threatFilter]);

  const isMultiIncidentMode = useMemo(() => {
    const highAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
    return highAlerts >= 2;
  }, [alerts]);

  const hasP1Active = useMemo(() => {
    return alerts.some(a => a.priority === 'P1');
  }, [alerts]);

  const getSlaUrgency = (a: Incident) => {
    const remaining = a.slaLimit - a.elapsed;
    const ratio = remaining / a.slaLimit;
    if (ratio < 0) return 'text-danger animate-pulse font-black';
    if (ratio < 0.2) return 'text-danger animate-pulse';
    if (ratio < 0.5) return 'text-warning';
    return 'text-success';
  };

  const formatSla = (a: Incident) => {
    const remaining = Math.max(0, a.slaLimit - a.elapsed);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPriorityBadgeStyles = (priority?: string) => {
    switch(priority) {
      case 'P1': return 'bg-[#FF4B4B] text-white';
      case 'P2': return 'bg-[#FF9F43] text-black';
      case 'P3': return 'bg-[#FFC857] text-black';
      case 'P4': return 'bg-[#2ECC71]/20 text-[#2ECC71]';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getSeverityColors = (sev: string) => {
    switch(sev) {
      case 'CRITICAL': return { text: 'text-[#FF4B4B]', border: 'border-[#FF4B4B]' };
      case 'HIGH': return { text: 'text-[#FF9F43]', border: 'border-[#FF9F43]' };
      case 'MEDIUM': return { text: 'text-[#FFC857]', border: 'border-[#FFC857]' };
      case 'LOW': return { text: 'text-[#2ECC71]', border: 'border-[#2ECC71]' };
      default: return { text: 'text-gray-400', border: 'border-white/10' };
    }
  };

  const renderConfidence = (conf?: number) => {
    if (conf === undefined) return null;
    let color = 'text-[#FF4B4B]';
    if (conf >= 80) color = 'text-[#2ECC71]';
    else if (conf >= 50) color = 'text-[#FFC857]';
    
    return (
      <span className={`${color} flex items-center gap-1 justify-end`}>
        Conf: {conf}%
        {conf < 50 && <span className="ml-1 opacity-70">- Potential false</span>}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-5 h-full overflow-hidden p-1 relative">
      
      {/* LEFT COLUMN: Controls & Alerts */}
      <div className="col-span-3 flex flex-col gap-5 h-full min-h-0">
        <div className="bg-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-gray-200 uppercase tracking-[0.15em]">Tactical Controls</h3>
            <span className="material-symbols-outlined text-[18px] text-gray-500 cursor-pointer hover:text-white transition-colors">tune</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select 
                value={severityFilter} 
                onChange={e => setSeverityFilter(e.target.value)}
                className="w-full appearance-none bg-[#0b0e14] text-[11px] text-gray-300 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option>Severity: All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-sm">expand_more</span>
            </div>
            <div className="relative">
              <select 
                value={threatFilter}
                onChange={e => setThreatFilter(e.target.value)}
                className="w-full appearance-none bg-[#0b0e14] text-[11px] text-gray-300 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option>Threat: All</option>
                <option>Human</option>
                <option>Environmental</option>
                <option>Sensor</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 py-4 bg-background/50 rounded-2xl border border-white/5">
            {[
              { label: 'ACTIVE', count: 3, color: 'text-primary' },
              { label: 'IDLE', count: 2, color: 'text-gray-400' },
              { label: 'CHRG', count: 1, color: 'text-warning' },
              { label: 'FAULT', count: 0, color: 'text-danger' }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-white leading-none">{stat.count}</span>
                <span className={`text-[8px] font-bold mt-1.5 uppercase tracking-widest ${stat.color}`}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-panel border border-white/5 rounded-2xl flex-1 p-5 flex flex-col gap-4 min-h-0 shadow-sm overflow-hidden relative">
          {isMultiIncidentMode && (
            <div className="absolute top-0 left-0 right-0 z-20 bg-[#FF4B4B]/10 border-b border-[#FF4B4B]/20 p-2 text-center animate-in slide-in-from-top duration-300">
              <p className="text-[9px] font-bold text-[#FF4B4B] uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[14px]">priority_high</span>
                Multi-incident mode active
              </p>
            </div>
          )}

          <div className={`flex flex-col gap-4 h-full pt-${isMultiIncidentMode ? '10' : '0'}`}>
            <div className="flex items-center justify-between mb-1 shrink-0 px-1">
              <div className="flex items-center gap-3">
                <h3 className="text-[11px] font-bold text-gray-200 uppercase tracking-widest">Live Alerts</h3>
                <span className="size-1.5 rounded-full bg-danger animate-pulse"></span>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredAlerts.length} Units</span>
            </div>

            {hasP1Active && (
              <div className="px-1 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-1 flex items-center justify-between">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest px-2">Pause routine patrols?</span>
                <div className="flex gap-2 pr-2">
                  <button onClick={() => setPatrolsPaused(true)} className={`px-3 py-1 rounded text-[8px] font-black uppercase ${patrolsPaused ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500'}`}>Pause</button>
                  <button onClick={() => setPatrolsPaused(false)} className={`px-3 py-1 rounded text-[8px] font-black uppercase ${!patrolsPaused ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-500'}`}>Running</button>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
              {filteredAlerts.map((alert) => {
                const { text: sevText, border: sevBorder } = getSeverityColors(alert.severity);
                return (
                  <div 
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`bg-[#0b0e14] border-l-[3px] rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden shrink-0 ${
                      selectedAlertId === alert.id ? `ring-1 ring-primary/30 bg-primary/5 ${sevBorder}/60` : `hover:bg-white/5 ${sevBorder}/30`
                    } ${sevBorder}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`${getPriorityBadgeStyles(alert.priority)} text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest`}>{alert.priority}</span>
                          <span className={`${sevText} text-[9px] font-bold uppercase tracking-[0.15em]`}>{alert.severity}</span>
                        </div>
                        <span className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-bold text-gray-500 border border-white/5 uppercase w-fit">{alert.threat}</span>
                      </div>
                      <div className="text-right text-[10px] font-mono font-bold uppercase tracking-tighter leading-tight">
                        <div className={getSlaUrgency(alert)}>SLA: {formatSla(alert)}</div>
                        <div className="mt-1">{renderConfidence(alert.confidence)}</div>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-0.5 tracking-tight">{alert.title}</h4>
                    <p className="text-[10px] text-gray-500 mb-1 font-medium">{alert.location}</p>
                    <div className="flex items-center justify-between text-[11px] border-t border-white/5 pt-2 mt-1">
                      <span className="text-primary font-bold uppercase tracking-tight flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                        {alert.assignedTo || 'Unassigned'}
                      </span>
                      <span className="text-gray-600 font-medium">{alert.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: Map - Internal Museum View */}
      <div className="col-span-6 flex flex-col gap-5 relative h-full min-h-0 overflow-hidden">
        <div className="relative flex-1 bg-panel rounded-2xl overflow-hidden border border-white/5 group shadow-inner">
          
          {/* Dynamic Map Background */}
          {mapMode === '2D' ? (
            <div className="absolute inset-0 bg-[#0b0e14] flex items-center justify-center p-8 overflow-hidden">
              {/* Technical Grid Blueprint */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              <svg className="w-full h-full text-primary/30" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 50 H750 V450 H50 Z" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5"/>
                <path d="M200 50 V450 M400 50 V450 M600 50 V450 M50 200 H750 M50 300 H750" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2"/>
                
                {/* Detailed Hall Outlines */}
                <g className="text-primary/10">
                  <rect x="70" y="70" width="120" height="110" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="130" y="125" textAnchor="middle" fill="currentColor" className="text-[10px] font-bold opacity-40">DENON HALL</text>
                  
                  <rect x="250" y="70" width="300" height="200" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="400" y="170" textAnchor="middle" fill="currentColor" className="text-[10px] font-bold opacity-40">SULLY COURTYARD</text>
                  
                  <rect x="620" y="70" width="110" height="110" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="675" y="125" textAnchor="middle" fill="currentColor" className="text-[10px] font-bold opacity-40">RICHELIEU</text>
                  
                  <rect x="70" y="320" width="300" height="110" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="220" y="375" textAnchor="middle" fill="currentColor" className="text-[10px] font-bold opacity-40">STORAGE WING A</text>
                </g>
                
                <circle cx="400" cy="250" r="100" stroke="currentColor" strokeDasharray="5 5" strokeOpacity="0.3" />
              </svg>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
               {/* Simulated Internal 3D View (Fisheye/Perspective) */}
               <img 
                 className={`w-full h-full object-cover transition-all duration-700 scale-110 ${viewMode === 'thermal' ? 'brightness-125 hue-rotate-180 invert' : 'opacity-60 grayscale'}`} 
                 src="https://images.unsplash.com/photo-1544641974-98c49539304f?auto=format&fit=crop&q=80&w=1200" 
                 alt="Internal Gallery View" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
               
               {/* HUD Overlays for 3D Drone View */}
               <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between z-10">
                  <div className="flex justify-between border-t-2 border-primary/20 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-primary font-bold">MODE: PERSPECTIVE_INT</span>
                      <span className="text-[9px] font-mono text-primary font-bold">LENS: 14MM_FISHEYE</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-mono text-primary font-bold">LAT: 48.8606° N</span>
                      <span className="text-[9px] font-mono text-primary font-bold">LON: 2.3376° E</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative size-48 flex items-center justify-center">
                       <div className="absolute inset-0 border border-primary/10 rounded-full animate-pulse"></div>
                       <div className="w-24 h-px bg-primary/40"></div>
                       <div className="h-24 w-px bg-primary/40 absolute"></div>
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[8px] font-mono text-primary/60">0°</div>
                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-[8px] font-mono text-primary/60">180°</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-b-2 border-primary/20 pb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-widest">Signal Locked</span>
                      <span className="text-[12px] font-mono text-primary font-bold">042° NW</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-widest">Stabilized</span>
                      <span className="text-[12px] font-mono text-primary font-bold">AGL 3.2M</span>
                    </div>
                  </div>
               </div>
               
               {/* Scanning Line Effect */}
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-20 w-full animate-scan pointer-events-none"></div>
            </div>
          )}

          {/* Toggle Controls */}
          <div className="absolute top-5 left-5 flex gap-0.5 bg-[#0b0e14]/90 backdrop-blur-md border border-white/10 p-1 rounded-xl z-30 shadow-2xl">
            <button onClick={() => setMapMode('2D')} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${mapMode === '2D' ? 'bg-primary/20 text-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}>2D</button>
            <button onClick={() => setMapMode('3D')} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${mapMode === '3D' ? 'bg-primary/20 text-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}>3D</button>
          </div>

          <div className="absolute top-5 right-5 flex flex-col gap-2 z-30">
             <button className="size-10 rounded-xl flex items-center justify-center bg-[#0b0e14]/90 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl">
               <span className="material-symbols-outlined text-[20px]">layers</span>
             </button>
             <button 
              onClick={() => setViewMode(viewMode === 'thermal' ? 'default' : 'thermal')}
              className={`size-10 rounded-xl flex items-center justify-center bg-[#0b0e14]/90 backdrop-blur-md border transition-all shadow-xl ${
                viewMode === 'thermal' ? 'border-orange-500/50 text-orange-400' : 'border-white/10 text-gray-400'
              }`}
            >
               <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
             </button>
          </div>

          {/* Markers */}
          {mapLayers.drones && (
             <div className="absolute top-[35%] left-[40%] z-20 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110">
                <span className="material-symbols-outlined text-primary text-2xl rotate-45 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">flight</span>
                <div className="bg-[#0b0e14]/95 backdrop-blur-md border border-white/10 rounded-lg p-2 mt-2 shadow-2xl scale-0 group-hover:scale-100 transition-transform origin-top min-w-[120px]">
                   <p className="text-[9px] font-black text-white uppercase truncate tracking-widest">Sentinel-1</p>
                   <p className="text-[8px] text-primary font-bold mt-0.5 uppercase tracking-tighter">Status: MISSION_ACTIVE</p>
                </div>
             </div>
          )}

          {/* Incident Overlay Markers */}
          {filteredAlerts.map((alert, i) => {
             const coords = [{ t: '25%', l: '65%' }, { t: '15%', l: '25%' }, { t: '65%', l: '75%' }][i] || { t: '50%', l: '50%' };
             return (
               <div key={alert.id} className="absolute z-20 group transition-all" style={{ top: coords.t, left: coords.l }}>
                 <div className={`size-4 rounded-full border-2 bg-black animate-ping absolute -top-2 -left-2 ${alert.priority === 'P1' ? 'border-[#FF4B4B]' : 'border-primary'}`}></div>
                 <span className={`material-symbols-outlined text-2xl drop-shadow-lg ${alert.priority === 'P1' ? 'text-[#FF4B4B]' : 'text-primary'}`}>location_on</span>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0b0e14]/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl min-w-[140px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] font-black text-white uppercase bg-danger/10 px-2 py-0.5 rounded w-fit mb-1">{alert.priority}</p>
                    <p className="text-[10px] font-bold text-gray-200">{alert.title}</p>
                 </div>
               </div>
             );
          })}
        </div>

        {/* Live Logs / Tabs */}
        <div className="h-44 bg-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-sm shrink-0">
          <div className="flex items-center gap-8 border-b border-white/5 pb-3">
            {['feed', 'status', 'patrols', 'guards'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
              >
                {tab === 'feed' ? 'Live Feed' : tab === 'status' ? 'Drone Status' : tab === 'patrols' ? 'Patrols' : 'Guards'}
                {activeTab === tab && <div className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-[#0b0e14]/50 rounded-xl border border-white/5 p-4 overflow-y-auto custom-scrollbar">
            <div className="flex gap-4 text-[10px] items-start">
              <span className="text-gray-600 font-mono pt-0.5">14:22:01</span>
              <div className="flex flex-col gap-1">
                <span className="text-primary font-bold uppercase tracking-widest">[SENTINEL-1]</span>
                <span className="text-gray-400">Lock established at Waypoint 4. Perimeter scan engaged.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Readiness */}
      <div className="col-span-3 flex flex-col gap-5 h-full min-h-0">
        <div className="bg-panel border border-white/5 rounded-2xl p-6 flex flex-col shadow-sm shrink-0">
          <h3 className="text-[11px] font-bold text-gray-200 uppercase tracking-[0.15em] mb-6">Readiness Overview</h3>
          <div className="flex flex-col gap-7">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">Network Mesh</span>
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest">Stable</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">Fleet Battery Avg</span>
              <span className="text-lg font-display font-bold text-white tracking-tight">84%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium leading-tight">Coverage Gaps</span>
              <div className="text-right">
                <span className="text-lg font-display font-bold text-warning tracking-tight block">1</span>
                <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Sector B</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-sm flex-1 min-h-0 overflow-hidden">
          <h3 className="text-[11px] font-bold text-gray-200 uppercase tracking-[0.15em] shrink-0">Connected Systems</h3>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-col gap-3">
              {[
                { icon: 'videocam', name: 'CCTV Network', desc: '142/145 Online', status: 'ok' },
                { icon: 'sensors', name: 'Motion Sensors', desc: 'Zone B Triggered', status: 'warn' },
                { icon: 'lock', name: 'Access Control', desc: 'All Gates Secure', status: 'ok' }
              ].map((sys, i) => (
                <div key={i} className="bg-[#0b0e14] border border-white/5 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-white/10 group">
                  <div className={`size-10 rounded-xl flex items-center justify-center bg-background border border-white/5 ${sys.status === 'warn' ? 'text-warning' : 'text-gray-500 group-hover:text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px]">{sys.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white mb-0.5">{sys.name}</h4>
                    <p className={`text-[9px] font-bold uppercase tracking-widest ${sys.status === 'warn' ? 'text-warning' : 'text-gray-500'}`}>{sys.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0 pt-2 pb-1">
          <button onClick={() => navigate('/fleet')} className="w-full bg-primary hover:bg-primary/90 transition-all text-black font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/10">Deploy Drone</button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/patrols')} className="bg-[#1e293b] text-white font-bold py-3 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Patrols</button>
            <button onClick={() => setShowShiftHandover(true)} className="bg-indigo-600/90 text-white font-bold py-3 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">Handover</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
