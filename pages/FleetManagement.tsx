
import React, { useState } from 'react';
import { FleetStatus, RiskLevel, Drone } from '../types';

const mockDrones: Drone[] = [
  {
    id: 'D-001',
    name: 'Sentinel-1',
    status: FleetStatus.ACTIVE,
    risk: RiskLevel.LOW,
    battery: 48,
    health: 98,
    link: 'Strong',
    cycles: 132,
    lastSync: '2s ago',
    image: 'https://picsum.photos/400/300?drone=1',
    type: 'Indoor Guardian Pro',
    fwVersion: 'v2.4.1'
  },
  {
    id: 'D-002',
    name: 'Watcher-3',
    status: FleetStatus.IDLE,
    risk: RiskLevel.MEDIUM,
    battery: 100,
    health: 85,
    link: 'Good',
    cycles: 450,
    lastSync: '10m ago',
    image: 'https://picsum.photos/400/300?drone=2',
    type: 'Thermal Scout',
    fwVersion: 'v2.3.0'
  },
  {
    id: 'D-003',
    name: 'Surveyor-X',
    status: FleetStatus.FAULT,
    risk: RiskLevel.HIGH,
    battery: 12,
    health: 45,
    link: 'Lost',
    cycles: 1205,
    lastSync: '1h ago',
    image: 'https://picsum.photos/400/300?drone=3',
    type: 'High-Altitude Recon',
    fwVersion: 'v1.9.8'
  }
];

