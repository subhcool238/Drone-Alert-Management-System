
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/FleetManagement';
import ManualControl from './pages/ManualControl';
import PatrolRoutes from './pages/PatrolRoutes';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';

const ShiftHandoverModal: React.FC<{ onAcknowledge: () => void }> = ({ onAcknowledge }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
      <div className="bg-panel border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-white/5 shrink-0">
          <h2 className="text-4xl font-display font-bold text-white tracking-tighter">Shift Handover Briefing</h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-2">Required Action: System State Synchronization</p>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          {/* Recent Incidents */}
          <section>
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">history</span> Recent Incidents (Last 12h)
            </h4>
            <div className="space-y-3">
              {[
                { time: '22:14', type: 'Motion', zone: 'Storage B', sev: 'CRITICAL', status: 'False alarm – HVAC' },
                { time: '18:30', type: 'Vibration', zone: 'Sector 4', sev: 'MEDIUM', status: 'Resolved in 2:14 by Pierre' },
                { time: '14:02', type: 'Intruder', zone: 'Perimeter Alpha', sev: 'HIGH', status: 'Resolved by Drone Dispatch' }
              ].map((inc, i) => (
                <div key={i} className="bg-background border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-mono text-gray-600">{inc.time}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{inc.type}: {inc.zone}</span>
                      <span className="text-[9px] text-gray-600 font-bold uppercase mt-0.5">{inc.status}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-lg ${inc.sev === 'CRITICAL' ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>{inc.sev}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Fleet Snapshot */}
          <section>
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">flight_takeoff</span> Fleet Snapshot
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Sentinel-1', battery: 78, status: 'Active', color: 'bg-emerald-500' },
                { name: 'Sentinel-2', battery: 100, status: 'Idle', color: 'bg-primary' },
                { name: 'Sentinel-3', battery: 12, status: 'Charging', color: 'bg-warning' },
                { name: 'Sentinel-4', battery: 0, status: 'Fault', color: 'bg-danger' }
              ].map((d, i) => (
                <div key={i} className="bg-background border border-white/5 p-5 rounded-2xl text-center space-y-3">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">{d.name}</p>
                  <div className="text-2xl font-display font-bold text-white">{d.battery}%</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`size-1.5 rounded-full ${d.color}`}></span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Guard & Patrol Status */}
          <section>
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">shield</span> Guard & Patrol Status
            </h4>
            <div className="bg-danger/5 border border-danger/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-tight">Perimeter Alpha</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Staffed (Pierre L.)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-danger uppercase tracking-tight">Storage Room 4</span>
                <span className="text-[10px] font-bold text-danger uppercase animate-pulse">Unpatrolled for 75 min</span>
              </div>
            </div>
          </section>

          {/* Supervisor Notes */}
          <section>
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">sticky_note_2</span> Director / Supervisor Notes
            </h4>
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl">
              <p className="text-sm text-gray-300 italic leading-relaxed font-medium">
                "Prioritize West Storage tonight – Picasso delivery; accept slightly higher false-alarm tolerance there. Keep Sentinel-1 dedicated to the roof corridor."
                <br/>
                <span className="text-[10px] text-indigo-400 font-black uppercase mt-4 block">— Marc, Shift Supervisor</span>
              </p>
            </div>
          </section>
        </div>

        <div className="p-10 border-t border-white/5 bg-background/50 shrink-0 flex items-center justify-between">
          <label className="flex items-center gap-4 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={checked} 
              onChange={() => setChecked(!checked)}
              className="size-6 rounded-lg bg-background border-white/10 text-primary focus:ring-primary focus:ring-offset-0 transition-all"
            />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">I have reviewed and understood this briefing.</span>
          </label>
          <button 
            disabled={!checked}
            onClick={onAcknowledge}
            className={`px-10 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-2xl ${
              checked ? 'bg-primary text-black shadow-primary/20' : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            Acknowledge & go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const ShiftContextBar: React.FC<{ onOpenBriefing: () => void }> = ({ onOpenBriefing }) => {
  return (
    <div className="mb-6 flex items-center justify-between bg-panel/50 border border-white/5 rounded-2xl px-6 py-3 shrink-0 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">dark_mode</span>
          <span className="text-[11px] font-bold text-white uppercase tracking-widest">Night Shift 22:00–06:00</span>
          <span className="text-[11px] text-gray-600 font-bold uppercase">— Isabelle</span>
        </div>
        <div className="h-4 w-px bg-white/5"></div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Priority:</span>
          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tight">West Storage (Picasso delivery)</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onOpenBriefing} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">[View briefing]</button>
        <button className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">[Message previous shift]</button>
      </div>
    </div>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasAcknowledgedBriefing, setHasAcknowledgedBriefing] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(true);

  const handleAcknowledge = () => {
    setHasAcknowledgedBriefing(true);
    setShowBriefingModal(false);
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden text-gray-100">
      {showBriefingModal && <ShiftHandoverModal onAcknowledge={handleAcknowledge} />}
      
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />
        <main className="flex-1 overflow-hidden relative p-6 flex flex-col">
          {hasAcknowledgedBriefing && <ShiftContextBar onOpenBriefing={() => setShowBriefingModal(true)} />}
          <div className="flex-1 w-full min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fleet" element={<FleetManagement />} />
          <Route path="/manual" element={<ManualControl />} />
          <Route path="/patrols" element={<PatrolRoutes />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/settings/*" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </HashRouter>
  );
};

export default App;
