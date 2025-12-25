
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeBottomTab, setActiveBottomTab] = useState<'feed' | 'status' | 'patrols' | 'guards'>('feed');
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');
  const [viewMode, setViewMode] = useState<'default' | 'thermal'>('default');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>('ALT-01');

  // Simulated Alert Timer
  const [slaTime, setSlaTime] = useState(24);
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const alerts = [
    {
      id: 'ALT-01',
      severity: 'CRITICAL',
      type: 'HUMAN',
      title: 'Motion Detected',
      location: 'Storage Area B (North)',
      timer: `00:${slaTime.toString().padStart(2, '0')}`,
      assigned: 'Sentinel-1',
      time: '2m ago',
      falseAlarmHint: false,
    },
    {
      id: 'ALT-02',
      severity: 'HIGH',
      type: 'SENSOR',
      title: 'Signal Degradation',
      location: 'Watcher-3 @ Richelieu',
      timer: '01:45',
      assigned: 'None',
      time: '12m ago',
      falseAlarmHint: true,
    }
  ];

  return (
    <div className="grid grid-cols-12 gap-5 h-full overflow-hidden p-1">
      
      {/* LEFT COLUMN: Controls & Alerts */}
      <div className="col-span-3 flex flex-col gap-5 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* Tactical Controls */}
        <div className="bg-panel border border-white/5 rounded-2xl p-4 flex flex-col gap-4 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tactical Controls</h3>
            <button className="text-gray-500 hover:text-white transition-colors"><span className="material-symbols-outlined text-[18px]">tune</span></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="bg-background text-[11px] text-white border border-white/10 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none">
              <option>Severity: All</option>
              <option>Critical</option>
              <option>High</option>
            </select>
            <select className="bg-background text-[11px] text-white border border-white/10 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none">
              <option>Threat: All</option>
              <option>Human</option>
              <option>Sensor</option>
              <option>Env</option>
            </select>
          </div>
          <div className="relative">
            <select className="w-full bg-background text-[11px] text-white border border-white/10 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none appearance-none">
              <option>System Filter: Default</option>
              <option>Intruder Focus</option>
              <option>Maintenance Only</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-600 pointer-events-none">expand_more</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2 bg-background p-2 rounded-xl border border-white/5">
            {[
              { label: 'Active', val: '3', color: 'text-white' },
              { label: 'Idle', val: '2', color: 'text-gray-400' },
              { label: 'Chrg', val: '1', color: 'text-warning' },
              { label: 'Fault', val: '0', color: 'text-danger' }
            ].map((s, i) => (
              <div key={i} className={`flex flex-col items-center gap-1 ${i > 0 ? 'border-l border-white/5' : ''}`}>
                <span className={`text-xl font-bold font-display ${s.color}`}>{s.val}</span>
                <span className={`text-[9px] font-bold uppercase ${s.label === 'Active' ? 'text-primary' : 'text-gray-500'}`}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" defaultChecked className="size-3.5 rounded bg-primary/20 border-primary text-primary focus:ring-0 cursor-pointer" />
              <span className="text-[11px] text-gray-300 group-hover:text-white transition-colors font-medium">Show Drones</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" defaultChecked className="size-3.5 rounded bg-primary/20 border-primary text-primary focus:ring-0 cursor-pointer" />
              <span className="text-[11px] text-gray-300 group-hover:text-white transition-colors font-medium">Show Guards</span>
            </label>
          </div>
        </div>

        {/* Live Alerts List */}
        <div className="bg-panel border border-white/5 rounded-2xl flex-1 p-4 flex flex-col gap-3 min-h-0 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Alerts</h3>
              <span className="size-1.5 rounded-full bg-danger animate-pulse"></span>
            </div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">2 Active</span>
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-visible">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => setSelectedAlertId(alert.id)}
                className={`bg-background border-l-2 rounded-lg p-3 transition-all cursor-pointer group relative overflow-hidden ${
                  selectedAlertId === alert.id ? 'ring-1 ring-primary/30 bg-primary/5' : 'hover:bg-white/5'
                } ${alert.severity === 'CRITICAL' ? 'border-danger' : 'border-warning'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className={`${alert.severity === 'CRITICAL' ? 'bg-danger/20 text-danger border-danger/30' : 'bg-warning/20 text-warning border-warning/30'} text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest`}>
                      {alert.severity}
                    </span>
                    <span className="bg-gray-800 text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/5">
                      <span className="material-symbols-outlined text-[10px]">{alert.type === 'HUMAN' ? 'person' : 'sensors'}</span> {alert.type}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-tighter ${slaTime < 10 && alert.id === 'ALT-01' ? 'text-danger animate-pulse' : 'text-gray-400'}`}>
                    SLA {alert.timer}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-0.5 tracking-tight">{alert.title}</h4>
                <p className="text-[11px] text-gray-400 mb-2 font-medium">{alert.location}</p>
                
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-primary flex items-center gap-1 font-bold uppercase tracking-tight">
                    <span className="material-symbols-outlined text-[12px] -scale-x-100">reply</span> 
                    {alert.assigned}
                  </span>
                  <div className="flex items-center gap-2">
                    {alert.falseAlarmHint && (
                      <div className="flex items-center gap-1 text-gray-500 italic" title="Probable False Alarm">
                        <span className="material-symbols-outlined text-[12px]">help</span>
                      </div>
                    )}
                    <span className="text-gray-600 font-medium">{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: Map & Live View */}
      <div className="col-span-6 flex flex-col gap-5 relative min-h-0">
        <div className="relative flex-1 bg-panel rounded-2xl overflow-hidden border border-white/5 group shadow-inner">
          <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-luminosity brightness-[0.7] grayscale" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBfYaQPHjTMvRAhpUC4fX6DOldK4pHKIb7W9OLAsdpnXHZa64BaL6aZWFSsouZzIofQhn0f_UywGCTP12pmJbLu9VO-AjDtNODAc2ixvDGwS9_U1KSI_iUAnVzBQuxp9DkvkSDmyFXOj3ceHnloIUa5Mlajy50okYybrDJ4J4DRSoX_Da4qcf2PeTYkYZccX29NWW81O2Nnt4JZnXLFzz2u2peIKBYNBB-JCzsVt7KwNbslDyX7eTYKoYMKjEuuEGUw5aLnDAiOPM8")'}}></div>
          
          <div className="absolute top-4 left-4 flex gap-1 bg-background/90 backdrop-blur border border-white/10 p-1 rounded-lg z-20">
            <button onClick={() => setMapMode('2D')} className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${mapMode === '2D' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}>2D</button>
            <button onClick={() => setMapMode('3D')} className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${mapMode === '3D' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}>3D</button>
          </div>
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center bg-background/90 backdrop-blur border border-white/10 rounded-full px-1 py-1 z-20">
            <button 
              onClick={() => setViewMode('default')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${viewMode === 'default' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              Default
            </button>
            <button 
              onClick={() => setViewMode('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${viewMode === 'thermal' ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Thermal
            </button>
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button className="size-8 rounded-full bg-background/90 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg"><span className="material-symbols-outlined text-[18px]">add</span></button>
            <button className="size-8 rounded-full bg-background/90 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg"><span className="material-symbols-outlined text-[18px]">remove</span></button>
            <button className="size-8 rounded-full bg-background/90 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg mt-2"><span className="material-symbols-outlined text-[18px]">layers</span></button>
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <rect x="10%" y="15%" width="120" height="80" fill="rgba(249, 115, 22, 0.05)" stroke="rgba(249, 115, 22, 0.3)" strokeDasharray="4 2" />
            <text x="12%" y="14%" fill="#f97316" fontSize="8" fontWeight="bold" className="uppercase tracking-widest opacity-60">Blind Spot Zone</text>
            <rect x="75%" y="60%" width="100" height="120" fill="rgba(249, 115, 22, 0.05)" stroke="rgba(249, 115, 22, 0.3)" strokeDasharray="4 2" />
            <circle cx="45%" cy="40%" r="40" fill="rgba(239, 68, 68, 0.1)" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 4" className="animate-pulse" />
          </svg>

          <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="relative cursor-pointer group/drone flex flex-col items-center">
              <div className="text-[8px] font-bold text-primary mb-1 bg-black/80 px-1 py-0.5 rounded border border-primary/20 whitespace-nowrap opacity-0 group-hover/drone:opacity-100 transition-opacity">Sentinel-1 (Manual)</div>
              <div className="size-8 rounded-full bg-primary shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center border-2 border-white relative z-10 transition-transform hover:scale-110">
                <span className="material-symbols-outlined text-white text-[18px] rotate-45">flight</span>
              </div>
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping pointer-events-none"></div>
            </div>
          </div>

          <div className="absolute bottom-[35%] right-[25%] z-20">
            <div className="relative cursor-pointer group/guard flex flex-col items-center">
              <div className="text-[8px] font-bold text-gray-200 mb-1 bg-black/80 px-1 py-0.5 rounded border border-white/10 whitespace-nowrap opacity-0 group-hover/guard:opacity-100 transition-opacity">Pierre L. (Zone B)</div>
              <div className="size-7 rounded-full bg-secondary border-2 border-white/60 flex items-center justify-center relative z-10 transition-transform hover:scale-110">
                <span className="material-symbols-outlined text-white text-[16px]">person</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 bg-secondary/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-3 z-30">
            <div className="flex items-center gap-6 text-[10px] font-bold border-b border-white/5 pb-2 uppercase tracking-widest">
              {['feed', 'status', 'patrols', 'guards'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveBottomTab(tab as any)}
                  className={`transition-all capitalize ${activeBottomTab === tab ? 'text-primary border-b border-primary -mb-2.5 pb-2' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab === 'feed' ? 'Live Feed' : tab === 'status' ? 'Drone Status' : tab}
                </button>
              ))}
            </div>

            <div className="h-16 overflow-hidden">
              {activeBottomTab === 'feed' && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-24 h-14 bg-black rounded-lg border border-white/10 relative overflow-hidden flex-shrink-0">
                    <img src="https://picsum.photos/200/100?tech" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute top-1 left-1 flex gap-0.5">
                      <div className="size-1 bg-danger rounded-full animate-pulse"></div>
                      <span className="text-[6px] text-white font-mono">REC</span>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Source</span>
                      <h4 className="text-xs font-bold text-white mt-0.5">Sentinel-1 (Responding)</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Target</span>
                      <h4 className="text-xs font-bold text-danger mt-0.5 uppercase tracking-tighter">Zone B Intrusion</h4>
                    </div>
                  </div>
                  <button onClick={() => navigate('/manual')} className="px-4 py-2 border border-white/20 hover:bg-white/5 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest transition-all">Manual Override</button>
                </div>
              )}

              {activeBottomTab === 'status' && (
                <div className="grid grid-cols-4 gap-4 items-center h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {[
                    { l: 'Battery', v: '48%', u: '8m left' },
                    { l: 'Altitude', v: '12.4m', u: 'Stable' },
                    { l: 'Speed', v: '4.2m/s', u: 'Nominal' },
                    { l: 'Signal', v: 'Excellent', u: '-42dBm' }
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{stat.l}</span>
                      <span className="text-sm font-bold text-white">{stat.v}</span>
                      <span className="text-[8px] text-gray-500 font-medium uppercase">{stat.u}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeBottomTab === 'patrols' && (
                <div className="flex items-center gap-6 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex-1 flex items-center gap-4 bg-background border border-white/5 p-2 rounded-lg">
                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">alt_route</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Perimeter Alpha</h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Status: In Progress • ETA 04:12</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/patrols')} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest px-4">View All</button>
                </div>
              )}

              {activeBottomTab === 'guards' && (
                <div className="flex items-center gap-4 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex-1 flex items-center gap-3">
                    <div className="size-10 bg-gray-800 rounded-lg overflow-hidden border border-white/10">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIDyTcgMziu_SlD9vKbP4lc7DxNC1csn7gAFJhb_yYJrjztwO0ZRepLrW67jMXpMPyMsen9As3YGoOppNjRCQg68Ph_MW8mnBX7r3HL07ukI4CHCM-UqCQtDRUogqeg_I9FwW-35qn_hsMev_h4DsEDgvMBiQ7Txw2fizEwZBYKEtS5lBHn1wUnUFZUj3m9sEUG7VIqSLtK0oGMSX6OZhgUgRqCph62m_tNdVdq-L9AsaC1LWh8L2KC7JESlmEFVM9JqErwIM8FQw" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Pierre L.</h4>
                      <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Assigned: Storage Area B</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/5"></div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Last Check-in</span>
                    <span className="text-xs font-bold text-white">2m 4s ago</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Overview & Systems */}
      <div className="col-span-3 flex flex-col gap-5 min-h-0 overflow-y-auto pr-1 custom-scrollbar pb-4">
        
        {/* Readiness Overview - PRECISE MATCH TO SCREENSHOT */}
        <div className="bg-panel border border-white/5 rounded-2xl p-5 flex flex-col shadow-sm relative">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Readiness Overview</h3>
          
          <div className="flex flex-col">
            {/* Network Mesh Row */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <span className="text-sm text-gray-300 font-medium">Network Mesh</span>
              <span className="bg-[#064e3b]/30 text-[#10b981] text-[9px] font-bold px-2.5 py-1 rounded border border-[#064e3b]/50 uppercase tracking-widest">Excellent</span>
            </div>

            {/* Fleet Battery Avg Row */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <span className="text-sm text-gray-300 font-medium">Fleet Battery Avg</span>
              <span className="text-sm font-bold text-white">84%</span>
            </div>

            {/* Coverage Gaps Row */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-sm text-gray-300 font-medium">Coverage Gaps</span>
                <span className="text-[10px] text-gray-500 font-medium font-mono tracking-tight">(&gt;30m)</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-warning leading-none">1</div>
                <div className="text-[11px] font-bold text-warning uppercase tracking-tighter">Zone</div>
              </div>
            </div>

            {/* Pending Alerts Row */}
            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-gray-300 font-medium">Pending Alerts</span>
              <div className="flex items-center gap-1.5 text-danger">
                <span className="text-sm font-bold">1</span>
                <span className="text-sm font-bold capitalize">Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Systems Status */}
        <div className="bg-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-sm shrink-0">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connected Systems</h3>
          <div className="flex flex-col gap-3">
            {[
              { icon: 'videocam', name: 'CCTV Network', desc: '142/145 Online', status: 'ok' },
              { icon: 'sensors', name: 'Motion Sensors', desc: 'Zone B Triggered', status: 'warn' },
              { icon: 'lock', name: 'Access Control', desc: 'All Gates Secure', status: 'ok' },
              { icon: 'thermostat', name: 'Env Monitoring', desc: 'Stable', status: 'ok' }
            ].map((sys, i) => (
              <div key={i} className={`bg-background border border-white/5 rounded-lg p-3 flex items-center gap-3 group hover:border-white/10 transition-all ${sys.status === 'warn' ? 'ring-1 ring-warning/30' : ''}`}>
                <span className={`material-symbols-outlined text-[20px] ${sys.status === 'warn' ? 'text-warning' : 'text-gray-500 group-hover:text-primary transition-colors'}`}>{sys.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold text-white tracking-tight">{sys.name}</h4>
                  <p className={`text-[9px] font-medium uppercase tracking-widest ${sys.status === 'warn' ? 'text-warning' : 'text-gray-500'}`}>{sys.desc}</p>
                </div>
                <div className={`size-1.5 rounded-full ${sys.status === 'warn' ? 'bg-warning animate-pulse' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.3)]`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex flex-col gap-3 shrink-0 pt-4">
          <button 
            onClick={() => navigate('/fleet')}
            className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3.5 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            Deploy Drone
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/patrols')} className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">add_location</span> Patrol
            </button>
            <button onClick={() => navigate('/incidents')} className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">assessment</span> Reports
            </button>
          </div>
          <button className="w-full bg-background border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-gray-400 hover:text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
            <span className="material-symbols-outlined text-[18px]">handshake</span> 
            Shift Handover
          </button>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
