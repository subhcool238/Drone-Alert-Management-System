
import React, { useState, useMemo, useEffect } from 'react';
import Button from '../components/Button';
import { clickableProps } from '../components/a11y';
import ModalOverlay from '../components/ModalOverlay';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FleetStatus, RiskLevel, Drone } from '../types';
import { DRONES as mockDrones, getOnlineCount, STATUS_DOT, STATUS_LABEL } from '../data/drones';

// Detail badge follows the selected drone's status, in the existing status colours
const FLIGHT_BADGE: Record<FleetStatus, { label: string; box: string; text: string }> = {
  [FleetStatus.ACTIVE]: { label: 'In Flight', box: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-500' },
  [FleetStatus.IDLE]: { label: 'Flight Ready', box: 'bg-primary/20 border-primary/30', text: 'text-primary' },
  [FleetStatus.CHARGING]: { label: 'Charging', box: 'bg-warning/20 border-warning/30', text: 'text-warning' },
  [FleetStatus.FAULT]: { label: 'Grounded', box: 'bg-danger/20 border-danger/30', text: 'text-danger-light' }
};

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
    return 'text-danger-light';
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
      case RiskLevel.HIGH: return 'bg-danger/10 text-danger-light border-danger/20';
      default: return 'bg-gray-500/10 text-text-muted border-white/5';
    }
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1 relative bg-background">
      
      {/* MAINTENANCE MODAL */}
      {isMaintenanceModalOpen && (
        <ModalOverlay labelledBy="maintenance-title" onEscape={() => setIsMaintenanceModalOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-panel border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 id="maintenance-title" className="text-2xl font-display font-bold text-white">Schedule Maintenance</h2>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">Drone: {selectedDrone.name}</p>
              </div>
              <Button variant="icon" aria-label="Close" onClick={() => setIsMaintenanceModalOpen(false)} className="text-text-muted hover:text-white"><span className="material-symbols-outlined" aria-hidden="true">close</span></Button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label id="maintenance-type-label" className="text-xs font-bold text-gray-400 uppercase tracking-[0.12em] block">Maintenance Type</label>
                <div role="group" aria-labelledby="maintenance-type-label" className="grid grid-cols-2 gap-3">
                  {['Routine Check', 'Propeller Replacement', 'Lens Recalibration', 'Firmware Flash'].map(type => (
                    <Button variant="bare" key={type} className="bg-background border border-white/5 p-4 text-xs font-bold text-gray-300 hover:border-primary transition-all text-left rounded-lg">
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="bg-danger/10 border border-danger/20 p-4 rounded-2xl">
                <p className="text-xs text-danger-light font-bold uppercase tracking-wider leading-relaxed">
                  Note: Scheduling maintenance will mark this drone as <span className="underline">Unavailable</span> for patrols. Patrol logic will attempt automatic reassignment.
                </p>
              </div>
            </div>
            <div className="p-8 bg-background/50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsMaintenanceModalOpen(false)} className="px-8 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Cancel</Button>
              <Button variant="primary" onClick={() => setIsMaintenanceModalOpen(false)} className="px-10 py-3 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">Confirm Schedule</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* LEFT LIST: Search & Cards */}
      <section className="w-[400px] flex flex-col gap-5 shrink-0 h-full overflow-hidden">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">Fleet Operations</h2>
          <span className="text-xs text-primary font-bold mb-1 uppercase tracking-[0.12em]">{getOnlineCount()} / {mockDrones.length} Units Online</span>
        </div>
        
        <div className="flex flex-col gap-3 px-1">
          <div className="relative group">
            <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted material-symbols-outlined text-[20px] group-focus-within:text-primary transition-colors">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search drones by ID or designation"
              className="w-full bg-panel border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-[12px] text-white focus:border-primary/50 placeholder-text-muted outline-none transition-all" 
              placeholder="Search by ID or designation..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select aria-label="Filter drones by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full appearance-none bg-panel border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400 outline-none focus:border-primary/30 cursor-pointer">
                <option value="All">Status: All</option>
                <option>Active</option>
                <option>Idle</option>
                <option>Charging</option>
                <option>Fault</option>
              </select>
              <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm">expand_more</span>
            </div>
            <div className="relative">
              <select aria-label="Filter drones by health" value={healthFilter} onChange={e => setHealthFilter(e.target.value)} className="w-full appearance-none bg-panel border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400 outline-none focus:border-primary/30 cursor-pointer">
                <option value="All">Health: All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm">expand_more</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 custom-scrollbar px-1 pb-4">
          {filteredDrones.map(drone => (
            <div 
              key={drone.id}
              {...clickableProps(() => setSelectedDrone(drone))}
              aria-pressed={selectedDrone.id === drone.id}
              className={`flex flex-col gap-4 rounded-[1.5rem] p-5 border transition-all cursor-pointer group relative overflow-hidden shrink-0 ${
                selectedDrone.id === drone.id ? 'bg-primary/5 border-primary shadow-[0_0_20px_-10px_rgba(6,182,212,0.3)]' : 'bg-panel border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start z-10">
                <div className="flex gap-4">
                  <div className="size-12 rounded-2xl bg-background flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <img className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" src={drone.image} alt={drone.name}/>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm tracking-tight leading-none mb-2">{drone.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${drone.status === FleetStatus.ACTIVE ? 'bg-primary animate-pulse' : 'bg-gray-600'}`}></span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${drone.status === FleetStatus.ACTIVE ? 'text-primary' : 'text-text-muted'}`}>{drone.status}</span>
                      <span aria-hidden="true" className="text-xs text-text-muted font-bold">•</span>
                      <span className="text-xs text-text-muted font-mono whitespace-nowrap">ID: {drone.id}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide whitespace-nowrap shrink-0 ${getRiskColor(drone.risk)}`}>
                  {drone.risk} Risk
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 z-10">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-text-muted uppercase tracking-wider">
                    <span>Battery</span>
                    <span className="text-white">{drone.battery}%</span>
                  </div>
                  <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                    <div className={`h-full ${drone.battery < 20 ? 'bg-danger' : 'bg-primary'} transition-all`} style={{ width: `${drone.battery}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-text-muted uppercase tracking-wider">
                    <span>Health</span>
                    <span className={getHealthColor(drone.health)}>{drone.health}%</span>
                  </div>
                  <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                    <div className={`h-full ${getHealthBg(drone.health)} transition-all`} style={{ width: `${drone.health}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 text-xs font-bold text-text-muted uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="material-symbols-outlined text-[14px]">wifi</span>
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
        <div className="flex flex-col min-[1440px]:flex-row gap-12 pb-12 border-b border-white/5">
          <div className="w-full h-[220px] min-[1440px]:h-72 min-[1440px]:w-[480px] min-[1440px]:min-w-[280px] min-[1440px]:shrink bg-background rounded-[2rem] overflow-hidden relative group">
            <img className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" src={selectedDrone.image} alt={selectedDrone.name}/>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 flex items-center gap-3">
               <div className={`${FLIGHT_BADGE[selectedDrone.status].box} backdrop-blur-md border px-4 py-2 rounded-xl`}>
                 <span className={`text-xs font-bold ${FLIGHT_BADGE[selectedDrone.status].text} uppercase tracking-widest`}>{FLIGHT_BADGE[selectedDrone.status].label}</span>
               </div>
               <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white font-mono text-xs">
                 {selectedDrone.fwVersion}
               </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0 min-[1440px]:min-w-[280px] flex flex-col">
            <div className="flex flex-wrap justify-between items-start gap-x-6 gap-y-6 mb-10">
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  <h2 className="whitespace-nowrap text-6xl font-display font-bold text-white tracking-tighter">{selectedDrone.name}</h2>
                  <span className="text-2xl font-mono text-text-muted font-bold">[{selectedDrone.id}]</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className={`${STATUS_DOT[selectedDrone.status]} ${selectedDrone.status === FleetStatus.FAULT ? 'text-white' : 'text-black'} text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider`}>{STATUS_LABEL[selectedDrone.status]}</span>
                  <span className="bg-background text-gray-400 border border-white/10 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">{selectedDrone.type}</span>
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getRiskColor(selectedDrone.risk)}`}>
                    {selectedDrone.risk} Risk Level
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="text-5xl font-display font-bold text-white tracking-tighter leading-none">{selectedDrone.battery}%</div>
                <div className="text-xs text-text-muted font-bold uppercase tracking-wider mt-2">{selectedDrone.batteryTimeRemaining} Flight Remaining</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-auto">
              <Button variant="primary" onClick={() => navigate(`/manual?id=${selectedDrone.id}`)} className="flex-1 whitespace-nowrap font-bold text-xs py-5 gap-3 uppercase tracking-[0.15em] shadow-xl shadow-primary/10">
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">rocket_launch</span> Deploy Manual Mission
              </Button>
              <Button variant="secondary" className="bg-background text-white whitespace-nowrap font-bold text-xs px-12 py-5 gap-3 uppercase tracking-widest">
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">settings</span> Advanced Config
              </Button>
            </div>
          </div>
        </div>

        {/* PREDICTIVE MAINTENANCE DASHBOARD */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-[28px]">analytics</span>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-[0.25em]">Maintenance Diagnostics</h3>
                  <p className="text-xs text-text-muted font-medium uppercase mt-1">Fleet Health Report</p>
                </div>
             </div>
             <Button variant="secondary" 
 onClick={() => setIsMaintenanceModalOpen(true)}
 className="text-xs font-bold text-white px-8 py-4 uppercase tracking-[0.1em] bg-background/50 shadow-sm">
              Schedule Maintenance
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 bg-background/40 border border-white/5 rounded-3xl p-10 flex flex-col gap-10">
              <div className="relative">
                <div className="flex justify-between items-end mb-5">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Asset Health vs Nominal Profile</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-display font-bold ${getHealthColor(selectedDrone.health)}`}>{selectedDrone.health}%</span>
                    <span className="text-xs text-text-muted font-bold uppercase">Health Score</span>
                  </div>
                </div>
                <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-white/5 p-1">
                  <div className={`h-full rounded-full transition-all duration-1000 ${getHealthBg(selectedDrone.health)} shadow-[0_0_15px_-5px_currentColor]`} style={{ width: `${selectedDrone.health}%` }}></div>
                </div>
                <div className="flex justify-between mt-4">
                   <div className="flex flex-col">
                     <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Current Health</span>
                     <span className="text-white font-mono text-xs font-bold">{selectedDrone.health}% Capacity</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Nominal Threshold</span>
                     <span className="text-gray-400 font-mono text-xs font-bold">{selectedDrone.nominalCapacity}% Efficiency</span>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Service Countdown</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-display font-bold text-white">{selectedDrone.nextServiceHours}</p>
                    <span className="text-xs text-text-muted font-bold uppercase">Hours left</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Cycle Lifespan</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-display font-bold text-white">{selectedDrone.cyclesRemaining}</p>
                    <span className="text-xs text-text-muted font-bold uppercase">Cycles Est.</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 bg-panel/30 border border-white/5 rounded-3xl p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                <span aria-hidden="true" className="material-symbols-outlined text-text-muted text-[20px]">rule</span>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Anomaly Detection Flags</p>
              </div>
              <div className="flex-1 space-y-6">
                {selectedDrone.anomalies.map((a, i) => (
                  <div key={i} className="flex gap-5 items-start animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${selectedDrone.health < 60 ? 'bg-danger/10 text-danger-light border border-danger/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        {selectedDrone.health < 60 ? 'error' : 'task_alt'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <p className={`text-[12px] font-bold ${selectedDrone.health < 60 ? 'text-gray-200' : 'text-gray-400'}`}>{a}</p>
                       <p className="text-xs text-text-muted font-medium">Checked by system diagnostics 2.4s ago</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5">
                 <Button variant="text" className="text-xs font-bold text-primary uppercase tracking-[0.12em] gap-2 hover:translate-x-1 transition-transform">
                   Run Deep Diagnostic <span aria-hidden="true" className="material-symbols-outlined text-[14px]">arrow_forward</span>
                 </Button>
              </div>
            </div>
          </div>
        </div>

        {/* REAL-TIME TELEMETRY GRID */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
               <span aria-hidden="true" className="material-symbols-outlined text-emerald-500 text-[28px]">sensors</span>
             </div>
             <div>
               <h3 className="text-[13px] font-bold text-white uppercase tracking-[0.25em]">Real-Time Telemetry</h3>
               <p className="text-xs text-text-muted font-medium uppercase mt-1">Satellite Verified Sync Data</p>
             </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: 'altitude', label: 'Altitude', val: selectedDrone.status === FleetStatus.ACTIVE ? '12.4' : '0', unit: 'Meters' },
              { icon: 'speed', label: 'Ground Speed', val: selectedDrone.status === FleetStatus.ACTIVE ? selectedDrone.avgSpeed : 0, unit: 'm/s' },
              { icon: 'satellite_alt', label: 'GPS Satellites', val: 18, unit: 'Locked' },
              { icon: 'wifi_tethering', label: 'Link Quality', val: selectedDrone.linkStrength, unit: '%' }
            ].map((stat, i) => (
              <div key={i} className="bg-background/60 border border-white/5 rounded-3xl p-8 flex flex-col gap-6 group hover:border-primary/20 hover:bg-background transition-all shadow-inner">
                <div className="flex justify-between items-start">
                   <div className="size-12 rounded-2xl bg-panel border border-white/10 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:border-primary/30 transition-all">
                     <span aria-hidden="true" className="material-symbols-outlined text-[24px]">{stat.icon}</span>
                   </div>
                   <div aria-hidden="true" className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{stat.label}</span>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-mono font-bold text-white tracking-tighter">{stat.val}</h3>
                    <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{stat.unit}</span>
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
