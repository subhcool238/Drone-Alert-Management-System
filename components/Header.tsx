
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0 z-20 bg-background">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-xl">hexagon</span>
          <span className="text-white text-base font-bold tracking-tight font-display">Command Center</span>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 tracking-wider">AI ASSISTED</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-8 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[20px]">search</span>
        <input 
          className="w-full bg-panel border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-0 placeholder-gray-500 transition-all outline-none" 
          placeholder="Search drones, incidents, guards..."
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="size-9 rounded-full bg-panel border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all relative">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          <span className="absolute top-2 right-2.5 size-1.5 rounded-full bg-danger"></span>
        </button>
        
        <div className="flex items-center gap-2 bg-panel border border-white/5 rounded-full px-3 py-1.5 shadow-sm">
          <div className="flex gap-1">
            <div className="size-1.5 rounded-full bg-emerald-500"></div>
            <div className="size-1.5 rounded-full bg-emerald-500"></div>
            <div className="size-1.5 rounded-full bg-emerald-500"></div>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-500 tracking-wider uppercase">System Online</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
