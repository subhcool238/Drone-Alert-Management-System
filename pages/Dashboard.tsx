
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
      slaLimit: 30,
      elapsed: 6,
      status: 'Investigating',
      assignedTo: 'Sentinel-1',
      timestamp: '2m ago',
      isLikelyFalseAlarm: false
    },
    {
      id: 'ALT-02',
      severity: 'HIGH',
      threat: ThreatType.SENSOR,
      title: 'Signal Degradation',
      location: 'Watcher-3 @ Richelieu',
      slaLimit: 120,
      elapsed: 45,
      status: 'Investigating',
      assignedTo: 'None',
      timestamp: '12m ago',
      isLikelyFalseAlarm: true
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
      timestamp: '15m ago',
      isLikelyFalseAlarm: false
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
    return alerts.filter(a => {
      const sevMatch = severityFilter === 'All' || a.severity === severityFilter.toUpperCase();
      const threatMatch = threatFilter === 'All' || a.threat === threatFilter.toUpperCase();
      return sevMatch && threatMatch;
    });
  }, [alerts, severityFilter, threatFilter]);

  const getSlaUrgency = (a: Incident) => {
    const remaining = a.slaLimit - a.elapsed;
    const ratio = remaining / a.slaLimit;
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

  return (
    <div className="grid grid-cols-12 gap-5 h-full overflow-hidden p-1 relative">
      
      {/* SHIFT HANDOVER MODAL */}
      {showShiftHandover && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-panel border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Shift Handover Briefing</h2>
                <p className="text-sm text-gray-500 mt-1">Summary for the incoming Shift Commander</p>
              </div>
              <button onClick={() => setShowShiftHandover(false)} className="material-symbols-outlined text-gray-500 hover:text-white">close</button>
            </div>
            <div className="p-8 grid grid-cols-2 gap-8 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Recent Incidents</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex gap-2"><span>•</span> Perimeter breach at 14:02 (Resolved)</li>
                    <li className="flex gap-2"><span>•</span> Sensor fault in Sector 7 (Ongoing)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-warning uppercase tracking-widest mb-3">Maintenance Status</h4>
                  <p className="text-sm text-gray-300">Sentinel-4 is currently docked for lens recalibration. ETA return: 18:00.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-background rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Coverage Gaps</h4>
                  <div className="text-2xl font-display font-bold text-danger">2 Zones</div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase">Richelieu Roof & North Alley</p>
                </div>
              </div>
            </div>
            <div className="p-8 bg-background/50 flex justify-end gap-3">
              <button onClick={() => setShowShiftHandover(false)} className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5">Cancel</button>
              <button onClick={() => setShowShiftHandover(false)} className="px-8 py-2.5 rounded-xl bg-primary text-black text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Sign & Complete</button>
            </div>
          </div>
        </div>
      )}

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
          
          <div className="flex gap-4 px-1">
            <label className="flex items-center gap-2.5 group cursor-pointer">
              <input type="checkbox" checked={mapLayers.drones} onChange={e => setMapLayers({...mapLayers, drones: e.target.checked})} className="size-4 rounded-md bg-[#0b0e14] border-white/10 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer" />
              <span className="text-xs text-gray-300 group-hover:text-white transition-colors font-medium">Drones</span>
            </label>
            <label className="flex items-center gap-2.5 group cursor-pointer">
              <input type="checkbox" checked={mapLayers.guards} onChange={e => setMapLayers({...mapLayers, guards: e.target.checked})} className="size-4 rounded-md bg-[#0b0e14] border-white/10 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer" />
              <span className="text-xs text-gray-300 group-hover:text-white transition-colors font-medium">Guards</span>
            </label>
          </div>
        </div>

        <div className="bg-panel border border-white/5 rounded-2xl flex-1 p-5 flex flex-col gap-4 min-h-0 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-1 shrink-0 px-1">
            <div className="flex items-center gap-3">
              <h3 className="text-[11px] font-bold text-gray-200 uppercase tracking-widest">Live Alerts</h3>
              <span className="size-1.5 rounded-full bg-danger animate-pulse"></span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">2 Active</span>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => setSelectedAlertId(alert.id)}
                className={`bg-[#0b0e14] border-l-2 rounded-xl p-4 transition-all cursor-pointer group relative overflow-hidden shrink-0 ${
                  selectedAlertId === alert.id ? 'ring-1 ring-primary/30 bg-primary/5 border-primary/40' : 'hover:bg-white/5'
                } ${alert.severity === 'CRITICAL' ? 'border-danger' : alert.severity === 'HIGH' ? 'border-warning' : 'border-primary'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1.5">
                    <span className={`${alert.severity === 'CRITICAL' ? 'text-danger' : 'text-warning'} text-[9px] font-bold uppercase tracking-[0.15em]`}>
                      {alert.severity}
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-[8px] font-bold text-gray-500 border border-white/5 uppercase w-fit">
                      {alert.threat}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-tighter block ${getSlaUrgency(alert)}`}>
                      {formatSla(alert)}
                    </span>
                    {alert.isLikelyFalseAlarm && (
                      <span className="text-[8px] text-primary/60 font-bold uppercase tracking-tighter flex items-center gap-1 justify-end mt-1.5">
                        <span className="material-symbols-outlined text-[12px]">info</span> Potential False
                      </span>
                    )}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mb-0.5 tracking-tight">{alert.title}</h4>
                <p className="text-[10px] text-gray-500 mb-3 font-medium">{alert.location}</p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-primary font-bold uppercase tracking-tight flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">reply</span>
                    {alert.assignedTo || 'Unassigned'}
                  </span>
                  <span className="text-gray-600 font-medium">{alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: Map */}
      <div className="col-span-6 flex flex-col gap-5 relative h-full min-h-0 overflow-hidden">
        <div className="relative flex-1 bg-panel rounded-2xl overflow-hidden border border-white/5 group shadow-inner">
          <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-luminosity grayscale" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBfYaQPHjTMvRAhpUC4fX6DOldK4pHKIb7W9OLAsdpnXHZa64BaL6aZWFSsouZzIofQhn0f_UywGCTP12pmJbLu9VO-AjDtNODAc2ixvDGwS9_U1KSI_iUAnVzBQuxp9DkvkSDmyFXOj3ceHnloIUa5Mlajy50okYybrDJ4J4DRSoX_Da4qcf2PeTYkYZccX29NWW81O2Nnt4JZnXLFzz2u2peIKBYNBB-JCzsVt7KwNbslDyX7eTYKoYMKjEuuEGUw5aLnDAiOPM8")'}}></div>
          
          {/* Blind Spot Overlay */}
          {mapLayers.blindSpots && (
            <>
              <div className="absolute top-[20%] left-[60%] w-32 h-32 border-2 border-dashed border-danger/30 rounded-full animate-pulse flex items-center justify-center">
                <span className="text-[8px] text-danger font-bold uppercase text-center px-4">Blind Spot >30m</span>
              </div>
              <div className="absolute top-[70%] left-[15%] w-40 h-20 border-2 border-dashed border-danger/20 rounded-xl flex items-center justify-center">
                <span className="text-[8px] text-danger/60 font-bold uppercase">Unpatrolled Zone</span>
              </div>
            </>
          )}

          {/* New Map UI Overlays from Image */}
          <div className="absolute top-5 left-5 flex gap-0.5 bg-[#0b0e14]/90 backdrop-blur-md border border-white/10 p-1 rounded-xl z-20">
            <button onClick={() => setMapMode('2D')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${mapMode === '2D' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}>2D</button>
            <button onClick={() => setMapMode('3D')} className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${mapMode === '3D' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}>3D</button>
          </div>

          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20">
            <button 
              onClick={() => setViewMode(viewMode === 'thermal' ? 'default' : 'thermal')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full border bg-[#0b0e14]/90 backdrop-blur-md transition-all shadow-xl ${
                viewMode === 'thermal' 
                  ? 'border-orange-500/50 text-orange-400 shadow-orange-500/10' 
                  : 'border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${viewMode === 'thermal' ? 'fill-1' : ''}`}>local_fire_department</span>
              <span className="text-[11px] font-bold uppercase tracking-widest">Thermal</span>
            </button>
          </div>

          <div className="absolute top-5 right-5 flex flex-col gap-2 z-20">
             <button className="size-10 rounded-xl flex items-center justify-center bg-[#0b0e14]/90 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl">
               <span className="material-symbols-outlined text-[20px]">add</span>
             </button>
             <button className="size-10 rounded-xl flex items-center justify-center bg-[#0b0e14]/90 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl">
               <span className="material-symbols-outlined text-[20px]">remove</span>
             </button>
             <button className="size-10 rounded-xl mt-2 flex items-center justify-center bg-[#0b0e14]/90 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl">
               <span className="material-symbols-outlined text-[20px]">layers</span>
             </button>
          </div>

          {/* Unit Indicators */}
          {mapLayers.drones && (
             <div className="absolute top-[40%] left-[45%] z-10 flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-2xl rotate-45 shadow-primary/20">flight</span>
                <span className="bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[9px] font-bold text-white uppercase tracking-tighter mt-1.5">Sentinel-1</span>
             </div>
          )}
          {mapLayers.guards && (
             <div className="absolute top-[60%] left-[70%] z-10 flex flex-col items-center">
                <span className="material-symbols-outlined text-emerald-500 text-xl">person</span>
                <span className="bg-black/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[9px] font-bold text-white uppercase tracking-tighter mt-1.5">Pierre L.</span>
             </div>
          )}
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
            {activeTab === 'guards' ? (
              <div className="space-y-4">
                {guards.map(g => (
                  <div key={g.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-emerald-500">person</span>
                      <span className="text-white font-bold">{g.name}</span>
                      <span className="text-gray-600">— {g.location}</span>
                    </div>
                    <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">{g.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-4 text-[10px] items-start">
                  <span className="text-gray-600 font-mono pt-0.5">14:22:01</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-primary font-bold uppercase tracking-widest">[SENTINEL-1]</span>
                    <span className="text-gray-400">Lock established at Waypoint 4. Perimeter scan engaged. Signal optimal.</span>
                  </div>
                </div>
              </div>
            )}
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
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest">Excellent</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">Fleet Battery Avg</span>
              <span className="text-lg font-display font-bold text-white tracking-tight">84%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium leading-tight">Coverage Gaps<br/><span className="text-[11px] text-gray-600">(>30m)</span></span>
              <div className="text-right">
                <span className="text-lg font-display font-bold text-warning tracking-tight block">1</span>
                <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Zone</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">Pending Alerts</span>
              <span className="text-sm font-bold text-danger uppercase tracking-widest">1 Critical</span>
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
                  <div className={`size-1.5 rounded-full ${sys.status === 'warn' ? 'bg-warning animate-pulse' : 'bg-emerald-500'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 shrink-0 pt-2 pb-1">
          <button onClick={() => navigate('/fleet')} className="w-full bg-primary hover:bg-primary/90 transition-all text-black font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/10">Deploy Drone</button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/patrols')} className="bg-[#1e293b] text-white font-bold py-3 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Create Patrol</button>
            <button onClick={() => setShowShiftHandover(true)} className="bg-indigo-600/90 text-white font-bold py-3 rounded-xl border border-white/10 text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-600/10">Handover</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
