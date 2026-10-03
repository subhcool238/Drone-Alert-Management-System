import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/Button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FleetStatus } from '../types';
import { DRONES, getDroneById, getDroneByName, getManualControlBlock } from '../data/drones';

// Drone card subtitle follows the drone's real status
const CARD_STATUS_TEXT: Record<FleetStatus, string> = {
  [FleetStatus.ACTIVE]: 'Autonomous Patrol',
  [FleetStatus.IDLE]: 'Docked / Ready',
  [FleetStatus.CHARGING]: 'Charging',
  [FleetStatus.FAULT]: 'Fault'
};

// Mode banner text and existing colours for a drone that is not Active
const NOT_ACTIVE_BANNER: Record<Exclude<FleetStatus, FleetStatus.ACTIVE>, { text: string; box: string; tone: string; icon: string }> = {
  [FleetStatus.IDLE]: { text: 'Drone docked: ready for deployment', box: 'bg-white/5 border-white/10', tone: 'text-gray-400', icon: 'smart_toy' },
  [FleetStatus.CHARGING]: { text: 'Drone charging: not available for control', box: 'bg-amber-500/10 border-amber-500/20', tone: 'text-warning', icon: 'warning' },
  [FleetStatus.FAULT]: { text: 'Drone in fault: not available for control', box: 'bg-danger/20 border-danger/30', tone: 'text-danger-light', icon: 'warning' }
};

// Link quality colour by number: 80 and above green, 50 to 79 amber, below 50 red
const linkQualityColor = (n: number): string =>
  n >= 80 ? 'text-emerald-500' : n >= 50 ? 'text-amber-500' : 'text-danger-light';