const FleetManagement: React.FC = () => {
  const [selectedDrone, setSelectedDrone] = useState<Drone>(mockDrones[0]);

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1">
      {/* Left List */}
      <section className="w-[360px] flex flex-col gap-4 shrink-0 h-full overflow-hidden">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-xl font-display font-medium text-white">Fleet Overview</h2>
          <span className="text-[10px] text-text-muted font-mono mb-1">{mockDrones.length} Units</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[18px]">search</span>
            <input 
              className="w-full bg-panel border border-white/5 rounded-lg py-2 pl-9 pr-3 text-[11px] text-white focus:border-primary placeholder-gray-600 outline-none" 
              placeholder="Search by ID or Name..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="bg-panel border border-white/5 rounded-lg py-1.5 px-3 text-[10px] text-white outline-none">
              <option>Status: All</option>
            </select>
            <select className="bg-panel border border-white/5 rounded-lg py-1.5 px-3 text-[10px] text-white outline-none">
              <option>Health: All</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {mockDrones.map(drone => (
            <div 
              key={drone.id}
              onClick={() => setSelectedDrone(drone)}
              className={`group relative flex flex-col gap-3 rounded-xl p-4 border transition-all cursor-pointer ${
                selectedDrone.id === drone.id 
                  ? 'bg-panel border-primary shadow-[0_0_20px_-5px_rgba(6,182,212,0.1)]' 
                  : 'bg-panel border-white/5 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="size-10 rounded bg-white/10 p-0.5 border border-white/5 flex items-center justify-center overflow-hidden">
                    <img className="w-full h-full object-cover rounded-sm" src={drone.image} alt={drone.name}/>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{drone.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`size-1.5 rounded-full ${
                        drone.status === FleetStatus.ACTIVE ? 'bg-primary' : 
                        drone.status === FleetStatus.IDLE ? 'bg-gray-500' : 'bg-danger'
                      }`}></span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        drone.status === FleetStatus.ACTIVE ? 'text-primary' : 
                        drone.status === FleetStatus.IDLE ? 'text-text-muted' : 'text-danger'
                      }`}>{drone.status}</span>
                    </div>
                  </div>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold border uppercase tracking-wider ${
                  drone.risk === RiskLevel.LOW ? 'bg-success/10 text-success border-success/20' :
                  drone.risk === RiskLevel.MEDIUM ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-danger/10 text-danger border-danger/20'
                }`}>Risk: {drone.risk}</span>
              </div>
              <div className="h-px bg-white/5 w-full"></div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Battery</p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-white text-[14px]">battery_4_bar</span>
                    <span className="text-[11px] font-bold text-white">{drone.battery}%</span>
                  </div>
                  <p className="text-[8px] text-text-muted mt-0.5">14m left</p>
                </div>
                <div>
                  <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Health</p>
                  <span className={`text-[11px] font-bold ${drone.health > 90 ? 'text-success' : 'text-warning'}`}>{drone.health}%</span>
                  <p className="text-[8px] text-text-muted mt-0.5">{drone.cycles} Cycles</p>
                </div>
                <div>
                  <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Link</p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[14px]">wifi</span>
                    <span className="text-[11px] font-bold text-white">{drone.link}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Right Details */}
      <section className="flex-1 bg-panel rounded-2xl border border-white/5 p-8 overflow-y-auto flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row gap-8 pb-8 border-b border-white/5">
          <div className="w-72 h-48 bg-background rounded-xl p-2 flex items-center justify-center relative shrink-0 border border-white/5 overflow-hidden">
            <span className="absolute top-3 right-3 text-gray-400 material-symbols-outlined cursor-pointer hover:text-white transition-colors text-lg">open_in_full</span>
            <img className="w-full h-full object-cover rounded-lg" src={selectedDrone.image} alt={selectedDrone.name}/>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-4xl font-display font-bold text-white mb-2">{selectedDrone.name}</h1>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Connected</span>
                  <span className="bg-background text-text-muted border border-white/5 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{selectedDrone.type}</span>
                  <span className="bg-background text-text-muted border border-white/5 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">FW: {selectedDrone.fwVersion}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${
                  selectedDrone.status === FleetStatus.ACTIVE ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-danger/10 text-danger border-danger/20'
                }`}>
                  <span className="material-symbols-outlined text-[14px] fill-1">check_circle</span>
                  {selectedDrone.status === FleetStatus.ACTIVE ? 'System Optimal' : 'System Critical'}
                </span>
                <span className="text-[10px] text-text-muted font-mono">Last Sync: {selectedDrone.lastSync}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-auto">
              <button className="bg-primary hover:bg-primary/90 text-black font-bold text-xs px-8 py-3 rounded-xl flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                Deploy
              </button>
              <button className="bg-background border border-white/10 text-white hover:bg-white/5 font-bold text-xs px-8 py-3 rounded-xl flex items-center gap-2 transition-all uppercase tracking-widest">
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Predictive Maintenance */}
        <div className="bg-background border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40"></div>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
                <span className="material-symbols-outlined text-primary text-[20px] fill-1">medical_services</span>
              </div>
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Predictive Maintenance</h3>
            </div>
            <button className="text-[10px] font-bold text-white border border-white/10 hover:bg-white/5 px-4 py-2 rounded-lg transition-all uppercase tracking-wider">
              Schedule Maintenance
            </button>
          </div>
          
          <div className="flex flex-col xl:flex-row gap-10">
            <div className="flex-1 flex flex-col gap-8">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[11px] text-text-muted font-medium">Battery Health vs Nominal</span>
                  <span className="text-[11px] font-bold text-emerald-400 font-mono">87%</span>
                </div>
                <div className="h-2 w-full bg-panel rounded-full overflow-hidden p-[1px] border border-white/5">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `87%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-panel/40 rounded-xl p-4 border border-white/5">
                  <p className="text-[9px] text-text-muted uppercase font-bold mb-2 tracking-wider">Next Service</p>
                  <p className="text-3xl font-display font-bold text-white leading-none">12 <span className="text-sm text-text-muted font-body ml-1">Days</span></p>
                </div>
                <div className="bg-panel/40 rounded-xl p-4 border border-white/5">
                  <p className="text-[9px] text-text-muted uppercase font-bold mb-2 tracking-wider">Est. Cycles Left</p>
                  <p className="text-3xl font-display font-bold text-white leading-none">132</p>
                </div>
              </div>
            </div>
            
            <div className="w-full xl:w-96 bg-panel/40 border border-white/5 rounded-xl p-5">
              <p className="text-[9px] text-text-muted uppercase font-bold mb-4 tracking-widest">Anomaly Flags</p>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-emerald-500 text-[18px] fill-1">check_circle</span>
                  <p className="text-[11px] text-gray-300 font-medium">All mechanical systems nominal.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-gray-600 text-[18px]">history</span>
                  <p className="text-[11px] text-text-muted">Minor vibration detected (Motor 3) - Cleared 24h ago.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-gray-600 text-[18px]">history</span>
                  <p className="text-[11px] text-text-muted">GPS drift &lt; 0.5m observed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-[20px]">monitor_heart</span>
             <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Real-time Telemetry</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background border border-white/5 rounded-xl p-5 flex items-center gap-4 group hover:border-primary/20 transition-all">
              <span className="material-symbols-outlined text-gray-500 text-3xl transition-colors group-hover:text-primary">height</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Altitude</span>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-display font-bold text-white">12.4</h3>
                  <span className="text-[10px] text-text-muted font-medium">m</span>
                </div>
              </div>
            </div>
            <div className="bg-background border border-white/5 rounded-xl p-5 flex items-center gap-4 group hover:border-primary/20 transition-all">
              <span className="material-symbols-outlined text-gray-500 text-3xl transition-colors group-hover:text-primary">speed</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Speed</span>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-display font-bold text-white">4.2</h3>
                  <span className="text-[10px] text-text-muted font-medium">m/s</span>
                </div>
              </div>
            </div>
            <div className="bg-background border border-white/5 rounded-xl p-5 flex items-center gap-4 group hover:border-primary/20 transition-all">
              <span className="material-symbols-outlined text-gray-500 text-3xl transition-colors group-hover:text-primary">satellite_alt</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">GPS Sats</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-display font-bold text-white">18</h3>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Lock</span>
                </div>
              </div>
            </div>
            <div className="bg-background border border-white/5 rounded-xl p-5 flex items-center gap-4 group hover:border-primary/20 transition-all">
              <span className="material-symbols-outlined text-gray-500 text-3xl transition-colors group-hover:text-primary">wifi_tethering</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Link Qual</span>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-display font-bold text-emerald-500 font-mono">98%</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FleetManagement;
