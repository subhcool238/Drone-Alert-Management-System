
import React, { useState, useEffect } from 'react';
import Button from './components/Button';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ModalOverlay from './components/ModalOverlay';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/FleetManagement';
import ManualControl from './pages/ManualControl';
import PatrolRoutes from './pages/PatrolRoutes';
import Incidents from './pages/Incidents';
import Settings from './pages/Settings';
import { DRONES, STATUS_LABEL, STATUS_DOT } from './data/drones';
import { COVERAGE_GAP } from './data/patrols';

const ShiftHandoverModal: React.FC<{ onAcknowledge: () => void }> = ({ onAcknowledge }) => {
  const [checked, setChecked] = useState(false);

  return (
    <ModalOverlay labelledBy="handover-title" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
      <div className="bg-panel border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-white/5 shrink-0">
          <h2 id="handover-title" className="text-4xl font-display font-bold text-white tracking-tighter">Shift Handover Briefing</h2>
          <p className="text-xs text-primary font-bold uppercase tracking-[0.12em] mt-2">Required Action: System State Synchronization</p>
        </div>

        <div tabIndex={0} role="region" aria-label="Briefing details" className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          {/* Recent Incidents */}
          <section>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-6 flex items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-lg">history</span> Recent Incidents (Last 12h)
            </h3>
            <div className="space-y-3">
              {[
                { time: '22:14', type: 'Motion', zone: 'West Corridor', sev: 'CRITICAL', status: 'False alarm - HVAC' },
                { time: '18:30', type: 'Vibration', zone: 'HVAC unit', sev: 'MEDIUM', status: 'False alarm, auto-dispatch' },
                { time: '15:02', type: 'Intruder', zone: 'Perimeter Alpha', sev: 'HIGH', status: 'Resolved by Drone Dispatch' }
              ].map((inc, i) => (
                <div key={i} className="bg-background border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-mono text-text-muted">{inc.time}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{inc.type}: {inc.zone}</span>
                      <span className="text-xs text-text-muted font-bold uppercase mt-0.5">{inc.status}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-lg ${inc.sev === 'CRITICAL' ? 'bg-danger/20 text-danger-light' : 'bg-primary/20 text-primary'}`}>{inc.sev}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Fleet Snapshot */}
          <section>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-6 flex items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-lg">flight_takeoff</span> Fleet Snapshot
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {DRONES.map(drone => ({
                name: drone.name,
                battery: drone.battery,
                status: STATUS_LABEL[drone.status],
                color: STATUS_DOT[drone.status]
              })).map((d, i) => (
                <div key={i} className="bg-background border border-white/5 p-5 rounded-2xl text-center space-y-3">
                  <p className="text-xs font-black text-white uppercase tracking-wider">{d.name}</p>
                  <div className="text-2xl font-display font-bold text-white">{d.battery}%</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`size-1.5 rounded-full ${d.color}`}></span>
                    <span className="text-xs text-text-muted font-bold uppercase">{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Guard & Patrol Status */}
          <section>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-6 flex items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-lg">shield</span> Guard & Patrol Status
            </h3>
            <div className="bg-danger/5 border border-danger/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-tight">Perimeter Alpha</span>
                <span className="text-xs font-bold text-emerald-500 uppercase">Staffed (Pierre L.)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-danger-light uppercase tracking-tight">{COVERAGE_GAP.zone}</span>
                <span className="text-xs font-bold text-danger-light uppercase">Unpatrolled for {COVERAGE_GAP.minutes} min</span>
              </div>
            </div>
          </section>

          {/* Director's Notes */}
          <section>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-6 flex items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-lg">sticky_note_2</span> Director's Notes
            </h3>
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl">
              <p className="text-sm text-gray-300 italic leading-relaxed font-medium">
                "Prioritize West Storage tonight – Picasso delivery; accept slightly higher false-alarm tolerance there. Keep Sentinel-1 dedicated to the roof corridor."
                <br/>
                <span className="text-xs text-indigo-400 font-black uppercase mt-4 block">— Marc, Security Director</span>
              </p>
            </div>
          </section>
        </div>

        <div className="p-10 border-t border-white/5 bg-background/50 shrink-0 flex items-center justify-between">
          <label className="flex items-center gap-4 cursor-pointer group">
            <input 
              type="checkbox" 
              data-autofocus
              checked={checked} 
              onChange={() => setChecked(!checked)}
              className="size-6 rounded-lg bg-background border-white/10 text-primary focus:ring-primary focus:ring-offset-0 transition-all"
            />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">I have reviewed and understood this briefing.</span>
          </label>
          <Button variant="bare" 
 disabled={!checked}
 onClick={onAcknowledge}
 className={`px-10 py-4 text-xs font-bold uppercase tracking-[0.12em] transition-all shadow-2xl ${ checked ? 'bg-primary text-black shadow-primary/20' : 'bg-white/5 text-text-muted cursor-not-allowed' } rounded-lg min-h-[32px]`}>
            Acknowledge & go to Dashboard
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
};

const ShiftContextBar: React.FC<{ onOpenBriefing: () => void }> = ({ onOpenBriefing }) => {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 bg-panel/50 border border-white/5 rounded-2xl px-6 py-1.5 shrink-0 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
          <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">dark_mode</span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">Night Shift 22:00–06:00</span>
          <span className="text-xs text-text-muted font-bold uppercase">— Isabelle</span>
        </div>
        <div className="h-4 w-px bg-white/5 shrink-0"></div>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-indigo-400 font-black uppercase tracking-wider shrink-0">Priority:</span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-tight truncate">West Storage (Picasso delivery)</span>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
        <Button variant="text" onClick={onOpenBriefing} className="text-xs font-bold text-text-muted uppercase tracking-wider hover:text-white">[View briefing]</Button>
        <Button variant="text" className="text-xs font-bold text-text-muted uppercase tracking-wider hover:text-white">[Message previous shift]</Button>
      </div>
    </div>
  );
};

// Page title for the document title and the (visually hidden) page heading
const PAGE_TITLES: [string, string][] = [
  ['/fleet', 'Fleet Management'],
  ['/manual', 'Manual Control'],
  ['/patrols', 'Patrol Routes'],
  ['/incidents', 'Incidents'],
  ['/settings', 'System Settings']
];

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? 'Dashboard';
  useEffect(() => {
    document.title = `${pageTitle} | FlytBase Security Ops`;
  }, [pageTitle]);
  const [hasAcknowledgedBriefing, setHasAcknowledgedBriefing] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(true);

  const handleAcknowledge = () => {
    setHasAcknowledgedBriefing(true);
    setShowBriefingModal(false);
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden text-gray-100">
      <a
        href="#main-content"
        onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black"
      >
        Skip to main content
      </a>
      {showBriefingModal && <ShiftHandoverModal onAcknowledge={handleAcknowledge} />}
      
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-hidden relative p-6 flex flex-col focus:outline-none">
          <h1 className="sr-only">{pageTitle}</h1>
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