const ManualControl: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected drone defaults to the active mission drone, or the one chosen in Fleet Management
  const [selectedDroneId, setSelectedDroneId] = useState<string>(
    getDroneById(searchParams.get('id') || '')?.id || getDroneByName('Sentinel-1').id
  );
  const selectedDrone = getDroneById(selectedDroneId) || DRONES[0];

  // State for Control Logic
  const [isManual, setIsManual] = useState(false);

  // Health gate: a Fault or Charging drone, or one at 50% battery or less, cannot be taken
  // under manual control. A session already in progress can always be ended.
  const blockReason = getManualControlBlock(selectedDrone);
  const controlsLocked = blockReason !== null && !isManual;
  const lockedTitle = controlsLocked ? `Not available: ${blockReason}` : undefined;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extensionsUsed, setExtensionsUsed] = useState(0);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showPostSessionModal, setShowPostSessionModal] = useState(false);
  
  // Simulated Telemetry
  const [altitude, setAltitude] = useState(12.4);
  const [speed, setSpeed] = useState(8.2);

  // Only an Active drone is in the air; any other status shows 0 m and 0 m/s with empty bars
  const isAirborne = selectedDrone.status === FleetStatus.ACTIVE;
  const shownAltitude = isAirborne ? altitude : 0;
  const shownSpeed = isAirborne ? speed : 0;

  // Mode banner for a drone that is not Active (only while no manual session is running)
  const statusBanner = !isManual && !isAirborne
    ? NOT_ACTIVE_BANNER[selectedDrone.status as Exclude<FleetStatus, FleetStatus.ACTIVE>]
    : null;
  const [proximity, setProximity] = useState(18.5);

  // Battery of the currently selected drone
  const selectedDroneBattery = selectedDrone.battery;
  
  // HUD Timer Effect
  useEffect(() => {
    let interval: any;
    if (isManual) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          // Hard limit at 5 minutes (300s) + extensions
          const limit = 300 + (extensionsUsed * 120);
          if (next >= limit) {
            handleReturnToAutonomy();
            return 0;
          }
          return next;
        });
        
        // Jittery telemetry simulation
        setAltitude(a => a + (Math.random() * 0.2 - 0.1));
        setSpeed(s => Math.max(0, s + (Math.random() * 0.4 - 0.2)));
        setProximity(p => Math.max(0.5, p + (Math.random() * 0.1 - 0.05)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isManual, extensionsUsed]);

  const handleReturnToAutonomy = () => {
    setIsManual(false);
    setElapsedSeconds(0);
    setShowPostSessionModal(true);
  };

  const requestExtension = () => {
    if (extensionsUsed < 3) {
      setShowExtensionModal(true);
    }
  };

  const approveExtension = () => {
    setExtensionsUsed(prev => prev + 1);
    setShowExtensionModal(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progression Logic
  const currentLimit = 300 + (extensionsUsed * 120);
  const secondsLeft = currentLimit - elapsedSeconds;
  const isWarningZone = isManual && secondsLeft <= 180; // 3 mins left
  const isCriticalZone = isManual && secondsLeft <= 60; // 1 min left

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1 bg-background relative">
      
      {/* MODAL: Extension Request */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-panel border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl">hourglass_empty</span>
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-2">Request Extension?</h2>
              <p className="text-xs text-text-muted uppercase font-bold tracking-widest leading-relaxed">
                Team Lead approval required for +2:00 mins override. ({extensionsUsed}/3 used)
              </p>
            </div>
            <div className="p-6 bg-background/50 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setShowExtensionModal(false)} className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Deny</Button>
              <Button variant="primary" onClick={approveExtension} className="py-3 text-xs font-bold uppercase tracking-wider">Approve</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Post Session */}
      {showPostSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-panel border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="size-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <span aria-hidden="true" className="material-symbols-outlined text-success text-3xl">task_alt</span>
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-2">Manual Session Ended</h2>
              <p className="text-xs text-text-muted uppercase font-bold tracking-widest leading-relaxed">
                Control has returned to Autonomy. Resume original route?
              </p>
            </div>
            <div className="p-6 bg-background/50 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => navigate('/patrols')} className="py-3 text-xs font-bold uppercase tracking-wider text-gray-400">New Waypoints</Button>
              <Button variant="success" onClick={() => setShowPostSessionModal(false)} className="py-3 text-xs font-bold uppercase tracking-wider">Resume Patrol</Button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR: Fleet Selector */}
      <aside className="w-80 flex-none flex flex-col bg-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-6">Mission Assets</h2>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            {DRONES.map(d => ({
              id: d.id,
              name: d.name,
              battery: d.battery,
              signal: d.link,
              active: d.id === selectedDroneId,
              status: d.status
            })).map(drone => (
              <div
                key={drone.id}
                onClick={() => setSelectedDroneId(drone.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                  drone.active ? 'bg-primary/5 border-primary/40 shadow-lg shadow-primary/5' : 'bg-background border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span aria-hidden="true" className={`material-symbols-outlined ${drone.active ? 'text-primary' : 'text-text-muted'} text-[22px]`}>flight</span>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-sm tracking-tight">{drone.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-[0.1em] mt-1 ${drone.active ? 'text-primary' : 'text-text-muted'}`}>
                      {drone.active && isManual ? 'Manual Control' : CARD_STATUS_TEXT[drone.status]}
                    </p>
                  </div>
                  <div className={`size-1.5 rounded-full ${drone.active ? 'bg-primary animate-pulse' : 'bg-gray-700'}`}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted border-t border-white/5 mt-4 pt-3 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">battery_horiz_075</span>
                    <span>{drone.battery}%</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${drone.signal === 'Strong' ? 'text-emerald-500' : 'text-text-muted'}`}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">podium</span>
                    <span>{drone.signal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER COLUMN: FPV & Joysticks */}
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Top HUD Feed */}
        <div className="flex-1 bg-panel rounded-3xl border border-white/5 flex flex-col shadow-2xl relative overflow-hidden min-h-[450px]">
          {/* Mode Banner */}
          <div className={`flex-none px-6 py-3 border-b flex items-center justify-between z-10 transition-colors duration-500 ${
            !isManual ? (statusBanner ? statusBanner.box : 'bg-emerald-500/10 border-emerald-500/20') :
            isCriticalZone ? 'bg-danger/20 border-danger/30' :
            isWarningZone ? 'bg-warning/20 border-warning/30' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${
                !isManual ? (statusBanner ? statusBanner.tone : 'text-emerald-500') : isCriticalZone ? 'text-danger-light' : 'text-warning'
              }`}>
                {isManual ? 'warning' : (statusBanner ? statusBanner.icon : 'smart_toy')}
              </span>
              <span className={`font-bold tabular-nums text-xs tracking-[0.1em] uppercase ${
                !isManual ? (statusBanner ? statusBanner.tone : 'text-emerald-500') : isCriticalZone ? 'text-danger-light' : 'text-warning'
              }`}>
                {!isManual ? (statusBanner ? statusBanner.text : 'Mode: Autonomous – Flight path controlled by mission plan') :
                 `Mode: Manual override by Isabelle M. – ${formatTime(elapsedSeconds)} elapsed`}
              </span>
            </div>
            {isManual && (
              <div className="flex items-center gap-4">
                 <div className="text-white font-mono font-bold text-sm bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                   {formatTime(secondsLeft)}
                 </div>
              </div>
            )}
          </div>

          {/* Video Feed Area */}
          <div className="relative flex-1 bg-black w-full h-full overflow-hidden group">
            <div 
              className="absolute inset-0 bg-cover bg-center grayscale brightness-[0.3] transition-all duration-1000 group-hover:brightness-[0.35]" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1200')" }}
            ></div>
            
            {/* HUD Elements */}
            <div className="absolute inset-0 border-[40px] border-transparent pointer-events-none z-10">
               <div className="w-full h-full border border-white/10 relative">
                 {/* Crosshair */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
                   <div className="w-20 h-px bg-primary/60"></div>
                   <div className="h-20 w-px bg-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                   <div className="size-4 border border-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm"></div>
                 </div>
                 
                 {/* Altimeter Ladder Simulation */}
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-4">
                    {[20, 15, 10, 5, 0].map(h => (
                      <div key={h} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white">{h}</span>
                        <div className={`h-px w-3 bg-white/50 ${shownAltitude > h - 2 && shownAltitude < h + 2 ? 'w-6 bg-primary' : ''}`}></div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-8 left-8 flex flex-col gap-1 z-20">
              <div className="text-[12px] font-bold text-white uppercase tracking-widest drop-shadow-lg">{selectedDrone.name} // CAM-01</div>
              <div className="flex gap-3 text-xs font-mono text-text-secondary font-bold uppercase tracking-wider">
                <span>4K @ 60FPS</span>
                <span>ISO 400</span>
                <span>ENC: H.265</span>
              </div>
            </div>
            
            <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-20">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                 <span aria-hidden="true" className={`material-symbols-outlined text-[16px] ${selectedDroneBattery < 20 ? 'text-danger-light' : 'text-primary'}`}>battery_very_low</span>
                 <span className="text-xs font-mono font-bold text-white">{selectedDrone.battery}%</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                 <span aria-hidden="true" className="material-symbols-outlined text-emerald-500 text-[16px]">signal_cellular_alt</span>
                 <span className="text-xs font-mono font-bold text-white">-42 dBm</span>
              </div>
            </div>

            {isWarningZone && (
              <div className="absolute inset-0 border-4 border-warning/20 pointer-events-none animate-pulse"></div>
            )}
            {isCriticalZone && (
              <div className="absolute inset-0 border-8 border-danger/30 pointer-events-none animate-pulse"></div>
            )}

            {/* FPV Controls Bar */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-20">
               <div className="flex flex-col gap-2">
                 <span className="text-xs font-mono text-primary font-bold tracking-[0.12em] uppercase">Telemetry Sync</span>
                 <div className="text-[32px] font-mono font-bold text-white leading-none">
                    {shownAltitude.toFixed(1)} <span className="text-sm text-text-secondary">m AGL</span>
                 </div>
               </div>
               
               <div className="flex flex-wrap justify-end gap-3">
                 {isManual && secondsLeft < 120 && extensionsUsed < 3 && (
                   <Button variant="primary" 
 onClick={requestExtension}
 className="font-bold text-xs px-6 py-3 uppercase tracking-wider shadow-xl shadow-primary/20">
                     Request Extension (+2m)
                   </Button>
                 )}
                 {controlsLocked && (
                   <span className="self-center text-xs font-bold text-gray-300 uppercase tracking-wider">Not available: {blockReason}</span>
                 )}
                 <Button variant="bare"
 onClick={() => isManual ? handleReturnToAutonomy() : setIsManual(true)}
 disabled={controlsLocked}
 title={lockedTitle}
 className={`px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed ${ isManual ? 'bg-danger-strong text-white shadow-danger/20' : 'bg-white text-black hover:bg-primary hover:text-black shadow-white/10 disabled:hover:bg-white' } rounded-lg min-h-[32px]`}>
                   {isManual ? 'Return to Autonomy' : 'Take Manual Control'}
                 </Button>
               </div>
            </div>
          </div>
        </div>

        {/* Joysticks Area */}
        <div className="h-64 bg-panel rounded-3xl border border-white/5 p-8 flex shadow-2xl relative overflow-hidden shrink-0">
          <div className="flex-1 flex items-center justify-around">
            {/* Left Joystick: Throttle/Yaw */}
            <div className="flex flex-col items-center gap-4">
              <div className="size-36 rounded-full bg-background border border-white/10 flex items-center justify-center relative shadow-inner group cursor-crosshair">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-white/5"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/5"></div>
                 <div className="size-14 rounded-full bg-panel border border-primary/20 shadow-2xl transform translate-y-4 group-active:-translate-y-10 transition-transform duration-300"></div>
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Throttle / Yaw</span>
            </div>

            {/* Center Switch */}
            <div className="flex flex-col items-center gap-6">
               <div className="flex flex-col gap-1 items-center">
                 <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Control Mode</span>
                 <div className="bg-background/80 p-1.5 rounded-2xl border border-white/10 flex gap-1">
                   <Button variant="segment" onClick={() => setIsManual(false)} disabled={controlsLocked} title={lockedTitle} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider ${!isManual ? 'bg-primary text-black' : 'text-text-muted hover:text-white'}`}>Auto</Button>
                   <Button variant="segment" onClick={() => setIsManual(true)} disabled={controlsLocked} title={lockedTitle} className={`px-5 py-2 text-xs font-bold uppercase tracking-wider ${isManual ? 'bg-amber-500 text-black' : 'text-text-muted hover:text-white'}`}>Manual</Button>
                 </div>
               </div>
               <div className="size-1 bg-white/5 rounded-full"></div>
            </div>

            {/* Right Joystick: Pitch/Roll */}
            <div className="flex flex-col items-center gap-4">
              <div className="size-36 rounded-full bg-background border border-white/10 flex items-center justify-center relative shadow-inner group cursor-crosshair">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-white/5"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/5"></div>
                 <div className="size-14 rounded-full bg-panel border border-primary/20 shadow-2xl transition-transform group-active:translate-x-4"></div>
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Pitch / Roll</span>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Detailed Stats & Safety */}
      <aside className="w-80 flex-none flex flex-col gap-6">
        <div className="bg-panel rounded-2xl border border-white/5 p-6 shadow-2xl">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-6 flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary">analytics</span> Telemetry
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-xs text-gray-400 font-medium">Altitude (AGL)</span>
              <div className="font-mono text-white text-xl font-bold tracking-tight">{shownAltitude.toFixed(1)} <span className="text-xs text-text-muted uppercase">m</span></div>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
              <div className="bg-primary h-full shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all duration-300" style={{ width: `${(shownAltitude/50)*100}%` }}></div>
            </div>
            
            <div className="flex justify-between items-end">
              <span className="text-xs text-gray-400 font-medium">Ground Speed</span>
              <div className="font-mono text-amber-500 text-xl font-bold tracking-tight">{shownSpeed.toFixed(1)} <span className="text-xs text-text-muted uppercase">m/s</span></div>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
              <div className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all duration-300" style={{ width: `${(shownSpeed/20)*100}%` }}></div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
               <div className="flex flex-col gap-1">
                 <span className="text-xs text-text-muted font-bold uppercase tracking-wider">GPS Locked</span>
                 <span className="text-white font-mono font-bold text-lg">18 Sats</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Link Quality</span>
                 <span className={`${linkQualityColor(selectedDrone.linkStrength)} font-mono font-bold text-lg`}>{selectedDrone.linkStrength}%</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl border border-white/5 p-6 shadow-2xl">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-4 flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary">security</span> Safety Systems
          </h2>
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isAirborne && proximity < 5 ? 'bg-danger/10 border-danger/30' : 'bg-background border-white/5'}`}>
              <span aria-hidden="true" className={`material-symbols-outlined ${!isAirborne ? 'text-text-muted' : proximity < 5 ? 'text-danger-light' : 'text-emerald-500'}`}>sensors</span>
              <div className="flex-1">
                 <p className="text-xs font-bold text-white uppercase tracking-wider">Proximity</p>
                 <p className="text-xs text-text-muted font-medium mt-0.5">{!isAirborne ? 'Not in flight' : proximity < 5 ? `Obstacle at ${proximity.toFixed(1)}m` : 'Clear Path'}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-background border border-white/5 flex items-center gap-4">
              <span aria-hidden="true" className={`material-symbols-outlined ${isAirborne ? 'text-emerald-500' : 'text-text-muted'}`}>public</span>
              <div className="flex-1">
                 <p className="text-xs font-bold text-white uppercase tracking-wider">Geofence Status</p>
                 <p className="text-xs text-text-muted font-medium mt-0.5">{isAirborne ? 'Clear - Within Perimeter' : 'Not in flight'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end bg-panel rounded-2xl border border-white/5 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-danger/5 pointer-events-none"></div>
          <div className="flex items-start gap-3 mb-6 bg-background/60 p-3 rounded-xl border border-white/10">
             <span aria-hidden="true" className="material-symbols-outlined text-danger-light text-[18px]">warning</span>
             <p className="text-xs text-gray-400 font-bold uppercase leading-relaxed tracking-tight">
               Emergency actions immediately override all mission logic and safety buffers.
             </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Button variant="secondary" className="bg-background text-white font-bold py-3.5 text-xs uppercase tracking-wider">Return Home</Button>
            <Button variant="secondary" className="bg-background text-white font-bold py-3.5 text-xs uppercase tracking-wider">Hover Lock</Button>
          </div>
          <Button variant="danger" className="w-full font-bold py-4 text-xs uppercase tracking-[0.12em] shadow-xl shadow-danger/20">
            EMERGENCY STOP
          </Button>
          <Button variant="danger-outline" className="w-full mt-3 bg-background font-bold py-3.5 text-xs uppercase tracking-wider">
            Declare Emergency
          </Button>
        </div>
      </aside>
    </div>
  );
};

export default ManualControl;