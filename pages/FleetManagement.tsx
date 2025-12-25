
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FleetStatus, RiskLevel, Drone } from '../types';

const mockDrones: Drone[] = [
  {
    id: 'D-001',
    name: 'Sentinel-1',
    status: FleetStatus.ACTIVE,
    risk: RiskLevel.LOW,
    battery: 48,
    batteryTimeRemaining: '22m',
    health: 98,
    nominalCapacity: 100,
    link: 'Strong',
    linkStrength: 98,
    cycles: 132,
    cyclesRemaining: 1868,
    lastSync: '2s ago',
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=400',
    type: 'Indoor Guardian Pro',
    fwVersion: 'v2.4.1',
    flightTimeToday: '4h 12m',
    avgSpeed: 4.2,
    anomalies: ['All systems nominal', 'Vibration within threshold'],
    nextServiceHours: 124
  },
  {
    id: 'D-002',
    name: 'Watcher-3',
    status: FleetStatus.IDLE,
    risk: RiskLevel.MEDIUM,
    battery: 100,
    batteryTimeRemaining: '45m',
    health: 75,
    nominalCapacity: 92,
    link: 'Good',
    linkStrength: 82,
    cycles: 450,
    cyclesRemaining: 1550,
    lastSync: '10m ago',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8418f9f108?auto=format&fit=crop&q=80&w=400',
    type: 'Thermal Scout',
    fwVersion: 'v2.3.0',
    flightTimeToday: '2h 05m',
    avgSpeed: 3.8,
    anomalies: ['Lens calibration requested', 'Minor GPS drift detected'],
    nextServiceHours: 12
  },
  {
    id: 'D-003',
    name: 'Surveyor-X',
    status: FleetStatus.FAULT,
    risk: RiskLevel.HIGH,
    battery: 12,
    batteryTimeRemaining: '0m',
    health: 45,
    nominalCapacity: 68,
    link: 'Weak',
    linkStrength: 15,
    cycles: 1205,
    cyclesRemaining: 795,
    lastSync: '1h ago',
    image: 'https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&q=80&w=400',
    type: 'High-Altitude Recon',
    fwVersion: 'v1.9.8',
    flightTimeToday: '8h 44m',
    avgSpeed: 12.5,
    anomalies: ['Battery cell degradation', 'Telemetry link failure'],
    nextServiceHours: 0
  }
];

const FleetManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const droneIdFromUrl = searchParams.get('id');

  const [selectedDrone, setSelectedDrone] = useState<Drone>(
    mockDrones.find(d => d.id === droneIdFromUrl) || mockDrones[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [healthFilter, setHealthFilter] = useState('All');
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  useEffect(() => {
    if (droneIdFromUrl) {
      const drone = mockDrones.find(d => d.id === droneIdFromUrl);
      if (drone) setSelectedDrone(drone);
    }
  }, [droneIdFromUrl]);

  const filteredDrones = useMemo(() => {
    return mockDrones.filter(d => {
      const searchMatch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'All' || d.status === statusFilter.toUpperCase();
      const healthMatch = healthFilter === 'All' || 
        (healthFilter === 'Low' && d.health < 60) || 
        (healthFilter === 'Medium' && d.health >= 60 && d.health < 85) || 
        (healthFilter === 'High' && d.health >= 85);
      return searchMatch && statusMatch && healthMatch;
    });
  }, [searchTerm, statusFilter, healthFilter]);

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getHealthBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 60) return 'bg-warning';
    return 'bg-danger';
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.LOW: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case RiskLevel.MEDIUM: return 'bg-warning/10 text-warning border-warning/20';
      case RiskLevel.HIGH: return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-gray-500/10 text-gray-500 border-white/5';
    }
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1 relative bg-background">
      
      {/* MAINTENANCE MODAL */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-panel border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Schedule Maintenance</h2>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Drone: {selectedDrone.name}</p>
              </div>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">close</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block">Maintenance Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Routine Check', 'Propeller Replacement', 'Lens Recalibration', 'Firmware Flash'].map(type => (
                    <button key={type} className="bg-background border border-white/5 p-4 rounded-2xl text-[11px] font-bold text-gray-300 hover:border-primary transition-all text-left">
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-danger/10 border border-danger/20 p-4 rounded-2xl">
                <p className="text-[10px] text-danger font-bold uppercase tracking-widest leading-relaxed">
                  Note: Scheduling maintenance will mark this drone as <span className="underline">Unavailable</span> for patrols. Patrol logic will attempt automatic reassignment.
                </p>
              </div>
            </div>
            <div className="p-8 bg-background/50 flex justify-end gap-3">
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="px-8 py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 text-gray-400">Cancel</button>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="px-10 py-3 rounded-xl bg-primary text-black text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Confirm Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT LIST: Search & Cards */}
      <section className="w-[400px] flex flex-col gap-5 shrink-0 h-full overflow-hidden">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Fleet Operations</h2>
          <span className="text-[10px] text-primary font-bold mb-1 uppercase tracking-[0.2em]">{filteredDrones.length} Units Online</span>
        </div>
        
        <div className="flex flex-col gap-3 px-1">
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-panel border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-[12px] text-white focus:border-primary/50 placeholder-gray-600 outline-none transition-all" 
              placeholder="Search by ID or designation..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full appearance-none bg-panel border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 outline-none focus:border-primary/30 cursor-pointer">
                <option>Status: All</option>
                <option>Active</option>
                <option>Idle</option>
                <option>Charging</option>
                <option>Fault</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-sm">expand_more</span>
            </div>
            <div className="relative">
              <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)} className="w-full appearance-none bg-panel border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 outline-none focus:border-primary/30 cursor-pointer">
                <option>Health: All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 custom-scrollbar px-1 pb-4">
          {filteredDrones.map(drone => (
            <div 
              key={drone.id}
              onClick={() => setSelectedDrone(drone)}
              className={`flex flex-col gap-4 rounded-[1.5rem] p-5 border transition-all cursor-pointer group relative overflow-hidden ${
                selectedDrone.id === drone.id ? 'bg-primary/5 border-primary shadow-[0_0_20px_-10px_rgba(6,182,212,0.3)]' : 'bg-panel border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start z-10">
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-background border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <img className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" src={drone.image} alt={drone.name}/>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-tight leading-none mb-2">{drone.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${drone.status === FleetStatus.ACTIVE ? 'bg-primary animate-pulse' : 'bg-gray-600'}`}></span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${drone.status === FleetStatus.ACTIVE ? 'text-primary' : 'text-gray-600'}`}>{drone.status}</span>
                      <span className="text-[9px] text-gray-700 font-bold">•</span>
                      <span className="text-[9px] text-gray-500 font-mono">ID: {drone.id}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${getRiskColor(drone.risk)}`}>
                  {drone.risk} Risk
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 z-10">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Battery</span>
                    <span className="text-white">{drone.battery}%</span>
                  </div>
                  <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                    <div className={`h-full ${drone.battery < 20 ? 'bg-danger' : 'bg-primary'} transition-all`} style={{ width: `${drone.battery}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Health</span>
                    <span className={getHealthColor(drone.health)}>{drone.health}%</span>
                  </div>
                  <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                    <div className={`h-full ${getHealthBg(drone.health)} transition-all`} style={{ width: `${drone.health}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">wifi</span>
                  <span>{drone.link} Link</span>
                </div>
                <div>{drone.cyclesRemaining} Cycles Left</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT DETAILS: Predictive Maintenance & Telemetry */}
      <section className="flex-1 bg-panel rounded-[2rem] border border-white/5 p-10 overflow-y-auto flex flex-col gap-12 custom-scrollbar shadow-2xl">
        <div className="flex flex-col xl:flex-row gap-12 pb-12 border-b border-white/5">
          <div className="w-full xl:w-[480px] h-72 bg-background rounded-[2rem] overflow-hidden border border-white/10 relative group">
            <img className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" src={selectedDrone.image} alt={selectedDrone.name}/>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 flex items-center gap-3">
               <div className="bg-primary/20 backdrop-blur-md border border-primary/30 px-4 py-2 rounded-xl">
                 <span className="text-xs font-bold text-primary uppercase tracking-widest">Flight Ready</span>
               </div>
               <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white font-mono text-xs">
                 {selectedDrone.fwVersion}
               </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-10">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-6xl font-display font-bold text-white tracking-tighter">{selectedDrone.name}</h1>
                  <span className="text-2xl font-mono text-gray-600 font-bold opacity-40">[{selectedDrone.id}]</span>
                </div>
                <div className="flex gap-3">
                  <span className="bg-primary text-black text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">Active Fleet</span>
                  <span className="bg-background text-gray-400 border border-white/10 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">{selectedDrone.type}</span>
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${getRiskColor(selectedDrone.risk)}`}>
                    {selectedDrone.risk} Risk Level
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-5xl font-display font-bold text-white tracking-tighter leading-none">{selectedDrone.battery}%</div>
                <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-2">{selectedDrone.batteryTimeRemaining} Flight Remaining</div>
              </div>
            </div>

            <div className="flex gap-4 mt-auto">
              <button onClick={() => navigate('/manual')} className="flex-1 bg-primary hover:bg-primary/90 transition-all text-black font-bold text-xs py-5 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.15em] shadow-xl shadow-primary/10">
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span> Deploy Manual Mission
              </button>
              <button className="bg-background border border-white/10 text-white hover:bg-white/5 transition-all font-bold text-xs px-12 py-5 rounded-2xl flex items-center gap-3 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[20px]">settings</span> Advanced Config
              </button>
            </div>
          </div>
        </div>

        {/* PREDICTIVE MAINTENANCE DASHBOARD */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-[28px]">analytics</span>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-[0.25em]">Predictive Diagnostics</h3>
                  <p className="text-[11px] text-gray-500 font-medium uppercase mt-1">Autonomous Fleet Intelligence Report</p>
                </div>
             </div>
             <button 
               onClick={() => setIsMaintenanceModalOpen(true)}
               className="text-[11px] font-bold text-white border border-white/10 hover:bg-white/5 px-8 py-4 rounded-2xl uppercase tracking-[0.15em] transition-all bg-background/50 shadow-sm"
              >
              Schedule Maintenance
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-background/40 border border-white/5 rounded-3xl p-10 flex flex-col gap-10">
              <div className="relative">
                <div className="flex justify-between items-end mb-5">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Asset Health vs Nominal Profile</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-display font-bold ${getHealthColor(selectedDrone.health)}`}>{selectedDrone.health}%</span>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Health Score</span>
                  </div>
                </div>
                <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-white/5 p-1">
                  <div className={`h-full rounded-full transition-all duration-1000 ${getHealthBg(selectedDrone.health)} shadow-[0_0_15px_-5px_currentColor]`} style={{ width: `${selectedDrone.health}%` }}></div>
                </div>
                <div className="flex justify-between mt-4">
                   <div className="flex flex-col">
                     <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Current Health</span>
                     <span className="text-white font-mono text-[11px] font-bold">{selectedDrone.health}% Capacity</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Nominal Threshold</span>
                     <span className="text-gray-400 font-mono text-[11px] font-bold">{selectedDrone.nominalCapacity}% Efficiency</span>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Service Countdown</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-display font-bold text-white">{selectedDrone.nextServiceHours}</p>
                    <span className="text-xs text-gray-600 font-bold uppercase">Hours left</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Cycle Lifespan</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-display font-bold text-white">{selectedDrone.cyclesRemaining}</p>
                    <span className="text-xs text-gray-600 font-bold uppercase">Cycles Est.</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 bg-panel/30 border border-white/5 rounded-3xl p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                <span className="material-symbols-outlined text-gray-500 text-[20px]">rule</span>
                <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest">Anomaly Detection Flags</p>
              </div>
              <div className="flex-1 space-y-6">
                {selectedDrone.anomalies.map((a, i) => (
                  <div key={i} className="flex gap-5 items-start animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${selectedDrone.health < 60 ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {selectedDrone.health < 60 ? 'error' : 'task_alt'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <p className={`text-[12px] font-bold ${selectedDrone.health < 60 ? 'text-gray-200' : 'text-gray-400'}`}>{a}</p>
                       <p className="text-[10px] text-gray-600 font-medium">Verified by AI Inspector 2.4s ago</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5">
                 <button className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-1 transition-transform">
                   Run Deep Diagnostic <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* REAL-TIME TELEMETRY GRID */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
               <span className="material-symbols-outlined text-emerald-500 text-[28px]">sensors</span>
             </div>
             <div>
               <h3 className="text-[13px] font-bold text-white uppercase tracking-[0.25em]">Real-Time Telemetry</h3>
               <p className="text-[11px] text-gray-500 font-medium uppercase mt-1">Satellite Verified Sync Data</p>
             </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: 'altitude', label: 'Altitude', val: '124.8', unit: 'Meters' },
              { icon: 'speed', label: 'Ground Speed', val: selectedDrone.avgSpeed, unit: 'm/s' },
              { icon: 'satellite_alt', label: 'GPS Satellites', val: 18, unit: 'Locked' },
              { icon: 'wifi_tethering', label: 'Link Quality', val: selectedDrone.linkStrength, unit: '%' }
            ].map((stat, i) => (
              <div key={i} className="bg-background/60 border border-white/5 rounded-3xl p-8 flex flex-col gap-6 group hover:border-primary/20 hover:bg-background transition-all shadow-inner">
                <div className="flex justify-between items-start">
                   <div className="size-12 rounded-2xl bg-panel border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-primary group-hover:border-primary/30 transition-all">
                     <span className="material-symbols-outlined text-[24px]">{stat.icon}</span>
                   </div>
                   <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</span>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-display font-bold text-white tracking-tighter">{stat.val}</h3>
                    <span className="text-[11px] text-gray-600 font-bold uppercase tracking-widest">{stat.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FleetManagement;
