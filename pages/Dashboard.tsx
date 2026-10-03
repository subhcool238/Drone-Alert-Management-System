
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Button from '../components/Button';
import MuseumPlan, { PlanMarker, LegendItem } from '../components/MuseumPlan';
import { clickableProps } from '../components/a11y';
import { useNavigate } from 'react-router-dom';
import { Guard, FleetStatus } from '../types';
import { DRONES, STATUS_LABEL, countByStatus, getFleetBatteryAvg } from '../data/drones';
import { placeAt } from '../data/plan';
import { COVERAGE_GAP, PATROL_ROUTES, ROUTE_WAYPOINTS, getCoverageGapCount } from '../data/patrols';
import { COLORS } from '../data/theme';
import { formatScenarioTime, formatAgo } from '../data/clock';
import { getOpenIncidents, getElapsed, getSlaState, useSecondsSinceLoad, formatSla, getSlaUrgency } from '../data/incidents';

// Spoken form of the SLA colour, so the urgency is not carried by colour alone
const slaUrgencyWord = (cls: string): string =>
  cls.includes('danger') ? ' remaining, critical' : cls.includes('warning') ? ' remaining, warning' : ' remaining';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'status' | 'patrols' | 'guards'>('feed');
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');

  const [viewMode, setViewMode] = useState<'default' | 'thermal'>('default');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('INC-2025-082');
  const [showShiftHandover, setShowShiftHandover] = useState(false);
  const [patrolsPaused, setPatrolsPaused] = useState(false);
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  
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

  // Markers on the museum plan: every drone by status, and the open incidents shown in the live alerts list
  const DRONE_MARKER: Record<FleetStatus, { tone: PlanMarker['tone']; icon: string }> = {
    [FleetStatus.ACTIVE]: { tone: 'active', icon: 'flight' },
    [FleetStatus.IDLE]: { tone: 'idle', icon: 'dock' },
    [FleetStatus.CHARGING]: { tone: 'charging', icon: 'battery_charging_full' },
    [FleetStatus.FAULT]: { tone: 'fault', icon: 'warning' }
  };
  const planMarkers: PlanMarker[] = [
    ...DRONES.map(d => ({
      id: d.id,
      kind: 'drone' as const,
      x: d.x, y: d.y, altitude: d.altitude,
      label: d.name,
      icon: DRONE_MARKER[d.status].icon,
      tone: DRONE_MARKER[d.status].tone,
      ariaLabel: `${d.name}, ${STATUS_LABEL[d.status]}, ${d.battery} percent battery, ${placeAt(d.x, d.y)}`,
      selected: selectedDroneId === d.id,
      labelSide: (d.name === 'Watcher-3' || d.name === 'Surveyor-X' || d.name === 'Sentinel-1' ? 'right' : 'below') as 'right' | 'below',
      onSelect: () => setSelectedDroneId(d.id)
    })),
    ...filteredAlerts.map(a => ({
      id: a.id,
      kind: 'incident' as const,
      x: a.x ?? 50, y: a.y ?? 50,
      label: a.id,
      badge: a.priority,
      tone: (a.priority ? a.priority.toLowerCase() : 'p4') as PlanMarker['tone'],
      ariaLabel: `${a.id}, ${a.priority}, ${a.severity.charAt(0) + a.severity.slice(1).toLowerCase()}, ${a.title}, ${a.location}`,
      pulse: true,
      labelSide: ((a.x ?? 50) > 60 ? 'right' : 'below') as 'right' | 'below',
      selected: selectedAlertId === a.id,
      onSelect: () => setSelectedAlertId(a.id)
    }))
  ];
  const perimeterRoute = { name: PATROL_ROUTES[0].name, points: ROUTE_WAYPOINTS[PATROL_ROUTES[0].id] };
  const planLegend: LegendItem[] = [
    { label: 'Active', swatch: { icon: 'flight', className: 'text-primary' } },
    { label: 'Idle (dock)', swatch: { icon: 'dock', className: 'text-gray-200' } },
    { label: 'Charging', swatch: { icon: 'battery_charging_full', className: 'text-caution' } },
    { label: 'Fault', swatch: { icon: 'warning', className: 'text-danger-light' } },
    { label: 'Incident P1 P2 P3', swatch: { boxes: ['bg-danger-strong', 'bg-warning', 'bg-caution'] } },
    { label: 'Coverage gap', swatch: 'hatch' },
    { label: 'Perimeter Alpha', swatch: 'dash' }
  ];

  return (
    <div className="grid grid-cols-12 gap-5 h-full overflow-hidden p-1 relative">
      
      {/* LEFT COLUMN: Controls & Alerts */}
      <div className="col-span-3 flex flex-col gap-5 h-full min-h-0">
        <div className="bg-panel border border-white/5 rounded-2xl p-4 flex flex-col gap-5 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-[0.1em]">Tactical Controls</h2>
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-text-muted cursor-pointer hover:text-white transition-colors">tune</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select 
                aria-label="Filter alerts by severity"
                value={severityFilter} 
                onChange={e => setSeverityFilter(e.target.value)}
                className="w-full appearance-none bg-background text-xs text-gray-300 border border-white/10 rounded-xl pl-2.5 pr-7 py-2.5 tracking-tight outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option value="All">Severity: All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>
              <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm">expand_more</span>
            </div>
            <div className="relative">
              <select 
                aria-label="Filter alerts by threat type"
                value={threatFilter}
                onChange={e => setThreatFilter(e.target.value)}
                className="w-full appearance-none bg-background text-xs text-gray-300 border border-white/10 rounded-xl pl-2.5 pr-7 py-2.5 tracking-tight outline-none focus:border-primary/50 transition-all cursor-pointer"
              >
                <option value="All">Threat: All</option>
                <option>Human</option>
                <option>Environmental</option>
                <option>Sensor</option>
              </select>
              <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm">expand_more</span>
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
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">priority_high</span>
                Multi-incident mode active
              </p>
            </div>
          )}

          <div className={`flex flex-col gap-4 h-full pt-${isMultiIncidentMode ? '10' : '0'}`}>
            <div className="flex items-center justify-between mb-1 shrink-0 px-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Live Alerts</h2>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-danger animate-pulse"></span>
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{filteredAlerts.length} Units</span>
            </div>

            {hasP1Active && (
              <div className="px-1 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider px-2">Pause routine patrols?</span>
                <div className="flex gap-2 px-2">
                  <Button variant="segment" aria-pressed={patrolsPaused} onClick={() => setPatrolsPaused(true)} className={`px-3 py-1 text-xs font-black uppercase ${patrolsPaused ? 'bg-indigo-600 text-white' : 'bg-white/5 text-text-muted'}`}>Pause</Button>
                  <Button variant="segment" aria-pressed={!patrolsPaused} onClick={() => setPatrolsPaused(false)} className={`px-3 py-1 text-xs font-black uppercase ${!patrolsPaused ? 'bg-indigo-600 text-white' : 'bg-white/5 text-text-muted'}`}>Running</Button>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
              {filteredAlerts.map((alert) => {
                const { text: sevText, border: sevBorder } = getSeverityColors(alert.severity);
                return (
                  <div 
                    key={alert.id}
                    {...clickableProps(() => setSelectedAlertId(alert.id))}
                    aria-pressed={selectedAlertId === alert.id}
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
                          <div className={getSlaUrgency(alert)}>SLA: {formatSla(alert)}<span className="sr-only">{slaUrgencyWord(getSlaUrgency(alert))}</span></div>
                        )}
                        <div className="mt-1">{renderConfidence(alert.confidence)}</div>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-0.5 tracking-tight">{alert.title}</h3>
                    <p className="text-xs text-text-muted mb-1 font-medium">{alert.location}</p>
                    <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2 mt-1">
                      <span className="text-primary font-bold uppercase tracking-tight flex items-center gap-1.5">
                        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">reply</span>
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
          
          {/* Dynamic Map Background: the shared museum plan, flat (2D) or isometric (3D) */}
          {mapMode === '2D' ? (
            <div className="absolute inset-0 bg-background overflow-hidden">
              {/* Technical Grid Blueprint */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              <MuseumPlan mode="2D" markers={planMarkers} route={perimeterRoute} legend={planLegend} />
            </div>
          ) : (
            <div className="absolute inset-0 bg-black overflow-hidden">
              <MuseumPlan
                mode="3D"
                rotatable
                markers={planMarkers}
                route={perimeterRoute}
                legend={planLegend}
                drawingClassName={`transition-all duration-700 ${viewMode === 'thermal' ? 'brightness-125 hue-rotate-180 invert' : ''}`}
              />
               
            </div>
          )}

          {/* Toggle Controls */}
          <div className="absolute top-5 left-5 flex gap-0.5 bg-background border border-white/10 p-1 rounded-xl z-30 shadow-2xl">
            <Button variant="segment" aria-pressed={mapMode === '2D'} onClick={() => setMapMode('2D')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${mapMode === '2D' ? 'bg-primary/20 text-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}>2D</Button>
            <Button variant="segment" aria-pressed={mapMode === '3D'} onClick={() => setMapMode('3D')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${mapMode === '3D' ? 'bg-primary/20 text-primary shadow-inner' : 'text-gray-400 hover:text-white'}`}>3D</Button>
          </div>

          <div className="absolute top-5 right-5 flex flex-col gap-2 z-30">
             <Button variant="icon" aria-label="Map layers" className="size-10 bg-background/90 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white shadow-xl">
               <span aria-hidden="true" className="material-symbols-outlined text-[20px]">layers</span>
             </Button>
             <Button variant="icon" aria-label="Thermal view" aria-pressed={viewMode === 'thermal'} 
 onClick={() => setViewMode(viewMode === 'thermal' ? 'default' : 'thermal')}
 className={`size-10 bg-background/90 backdrop-blur-md border shadow-xl ${ viewMode === 'thermal' ? 'border-orange-500/50 text-orange-400' : 'border-white/10 text-gray-400' }`}>
               <span aria-hidden="true" className="material-symbols-outlined text-[20px]">local_fire_department</span>
             </Button>
          </div>

        </div>

        {/* Live Logs / Tabs */}
        <div className="h-44 bg-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-sm shrink-0">
          <div className="flex items-center gap-8 border-b border-white/5 pb-3">
            {['feed', 'status', 'patrols', 'guards'].map((tab) => (
              <Button variant="bare" 
 key={tab}
 aria-pressed={activeTab === tab}
 onClick={() => setActiveTab(tab as any)}
 className={`inline-flex items-center min-h-[24px] text-xs font-bold uppercase tracking-wider relative ${activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-white'}`}>
                {tab === 'feed' ? 'Live Feed' : tab === 'status' ? 'Drone Status' : tab === 'patrols' ? 'Patrols' : 'Guards'}
                {activeTab === tab && <div className="absolute -bottom-[9px] left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>}
              </Button>
            ))}
          </div>
          <div tabIndex={0} role="region" aria-label="Live feed log" className="flex-1 bg-background/50 rounded-xl border border-white/5 p-4 overflow-y-auto custom-scrollbar">
            <div className="flex gap-4 text-xs items-start">
              <span className="text-text-muted font-mono pt-0.5"><span className="sr-only">Scenario time </span>{scenarioClock}</span>
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
          <h2 className="text-xs font-bold text-gray-200 uppercase tracking-[0.1em] mb-6">Readiness Overview</h2>
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
          <h2 className="text-xs font-bold text-gray-200 uppercase tracking-[0.1em] shrink-0">Connected Systems</h2>
          <div tabIndex={0} role="region" aria-label="Connected systems list" className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-col gap-3">
              {[
                { icon: 'videocam', name: 'CCTV Network', desc: '142/145 Online', status: 'ok' },
                { icon: 'sensors', name: 'Motion Sensors', desc: 'Zone B Triggered', status: 'warn' },
                { icon: 'lock', name: 'Access Control', desc: 'All Gates Secure', status: 'ok' }
              ].map((sys, i) => (
                <div key={i} className="bg-background border border-white/5 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-white/10 group">
                  <div className={`size-10 rounded-xl flex items-center justify-center bg-background border border-white/5 ${sys.status === 'warn' ? 'text-warning' : 'text-text-muted group-hover:text-primary'}`}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{sys.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-white mb-0.5">{sys.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-wider ${sys.status === 'warn' ? 'text-warning' : 'text-text-muted'}`}>{sys.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0 pt-2 pb-1">
          <Button variant="primary" onClick={() => navigate('/fleet')} className="w-full font-bold py-4 text-xs uppercase tracking-widest shadow-xl shadow-primary/10">Deploy Drone</Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => navigate('/patrols')} className="bg-slate-800 text-white font-bold py-3 text-xs uppercase tracking-wider hover:bg-white/10">Patrols</Button>
            <Button variant="indigo" onClick={() => setShowShiftHandover(true)} className="font-bold py-3 border border-white/10 text-xs uppercase tracking-wider">Handover</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
