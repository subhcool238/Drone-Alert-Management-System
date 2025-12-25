import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ManualControl: React.FC = () => {
  const navigate = useNavigate();
  
  // State for Control Logic
  const [isManual, setIsManual] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extensionsUsed, setExtensionsUsed] = useState(0);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showPostSessionModal, setShowPostSessionModal] = useState(false);
  
  // Simulated Telemetry
  const [altitude, setAltitude] = useState(12.4);
  const [speed, setSpeed] = useState(8.2);
  const [proximity, setProximity] = useState(18.5);

  // Added missing variable for the active drone battery status
  const selectedDroneBattery = 78;
  
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
                <span className="material-symbols-outlined text-primary text-3xl">hourglass_empty</span>
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-2">Request Extension?</h2>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest leading-relaxed">
                Supervisor approval required for +2:00 mins override. ({extensionsUsed}/3 used)
              </p>
            </div>
            <div className="p-6 bg-background/50 grid grid-cols-2 gap-3">
              <button onClick={() => setShowExtensionModal(false)} className="py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400">Deny</button>
              <button onClick={approveExtension} className="py-3 rounded-xl bg-primary text-black text-[10px] font-bold uppercase tracking-widest">Approve</button>
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
                <span className="material-symbols-outlined text-success text-3xl">task_alt</span>
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-2">Manual Session Ended</h2>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest leading-relaxed">
                Control has returned to Autonomy. Resume original route?
              </p>
            </div>
            <div className="p-6 bg-background/50 grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/patrols')} className="py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400">New Waypoints</button>
              <button onClick={() => setShowPostSessionModal(false)} className="py-3 rounded-xl bg-success text-black text-[10px] font-bold uppercase tracking-widest">Resume Patrol</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR: Fleet Selector */}
      <aside className="w-80 flex-none flex flex-col bg-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Mission Assets</h2>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            {[
              { id: 'D-01', name: 'Sentinel-1', battery: 78, signal: 'Strong', active: true },
              { id: 'D-02', name: 'Watcher-3', battery: 100, signal: 'Good', active: false },
              { id: 'D-03', name: 'Surveyor-X', battery: 12, signal: 'Weak', active: false },
            ].map(drone => (
              <div 
                key={drone.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                  drone.active ? 'bg-primary/5 border-primary/40 shadow-lg shadow-primary/5' : 'bg-background border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`material-symbols-outlined ${drone.active ? 'text-primary' : 'text-gray-600'} text-[22px]`}>flight</span>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-sm tracking-tight">{drone.name}</h3>
                    <p className={`text-[9px] font-bold uppercase tracking-[0.1em] mt-1 ${drone.active ? 'text-primary' : 'text-gray-600'}`}>
                      {drone.active ? (isManual ? 'Manual Control' : 'Autonomous Patrol') : 'Docked / Ready'}
                    </p>
                  </div>
                  <div className={`size-1.5 rounded-full ${drone.active ? 'bg-primary animate-pulse' : 'bg-gray-700'}`}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 mt-4 pt-3 font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">battery_horiz_075</span>
                    <span>{drone.battery}%</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${drone.signal === 'Strong' ? 'text-emerald-500' : 'text-gray-500'}`}>
                    <span className="material-symbols-outlined text-[16px]">podium</span>
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
            !isManual ? 'bg-emerald-500/10 border-emerald-500/20' : 
            isCriticalZone ? 'bg-danger/20 border-danger/30 animate-pulse' :
            isWarningZone ? 'bg-warning/20 border-warning/30' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[18px] ${
                !isManual ? 'text-emerald-500' : isCriticalZone ? 'text-danger' : 'text-warning'
              }`}>
                {isManual ? 'warning' : 'smart_toy'}
              </span>
              <span className={`font-bold text-[10px] tracking-[0.15em] uppercase ${
                !isManual ? 'text-emerald-500' : isCriticalZone ? 'text-danger' : 'text-warning'
              }`}>
                {!isManual ? 'Mode: Autonomous – Flight path controlled by mission plan' : 
                 `Mode: Manual override by Isabelle R. – ${formatTime(elapsedSeconds)} elapsed`}
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
              className="absolute inset-0 bg-cover bg-center grayscale brightness-[0.4] transition-all duration-1000 group-hover:brightness-50" 
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
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-4 opacity-50">
                    {[20, 15, 10, 5, 0].map(h => (
                      <div key={h} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white">{h}</span>
                        <div className={`h-px w-3 bg-white ${altitude > h - 2 && altitude < h + 2 ? 'w-6 bg-primary' : ''}`}></div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-8 left-8 flex flex-col gap-1 z-20">
              <div className="text-[12px] font-display font-bold text-white uppercase tracking-widest drop-shadow-lg">Sentinel-1 // CAM-01</div>
              <div className="flex gap-3 text-[9px] font-mono text-white/60 font-bold uppercase tracking-widest">
                <span>4K @ 60FPS</span>
                <span>ISO 400</span>
                <span>ENC: H.265</span>
              </div>
            </div>
            
            <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-20">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                 <span className={`material-symbols-outlined text-[16px] ${selectedDroneBattery < 20 ? 'text-danger' : 'text-primary'}`}>battery_very_low</span>
                 <span className="text-[11px] font-mono font-bold text-white">78%</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                 <span className="material-symbols-outlined text-emerald-500 text-[16px]">signal_cellular_alt</span>
                 <span className="text-[11px] font-mono font-bold text-white">-42 dBm</span>
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
                 <span className="text-[10px] font-mono text-primary font-bold tracking-[0.2em] uppercase">Telemetry Sync</span>
                 <div className="text-[32px] font-display font-bold text-white leading-none">
                    {altitude.toFixed(1)} <span className="text-sm text-gray-400">m AGL</span>
                 </div>
               </div>
               
               <div className="flex gap-3">
                 {isManual && secondsLeft < 120 && extensionsUsed < 3 && (
                   <button 
                    onClick={requestExtension}
                    className="bg-primary hover:bg-primary/90 text-black font-bold text-[11px] px-6 py-3 rounded-xl transition-all uppercase tracking-widest shadow-xl shadow-primary/20"
                   >
                     Request Extension (+2m)
                   </button>
                 )}
                 <button 
                   onClick={() => isManual ? handleReturnToAutonomy() : setIsManual(true)}
                   className={`px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-2xl ${
                     isManual ? 'bg-danger text-white shadow-danger/20' : 'bg-white text-black hover:bg-primary hover:text-black shadow-white/10'
                   }`}
                 >
                   {isManual ? 'Return to Autonomy' : 'Take Manual Control'}
                 </button>
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
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Throttle / Yaw</span>
            </div>

            {/* Center Switch */}
            <div className="flex flex-col items-center gap-6">
               <div className="flex flex-col gap-1 items-center">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Control Mode</span>
                 <div className="bg-background/80 p-1.5 rounded-2xl border border-white/10 flex gap-1">
                   <button onClick={() => setIsManual(false)} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${!isManual ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}>Auto</button>
                   <button onClick={() => setIsManual(true)} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isManual ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-white'}`}>Manual</button>
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
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Pitch / Roll</span>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Detailed Stats & Safety */}
      <aside className="w-80 flex-none flex flex-col gap-6">
        <div className="bg-panel rounded-2xl border border-white/5 p-6 shadow-2xl">
          <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">analytics</span> Telemetry
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-xs text-gray-400 font-medium">Altitude (AGL)</span>
              <div className="font-display text-white text-xl font-bold tracking-tight">{altitude.toFixed(1)} <span className="text-[10px] text-gray-500 uppercase">m</span></div>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
              <div className="bg-primary h-full shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all duration-300" style={{ width: `${(altitude/50)*100}%` }}></div>
            </div>
            
            <div className="flex justify-between items-end">
              <span className="text-xs text-gray-400 font-medium">Ground Speed</span>
              <div className="font-display text-amber-500 text-xl font-bold tracking-tight">{speed.toFixed(1)} <span className="text-[10px] text-gray-500 uppercase">m/s</span></div>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-white/5">
              <div className="bg-amber-500 h-full shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-all duration-300" style={{ width: `${(speed/20)*100}%` }}></div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">GPS Locked</span>
                 <span className="text-white font-display font-bold text-lg">18 Sats</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Link Quality</span>
                 <span className="text-emerald-500 font-display font-bold text-lg">98%</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-panel rounded-2xl border border-white/5 p-6 shadow-2xl">
          <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">security</span> Safety Systems
          </h2>
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${proximity < 5 ? 'bg-danger/10 border-danger/30' : 'bg-background border-white/5'}`}>
              <span className={`material-symbols-outlined ${proximity < 5 ? 'text-danger animate-pulse' : 'text-emerald-500'}`}>sensors</span>
              <div className="flex-1">
                 <p className="text-[10px] font-bold text-white uppercase tracking-widest">Proximity</p>
                 <p className="text-[10px] text-gray-500 font-medium mt-0.5">{proximity < 5 ? `Obstacle at ${proximity.toFixed(1)}m` : 'Clear Path'}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-background border border-white/5 flex items-center gap-4">
              <span className="material-symbols-outlined text-emerald-500">public</span>
              <div className="flex-1">
                 <p className="text-[10px] font-bold text-white uppercase tracking-widest">Geofence Status</p>
                 <p className="text-[10px] text-gray-500 font-medium mt-0.5">Clear - Within Perimeter</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end bg-panel rounded-2xl border border-white/5 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-danger/5 pointer-events-none"></div>
          <div className="flex items-start gap-3 mb-6 bg-background/60 p-3 rounded-xl border border-white/10">
             <span className="material-symbols-outlined text-danger text-[18px]">warning</span>
             <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed tracking-tight">
               Emergency actions immediately override all mission logic and safety buffers.
             </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button className="bg-background border border-white/10 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">Return Home</button>
            <button className="bg-background border border-white/10 text-white font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">Hover Lock</button>
          </div>
          <button className="w-full bg-danger text-white font-bold py-4 rounded-xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-danger/20 hover:brightness-110 transition-all">
            EMERGENCY STOP
          </button>
          <button className="w-full mt-3 bg-background border border-danger/30 text-danger font-bold py-3.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-danger/10 transition-all">
            Declare Emergency
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ManualControl;