
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    link: '98%',
    linkStrength: 98,
    cycles: 132,
    cyclesRemaining: 1868,
    lastSync: '2s ago',
    image: 'https://picsum.photos/400/300?drone=1',
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
    link: '82%',
    linkStrength: 82,
    cycles: 450,
    cyclesRemaining: 1550,
    lastSync: '10m ago',
    image: 'https://picsum.photos/400/300?drone=2',
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
    link: 'Lost',
    linkStrength: 0,
    cycles: 1205,
    cyclesRemaining: 795,
    lastSync: '1h ago',
    image: 'https://picsum.photos/400/300?drone=3',
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
  const [selectedDrone, setSelectedDrone] = useState<Drone>(mockDrones[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [healthFilter, setHealthFilter] = useState('All');

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

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1 relative">
      {/* LEFT LIST */}
      <section className="w-[360px] flex flex-col gap-4 shrink-0 h-full overflow-hidden">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Fleet Overview</h2>
          <span className="text-[10px] text-gray-500 font-mono mb-1 uppercase tracking-widest">{filteredDrones.length} Units</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[18px]">search</span>
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-panel border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-[11px] text-white focus:border-primary placeholder-gray-600 outline-none" 
              placeholder="Search by ID or Name..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-panel border border-white/5 rounded-lg px-2 py-2 text-[10px] text-white outline-none">
              <option>Status: All</option>
              <option>Active</option>
              <option>Idle</option>
              <option>Charging</option>
              <option>Fault</option>
            </select>
            <select value={healthFilter} onChange={e => setHealthFilter(e.target.value)} className="bg-panel border border-white/5 rounded-lg px-2 py-2 text-[10px] text-white outline-none">
              <option>Health: All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">
          {filteredDrones.map(drone => (
            <div 
              key={drone.id}
              onClick={() => setSelectedDrone(drone)}
              className={`flex flex-col gap-3 rounded-xl p-4 border transition-all cursor-pointer ${
                selectedDrone.id === drone.id ? 'bg-primary/5 border-primary' : 'bg-panel border-white/5 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="size-10 rounded-lg bg-background border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    <img className="w-full h-full object-cover" src={drone.image} alt={drone.name}/>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{drone.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`size-1.5 rounded-full ${drone.status === FleetStatus.ACTIVE ? 'bg-primary animate-pulse' : 'bg-gray-500'}`}></span>
                      <span className={`text-[10px] font-bold uppercase ${drone.status === FleetStatus.ACTIVE ? 'text-primary' : 'text-gray-500'}`}>{drone.status}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 text-[8px] font-bold border uppercase ${drone.health < 60 ? 'text-danger border-danger/20' : 'text-gray-500 border-white/10'}`}>
                  Score: {drone.health}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-3">
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase font-bold">Battery</span>
                  <span className="text-[11px] font-bold text-white">{drone.battery}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase font-bold">Link</span>
                  <span className="text-[11px] font-bold text-white">{drone.link}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase font-bold">Risk</span>
                  <span className={`text-[11px] font-bold ${drone.risk === RiskLevel.HIGH ? 'text-danger' : 'text-success'}`}>{drone.risk}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT DETAILS */}
      <section className="flex-1 bg-panel rounded-2xl border border-white/5 p-8 overflow-y-auto flex flex-col gap-10 custom-scrollbar">
        <div className="flex flex-col xl:flex-row gap-10 pb-10 border-b border-white/5">
          <div className="w-full xl:w-[400px] h-64 bg-background rounded-2xl overflow-hidden border border-white/5 relative group">
            <img className="w-full h-full object-cover opacity-80" src={selectedDrone.image} alt={selectedDrone.name}/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-display font-bold text-white">{selectedDrone.name}</h1>
                  <span className="text-xl font-mono text-gray-500 font-bold">[{selectedDrone.id}]</span>
                </div>
                <div className="flex gap-3">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Connected</span>
                  <span className="bg-background text-gray-400 border border-white/10 text-[10px] font-bold px-3 py-1 rounded-full uppercase">{selectedDrone.type}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-2xl font-display font-bold text-white leading-none">{selectedDrone.battery}%</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedDrone.batteryTimeRemaining} Remaining</div>
              </div>
            </div>

            <div className="flex gap-4 mt-auto">
              <button onClick={() => navigate('/manual')} className="bg-primary hover:bg-primary/90 text-black font-bold text-[11px] px-12 py-4 rounded-xl flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[18px]">rocket_launch</span> Deploy Mission
              </button>
              <button className="bg-background border border-white/10 text-white hover:bg-white/5 font-bold text-[11px] px-12 py-4 rounded-xl flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-[18px]">settings</span> Configure
              </button>
            </div>
          </div>
        </div>

        {/* PREDICTIVE MAINTENANCE DIAGNOSTICS */}
        <div className="bg-background/40 border border-white/5 rounded-2xl p-8 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${getHealthBg(selectedDrone.health)} shadow-lg shadow-black/50`}></div>
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[24px]">medical_services</span>
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Predictive Diagnostics</h3>
                <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">AI-Powered Fleet Intelligence</p>
              </div>
            </div>
            <button className="text-[11px] font-bold text-white border border-white/10 hover:bg-white/5 px-6 py-3 rounded-xl uppercase tracking-widest transition-all">
              Schedule Service
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Health Score vs Nominal Capacity</span>
                  <span className={`text-xl font-display font-bold ${getHealthColor(selectedDrone.health)}`}>{selectedDrone.health}%</span>
                </div>
                <div className="h-3 w-full bg-panel rounded-full overflow-hidden border border-white/10">
                  <div className={`h-full rounded-full transition-all duration-1000 ${getHealthBg(selectedDrone.health)}`} style={{ width: `${selectedDrone.health}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-bold uppercase">
                  <span>Current: {selectedDrone.health}%</span>
                  <span>Nominal: {selectedDrone.nominalCapacity}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-panel/40 rounded-2xl p-6 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-3 tracking-widest">Next Service Window</p>
                  <p className="text-4xl font-display font-bold text-white">{selectedDrone.nextServiceHours} <span className="text-sm text-gray-500">HRS</span></p>
                </div>
                <div className="bg-panel/40 rounded-2xl p-6 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-3 tracking-widest">Cycle Lifetime Remaining</p>
                  <p className="text-4xl font-display font-bold text-white">{selectedDrone.cyclesRemaining}</p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 bg-panel/30 border border-white/5 rounded-2xl p-6 flex flex-col">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-6 tracking-widest border-b border-white/5 pb-3">Anomaly Detection Flags</p>
              <div className="space-y-4">
                {selectedDrone.anomalies.map((a, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className={`material-symbols-outlined text-[18px] ${selectedDrone.health < 60 ? 'text-danger' : 'text-emerald-500'}`}>
                      {selectedDrone.health < 60 ? 'warning' : 'check_circle'}
                    </span>
                    <p className="text-[12px] font-medium leading-relaxed text-gray-400">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TELEMETRY GRID */}
        <div className="space-y-6">
          <h3 className="text-[12px] font-bold text-white uppercase tracking-[0.2em]">Live Flight Metrics</h3>
          <div className="grid grid-cols-4 gap-6">
            {[
              { icon: 'history', label: 'Flight Time Today', val: selectedDrone.flightTimeToday, unit: '' },
              { icon: 'speed', label: 'Ground Speed', val: selectedDrone.avgSpeed, unit: 'm/s' },
              { icon: 'satellite_alt', label: 'GPS Satellites', val: 18, unit: 'Locked' },
              { icon: 'wifi_tethering', label: 'Link Strength', val: selectedDrone.linkStrength, unit: '%' }
            ].map((stat, i) => (
              <div key={i} className="bg-background border border-white/10 rounded-2xl p-6 flex flex-col gap-4 group hover:border-primary/40 transition-all">
                <span className="material-symbols-outlined text-gray-500 text-[24px] group-hover:text-primary">{stat.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-3xl font-display font-bold text-white">{stat.val}</h3>
                    <span className="text-[11px] text-gray-500 font-bold uppercase">{stat.unit}</span>
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
