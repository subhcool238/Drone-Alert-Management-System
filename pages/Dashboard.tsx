
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Guard, FleetStatus } from '../types';
import { countByStatus, getFleetBatteryAvg } from '../data/drones';
import { COVERAGE_GAP, getCoverageGapCount } from '../data/patrols';
import { COLORS } from '../data/theme';
import { formatScenarioTime, formatAgo } from '../data/clock';
import { getOpenIncidents, getElapsed, getSlaState, useSecondsSinceLoad, formatSla, getSlaUrgency } from '../data/incidents';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'status' | 'patrols' | 'guards'>('feed');
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');

  // The 2D map is an SVG scaled to its box. Measure the scale so the room labels render at a
  // readable 12px on screen whatever the window size (label size in SVG units = 12.5px / scale).
  const mapSvgRef = useRef<SVGSVGElement>(null);
  const [mapScale, setMapScale] = useState(0.85);
  useEffect(() => {
    const svg = mapSvgRef.current;
    if (mapMode !== '2D' || !svg) return;
    const update = () => {
      const r = svg.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setMapScale(Math.min(r.width / 800, r.height / 500));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(svg);
    return () => ro.disconnect();
  }, [mapMode]);
  const mapLabelSize = Math.ceil(12.5 / mapScale);
  const [viewMode, setViewMode] = useState<'default' | 'thermal'>('default');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('INC-2025-082');
  const [showShiftHandover, setShowShiftHandover] = useState(false);
  const [patrolsPaused, setPatrolsPaused] = useState(false);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('All');
  const [threatFilter, setThreatFilter] = useState('All');
  const [mapLayers, setMapLayers] = useState({ drones: true, guards: true, blindSpots: true });

  // Live alerts are the open incidents from the shared list, with live SLA clocks
  const secondsSinceLoad = useSecondsSinceLoad();
  const scenarioClock = formatScenarioTime(secondsSinceLoad);
  const alerts = useMemo(
    () => getOpenIncidents().map(i => ({ ...i, elapsed: getElapsed(i, secondsSinceLoad), sla: getSlaState(i, secondsSinceLoad) })),
    [secondsSinceLoad]
  );

  const guards: Guard[] = [
    { id: 'G-01', name: 'Pierre L.', location: 'Sector 4', status: 'Patrolling', assignment: 'Perimeter B' },
    { id: 'G-02', name: 'Sarah J.', location: 'Main Gate', status: 'Stationary', assignment: 'Check-in' }
  ];

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

  const getPriorityBadgeStyles = (priority?: string) => {
    switch(priority) {
      case 'P1': return 'bg-danger-strong text-white';
      case 'P2': return 'bg-warning text-black';
      case 'P3': return 'bg-caution text-black';
      case 'P4': return 'bg-success/20 text-success';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getSeverityColors = (sev: string) => {
    switch(sev) {
      case 'CRITICAL': return { text: 'text-danger-light', border: 'border-danger' };
      case 'HIGH': return { text: 'text-warning', border: 'border-warning' };
      case 'MEDIUM': return { text: 'text-caution', border: 'border-caution' };
      case 'LOW': return { text: 'text-success', border: 'border-success' };
      default: return { text: 'text-gray-400', border: 'border-white/10' };
    }
  };

  const renderConfidence = (conf?: number) => {
    if (conf === undefined) return null;
    let color = 'text-danger-light';
    if (conf >= 80) color = 'text-success';
    else if (conf >= 50) color = 'text-caution';
    
    return (
      <span className={`${color} flex flex-wrap items-center gap-x-1 justify-end text-right`}>
        Conf: {conf}%
        {conf < 50 && <span className="whitespace-nowrap">- Potential false</span>}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-5 h-full overflow-hidden p-1 relative">
      
      {/* LEFT COLUMN: Controls & Alerts */}
      <div className="col-span-3 flex flex-col gap-5 h-full min-h-0">
        <div className="bg-panel border border-white/5 rounded-2xl p-4 flex flex-col gap-5 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-[0.1em]">Tactical Controls</h3>
            <span className="material-symbols-outlined text-[18px] text-text-muted cursor-pointer hover:text-white transition-colors">tune</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select 
                value={severityFilter} 
                onChange={e => setSeverityFilter(e.target.value)}
                className="w-full appearance-none bg-background text-xs text-gray-300 border border-white/10 rounded-xl pl-2.5 pr-7 py-2.5 tracking-tight outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option>Severity: All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm">expand_more</span>
            </div>
            <div className="relative">
              <select 
                value={threatFilter}
                onChange={e => setThreatFilter(e.target.value)}
                className="w-full appearance-none bg-background text-xs text-gray-300 border border-white/10 rounded-xl pl-2.5 pr-7 py-2.5 tracking-tight outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option>Threat: All</option>
                <option>Human</option>
                <option>Environmental</option>
                <option>Sensor</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 py-4 bg-background/50 rounded-2xl border border-white/5">
            {[
              { label: 'ACTIVE', count: countByStatus(FleetStatus.ACTIVE), color: 'text-primary' },
              { label: 'IDLE', count: countByStatus(FleetStatus.IDLE), color: 'text-gray-400' },
              { label: 'CHRG', count: countByStatus(FleetStatus.CHARGING), color: 'text-warning' },
              { label: 'FAULT', count: countByStatus(FleetStatus.FAULT), color: 'text-danger-light' }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-white leading-none">{stat.count}</span>
                <span className={`text-xs font-bold mt-1.5 uppercase tracking-wider ${stat.color}`}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-panel border border-white/5 rounded-2xl flex-1 p-5 flex flex-col gap-4 min-h-0 shadow-sm overflow-hidden relative">
          {isMultiIncidentMode && (
            <div className="absolute top-0 left-0 right-0 z-20 bg-danger/10 border-b border-danger/20 p-2 text-center animate-in slide-in-from-top duration-300">
              <p className="text-xs font-bold text-danger-light uppercase tracking-wider flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[14px]">priority_high</span>
                Multi-incident mode active
              </p>
            </div>
          )}

          <div className={`flex flex-col gap-4 h-full pt-${isMultiIncidentMode ? '10' : '0'}`}>
            <div className="flex items-center justify-between mb-1 shrink-0 px-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Live Alerts</h3>
                <span className="size-1.5 rounded-full bg-danger animate-pulse"></span>
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{filteredAlerts.length} Units</span>
            </div>

            {hasP1Active && (
              <div className="px-1 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider px-2">Pause routine patrols?</span>
                <div className="flex gap-2 px-2">
                  <button onClick={() => setPatrolsPaused(true)} className={`px-3 py-1 rounded text-xs font-black uppercase ${patrolsPaused ? 'bg-indigo-600 text-white' : 'bg-white/5 text-text-muted'}`}>Pause</button>
                  <button onClick={() => setPatrolsPaused(false)} className={`px-3 py-1 rounded text-xs font-black uppercase ${!patrolsPaused ? 'bg-indigo-600 text-white' : 'bg-white/5 text-text-muted'}`}>Running</button>
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
                    className={`bg-background border-l-[3px] rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden shrink-0 ${
                      selectedAlertId === alert.id ? `ring-1 ring-primary/30 bg-primary/5 ${sevBorder}/60` : `hover:bg-white/5 ${sevBorder}/30`
                    } ${sevBorder}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`${getPriorityBadgeStyles(alert.priority)} text-xs px-1.5 py-0.5 rounded font-black tracking-wider`}>{alert.priority}</span>
                          <span className={`${sevText} text-xs font-bold uppercase tracking-[0.1em]`}>{alert.severity}</span>
                        </div>
                        <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-bold text-text-muted border border-white/5 uppercase w-fit">{alert.threat}</span>
                      </div>
                      <div className="text-right text-xs font-mono font-bold uppercase tracking-tighter leading-tight">
                        {alert.sla.kind === 'responded' ? (
                          <div className="text-success">Responded in {alert.sla.text}</div>
                        ) : alert.sla.kind === 'breached' ? (
                          <div className="text-danger-light font-bold">Breached</div>
                        ) : (
                          <div className={getSlaUrgency(alert)}>SLA: {formatSla(alert)}</div>
                        )}
                        <div className="mt-1">{renderConfidence(alert.confidence)}</div>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-0.5 tracking-tight">{alert.title}</h4>
                    <p className="text-xs text-text-muted mb-1 font-medium">{alert.location}</p>
                    <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2 mt-1">
                      <span className="text-primary font-bold uppercase tracking-tight flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">reply</span>
                        {alert.assignedTo || 'Unassigned'}
                      </span>
                      <span className="text-text-muted font-medium font-mono">{alert.detectedSecondsBeforeLoad !== undefined ? formatAgo(alert.detectedSecondsBeforeLoad + secondsSinceLoad) : alert.timestamp}</span>
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
            <div className="absolute inset-0 bg-background flex items-center justify-center p-8 overflow-hidden">
              {/* Technical Grid Blueprint */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              <svg ref={mapSvgRef} className="w-full h-full text-primary/30" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 50 H750 V450 H50 Z" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5"/>
                <path d="M200 50 V450 M400 50 V450 M600 50 V450 M50 200 H750 M50 300 H750" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2"/>
                
                {/* Detailed Hall Outlines */}
                <g className="text-primary/10">
                  <rect x="70" y="70" width="120" height="110" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="130" y={70 + mapLabelSize * 1.5} textAnchor="middle" fill={COLORS.textMuted} fontSize={mapLabelSize} fontWeight="bold"><tspan x="130" dy={0}>GRAND</tspan><tspan x="130" dy={mapLabelSize * 1.15}>GALLERY</tspan></text>
                  
                  <rect x="250" y="70" width="300" height="200" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="400" y={70 + mapLabelSize * 1.5} textAnchor="middle" fill={COLORS.textMuted} fontSize={mapLabelSize} fontWeight="bold"><tspan x="400" dy={0}>NORTH</tspan><tspan x="400" dy={mapLabelSize * 1.15}>COURTYARD</tspan></text>
                  
                  <rect x="620" y="70" width="110" height="110" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="675" y={70 + mapLabelSize * 1.5} textAnchor="middle" fill={COLORS.textMuted} fontSize={mapLabelSize} fontWeight="bold"><tspan x="675" dy={0}>EAST</tspan><tspan x="675" dy={mapLabelSize * 1.15}>WING</tspan></text>
                  
                  <rect x="70" y="320" width="300" height="110" stroke="currentColor" fill="currentColor" fillOpacity="0.03" />
                  <text x="220" y={320 + mapLabelSize * 1.5} textAnchor="middle" fill={COLORS.textMuted} fontSize={mapLabelSize} fontWeight="bold"><tspan x="220" dy={0}>STORAGE</tspan><tspan x="220" dy={mapLabelSize * 1.15}>WING A</tspan></text>
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
                      <span className="text-xs font-mono text-primary font-bold">MODE: PERSPECTIVE_INT</span>
                      <span className="text-xs font-mono text-primary font-bold">LENS: 14MM_FISHEYE</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-mono text-primary font-bold">LAT: 48.8606° N</span>
                      <span className="text-xs font-mono text-primary font-bold">LON: 2.3376° E</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative size-48 flex items-center justify-center">
                       <div className="absolute inset-0 border border-primary/10 rounded-full animate-pulse"></div>
                       <div className="w-24 h-px bg-primary/40"></div>
                       <div className="h-24 w-px bg-primary/40 absolute"></div>
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-xs font-mono text-primary/60">0°</div>
                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-xs font-mono text-primary/60">180°</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-b-2 border-primary/20 pb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">Signal Locked</span>
                      <span className="text-[12px] font-mono text-primary font-bold">042° NW</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">Stabilized</span>
                      <span className="text-[12px] font-mono text-primary font-bold">AGL 3.2M</span>
                    </div>
                  </div>
               </div>
               
               {/* Scanning Line Effect */}
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-20 w-full animate-scan pointer-events-none"></div>
            </div>
          )}

          {/* Toggle Controls */}
          <div className="absolute top-5 left-5 flex gap-0.5 bg-background border border-white/10 p-1 rounded-xl z-30 shadow-2xl">
            <button onClick={() => setMapMode('2D')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${mapMode === '2D' ? 'bg-primary/20 text-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}>2D</button>
            <button onClick={() => setMapMode('3D')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${mapMode === '3D' ? 'bg-primary/20 text-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}>3D</button>
          </div>

          <div className="absolute top-5 right-5 flex flex-col gap-2 z-30">
             <button className="size-10 rounded-xl flex items-center justify-center bg-background/90 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl">
               <span className="material-symbols-outlined text-[20px]">layers</span>
             </button>
             <button 
              onClick={() => setViewMode(viewMode === 'thermal' ? 'default' : 'thermal')}
              className={`size-10 rounded-xl flex items-center justify-center bg-background/90 backdrop-blur-md border transition-all shadow-xl ${
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
                <div className="bg-background/95 backdrop-blur-md border border-white/10 rounded-lg p-2 mt-2 shadow-2xl scale-0 group-hover:scale-100 transition-transform origin-top min-w-[120px]">
                   <p className="text-xs font-black text-white uppercase truncate tracking-wider">Sentinel-1</p>
                   <p className="text-xs text-primary font-bold mt-0.5 uppercase tracking-tighter">Status: MISSION_ACTIVE</p>
                </div>
             </div>
          )}

          {/* Incident Overlay Markers */}
          {filteredAlerts.map((alert, i) => {
             const coords = [{ t: '25%', l: '65%' }, { t: '15%', l: '25%' }, { t: '65%', l: '75%' }][i] || { t: '50%', l: '50%' };
             return (
               <div key={alert.id} className="absolute z-20 group transition-all" style={{ top: coords.t, left: coords.l }}>
                 <div className={`size-4 rounded-full border-2 bg-black animate-ping absolute -top-2 -left-2 ${alert.priority === 'P1' ? 'border-danger' : 'border-primary'}`}></div>
                 <span className={`material-symbols-outlined text-2xl drop-shadow-lg ${alert.priority === 'P1' ? 'text-danger-light' : 'text-primary'}`}>location_on</span>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl min-w-[140px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-black text-white uppercase bg-danger/10 px-2 py-0.5 rounded w-fit mb-1">{alert.priority}</p>
                    <p className="text-xs font-bold text-gray-200">{alert.title}</p>
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
                className={`text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-white'}`}
              >
                {tab === 'feed' ? 'Live Feed' : tab === 'status' ? 'Drone Status' : tab === 'patrols' ? 'Patrols' : 'Guards'}
                {activeTab === tab && <div className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-background/50 rounded-xl border border-white/5 p-4 overflow-y-auto custom-scrollbar">
            <div className="flex gap-4 text-xs items-start">
              <span className="text-text-muted font-mono pt-0.5">{scenarioClock}</span>
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
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-[0.1em] mb-6">Readiness Overview</h3>
          <div className="flex flex-col gap-7">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">Network Mesh</span>
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider">Stable</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">Fleet Battery Avg</span>
              <span className="text-lg font-display font-bold text-white tracking-tight">{getFleetBatteryAvg()}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium leading-tight">Coverage Gaps</span>
              <div className="text-right">
                <span className="text-lg font-display font-bold text-warning tracking-tight block">{getCoverageGapCount()}</span>
                <span className="text-xs font-bold text-warning uppercase tracking-wider">{COVERAGE_GAP.zone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-5 shadow-sm flex-1 min-h-0 overflow-hidden">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-[0.1em] shrink-0">Connected Systems</h3>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-col gap-3">
              {[
                { icon: 'videocam', name: 'CCTV Network', desc: '142/145 Online', status: 'ok' },
                { icon: 'sensors', name: 'Motion Sensors', desc: 'Zone B Triggered', status: 'warn' },
                { icon: 'lock', name: 'Access Control', desc: 'All Gates Secure', status: 'ok' }
              ].map((sys, i) => (
                <div key={i} className="bg-background border border-white/5 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-white/10 group">
                  <div className={`size-10 rounded-xl flex items-center justify-center bg-background border border-white/5 ${sys.status === 'warn' ? 'text-warning' : 'text-text-muted group-hover:text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px]">{sys.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white mb-0.5">{sys.name}</h4>
                    <p className={`text-xs font-bold uppercase tracking-wider ${sys.status === 'warn' ? 'text-warning' : 'text-text-muted'}`}>{sys.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0 pt-2 pb-1">
          <button onClick={() => navigate('/fleet')} className="w-full bg-primary hover:bg-primary/90 transition-all text-black font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/10">Deploy Drone</button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/patrols')} className="bg-slate-800 text-white font-bold py-3 rounded-xl border border-white/10 text-xs uppercase tracking-wider hover:bg-white/10 transition-all">Patrols</button>
            <button onClick={() => setShowShiftHandover(true)} className="bg-indigo-600/90 text-white font-bold py-3 rounded-xl border border-white/10 text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all">Handover</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
