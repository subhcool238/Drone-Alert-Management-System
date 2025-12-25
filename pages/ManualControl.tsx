
import React, { useState, useEffect } from 'react';

const ManualControl: React.FC = () => {
  const [altitude, setAltitude] = useState(12.4);
  const [speed, setSpeed] = useState(8.2);
  const [timer, setTimer] = useState("04:32");

  // Simulated telemetry variation
  useEffect(() => {
    const interval = setInterval(() => {
      setAltitude(prev => Number((prev + (Math.random() * 0.1 - 0.05)).toFixed(1)));
      setSpeed(prev => Number((prev + (Math.random() * 0.2 - 0.1)).toFixed(1)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1 bg-background">
      {/* LEFT SIDEBAR: Available Fleet */}
      <aside className="w-80 flex-none flex flex-col bg-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-5 flex flex-col h-full">
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Available Fleet</h2>
          <div className="mb-4">
            <div className="relative">
              <input 
                className="w-full bg-background border border-white/5 rounded-lg py-2.5 px-4 text-xs text-white placeholder-gray-600 focus:ring-1 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all" 
                placeholder="Search drones..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {/* Active Drone Card */}
            <div className="p-4 rounded-lg bg-background border border-teal-400/30 relative overflow-hidden group cursor-pointer shadow-[0_0_15px_rgba(45,212,191,0.05)]">
              <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></div>
              <div className="flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-teal-400 mt-0.5">flight</span>
                <div>
                  <h3 className="text-white font-bold text-sm">Sentinel-1</h3>
                  <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-0.5">Active - Manual</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">battery_5_bar</span>
                  <span>78%</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
                  <span>Strong</span>
                </div>
              </div>
            </div>

            {/* Idle Drone Card */}
            <div className="p-4 rounded-lg hover:bg-background border border-transparent hover:border-white/5 transition-all cursor-pointer">
              <div className="flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-gray-500 mt-0.5">flight</span>
                <div>
                  <h3 className="text-white font-bold text-sm">Watcher-3</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Idle</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">battery_full</span>
                  <span>100%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
                  <span>Good</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER COLUMN: Main Feed & Joystick Controls */}
      <main className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Top HUD Feed */}
        <div className="flex-1 bg-panel rounded-xl border border-white/5 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
          <div className="flex-none p-3 bg-black/40 border-b border-warning/20 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-warning text-lg">warning</span>
              <span className="text-warning font-bold text-xs tracking-wide uppercase">Mode: Manual Override</span>
              <span className="text-gray-500 text-[10px] font-mono ml-2 uppercase tracking-widest">User: Isabelle R.</span>
            </div>
            <div className="bg-black/60 border border-white/10 px-3 py-1 rounded text-white font-mono font-bold text-lg tracking-widest shadow-inner">
              {timer}
            </div>
          </div>

          <div className="relative flex-1 bg-black w-full h-full overflow-hidden group">
            {/* Video Feed Simulation */}
            <div 
              className="absolute inset-0 bg-cover bg-center grayscale brightness-75 opacity-80" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6QlHmcHN1idc9DwF6vkjp_6gS3AVXHDBwAUHFvK_hAlE16IUqucveuxQUj9kHnEFgBJhi3bIzJW-nE2fASoKXHNGl69g36WCrHXK7phVE2tkNznclAw5cmWNyultg1biabJ_irCMYriOXhcKTv2p-_cxsjwMrQ2x9UnfijWq_F1N5mofG9Hjppsf8AF7z2Jb8XKZzwaxkjq6eftWf-0ZCVL5J7D5X9Ofl-jHjPe34l12PKJz2yGqo4nRWaFewHBqAIvxAtYvJQh8')" }}
            ></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

            {/* Overlays */}
            <div className="absolute top-4 left-4 border border-white/20 bg-black/50 backdrop-blur-md p-2 rounded text-[10px] font-mono text-white/80 z-10">
              <div className="font-bold text-white mb-1 uppercase tracking-widest">Sentinel-1</div>
              <div className="flex gap-3 opacity-60">
                <span>4K</span>
                <span>60FPS</span>
                <span>ISO 800</span>
              </div>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 font-bold">BAT 78%</div>
              <div className="bg-black/60 backdrop-blur-md border border-teal-400/30 px-2 py-1 rounded text-[10px] font-mono text-teal-400 font-bold">SIG -42dBm</div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <svg fill="none" height="120" stroke="rgba(45,212,191,0.6)" strokeWidth="1" viewBox="0 0 100 100" width="120">
                <line x1="0" x2="30" y1="50" y2="50"></line>
                <line x1="70" x2="100" y1="50" y2="50"></line>
                <line x1="50" x2="50" y1="0" y2="30"></line>
                <line x1="50" x2="50" y1="70" y2="100"></line>
                <circle cx="50" cy="50" r="10" strokeDasharray="2 2"></circle>
              </svg>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-[8px] font-mono text-teal-400 uppercase tracking-widest font-bold">Target Lock</div>
            </div>

            <div className="absolute bottom-6 right-6 z-20">
              <button className="bg-warning hover:bg-warning/90 text-black font-bold text-[10px] px-4 py-2 rounded shadow-lg shadow-warning/20 transition-all uppercase tracking-widest">
                Request Extension (+2m)
              </button>
            </div>
            <div className="absolute bottom-6 left-6 font-mono text-[9px] text-emerald-400 z-10 tracking-widest font-bold">
              320 MB/S
            </div>
          </div>
        </div>

        {/* Bottom Control Mode & Joysticks */}
        <div className="h-64 bg-panel rounded-xl border border-white/5 p-5 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 z-10">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Control Mode</h3>
            <div className="bg-background p-1 rounded-lg border border-white/5 flex">
              <button className="px-4 py-1 text-[10px] font-bold text-gray-500 rounded hover:text-white transition-colors uppercase tracking-widest">Auto</button>
              <button className="px-4 py-1 text-[10px] font-bold bg-warning text-black rounded shadow uppercase tracking-widest">Manual</button>
            </div>
            <button className="px-4 py-1.5 border border-teal-400/30 text-teal-400 hover:bg-teal-400/10 rounded text-[10px] font-bold uppercase tracking-widest transition-colors">
              Return to Autonomy
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-around relative">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Left Joystick */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="size-32 rounded-full border border-white/5 bg-background shadow-inner flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-teal-400/10 scale-75"></div>
                <div className="size-12 rounded-full bg-panel border border-teal-400/20 shadow-[0_8px_16px_rgba(0,0,0,0.4)] transform translate-y-4 transition-transform group-hover:scale-110"></div>
              </div>
              <div className="mt-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold opacity-70">Throttle / Yaw</div>
            </div>

            {/* Right Joystick */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="size-32 rounded-full border border-white/5 bg-background shadow-inner flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-teal-400/10 scale-75"></div>
                <div className="size-12 rounded-full bg-panel border border-teal-400/20 shadow-[0_8px_16px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-110"></div>
              </div>
              <div className="mt-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold opacity-70">Pitch / Roll</div>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Telemetry & Safety */}
      <aside className="w-80 flex-none flex flex-col gap-6">
        {/* Telemetry Panel */}
        <div className="bg-panel rounded-xl border border-white/5 p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
            <span className="material-symbols-outlined text-teal-400 text-sm">monitor_heart</span>
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Telemetry</h2>
          </div>
          <div className="space-y-5">
            <div className="flex justify-between items-end">
              <span className="text-[11px] text-gray-400 font-medium">Altitude</span>
              <div className="font-mono text-white text-lg font-bold">{altitude.toFixed(1)} <span className="text-xs font-normal text-gray-500">m</span></div>
            </div>
            <div className="w-full bg-background h-1 rounded-full overflow-hidden border border-white/5">
              <div className="bg-white/80 w-1/4 h-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"></div>
            </div>
            
            <div className="flex justify-between items-end">
              <span className="text-[11px] text-gray-400 font-medium">Speed</span>
              <div className="font-mono text-warning text-lg font-bold">{speed.toFixed(1)} <span className="text-xs font-normal text-gray-500">m/s</span></div>
            </div>
            <div className="w-full bg-background h-1 rounded-full overflow-hidden border border-white/5">
              <div className="bg-warning w-1/3 h-full shadow-[0_0_8px_rgba(245,158,11,0.2)]"></div>
            </div>

            <div className="flex justify-between items-end pt-2">
              <span className="text-[11px] text-gray-400 font-medium">GPS Satellites</span>
              <div className="font-mono text-teal-400 text-lg font-bold">18 <span className="text-[10px] font-bold bg-teal-400/10 px-1.5 py-0.5 rounded text-teal-400 border border-teal-400/20 uppercase ml-1 align-middle tracking-tighter">Locked</span></div>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="text-[11px] text-gray-400 font-medium">Link Quality</span>
              <div className="font-mono text-emerald-400 text-lg font-bold">98%</div>
            </div>
          </div>
        </div>

        {/* Safety Systems Panel */}
        <div className="bg-panel rounded-xl border border-white/5 p-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-danger text-sm">shield</span>
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Safety Systems</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-background border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-emerald-400 text-sm">sensors</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Proximity Sensors</span>
              </div>
              <p className="text-[9px] text-gray-500 pl-6">Clear - Nearest obstacle &gt; 15m</p>
            </div>
            <div className="bg-background border border-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-emerald-400 text-sm">public</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Geofence</span>
              </div>
              <p className="text-[9px] text-gray-500 pl-6">Clear - Inside active zone</p>
            </div>
          </div>
        </div>

        {/* Emergency Actions Panel */}
        <div className="bg-panel rounded-xl border border-white/5 p-5 shadow-2xl flex-1 flex flex-col justify-end">
          <div className="bg-warning/5 border border-warning/20 rounded p-2.5 mb-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-warning text-sm mt-0.5">warning</span>
            <p className="text-[9px] text-warning font-medium leading-tight uppercase tracking-tight">Emergency actions override all mission logic immediately.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button className="bg-background hover:bg-white/5 border border-white/10 text-white py-3 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest">
              Return to Home
            </button>
            <button className="bg-background hover:bg-white/5 border border-white/10 text-white py-3 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest">
              Hover Lock
            </button>
          </div>
          <button className="w-full bg-background border border-danger/40 hover:bg-danger/10 text-white py-3 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest text-shadow shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            Declare Emergency
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ManualControl;
