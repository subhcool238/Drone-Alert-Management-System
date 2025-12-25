
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/fleet', label: 'Fleet Management', icon: 'flight_takeoff' },
  { path: '/manual', label: 'Manual Control', icon: 'gamepad' },
  { path: '/patrols', label: 'Patrol Routes', icon: 'alt_route' },
  { path: '/incidents', label: 'Incidents', icon: 'warning', badge: 2 },
  { path: '/settings', label: 'System Settings', icon: 'settings' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 flex flex-col bg-background border-r border-white/5 shrink-0 z-30 py-6 px-3">
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-black font-bold text-lg">
          FS
        </div>
        <div className="flex flex-col">
          <h1 className="text-white text-sm font-bold leading-none tracking-wide">FlytBase</h1>
          <span className="text-[10px] text-primary font-bold tracking-wider mt-0.5">SECURITY OPS</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] transition-colors ${isActive ? 'fill-1' : 'group-hover:text-primary'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-danger/20 text-danger text-[10px] font-bold px-1.5 py-0.5 rounded border border-danger/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="pt-6 border-t border-white/5 mt-auto">
        <button className="flex items-center w-full gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group">
          <div className="size-8 rounded-full bg-cover bg-center ring-2 ring-gray-700" style={{ backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuBf32ztAlYOtIpntZ8GA11lvp6qLHk4YFeTDSw2GGGzZ_T3fufgI3tj2NFGL64ooFOiqLN5SEnfaHSUCtC4kV99HEw65A0pYFLJfs39KkY_rBVYAMJwFTkKW7BBuzYWb9rulMpCXtkH2QplNzBBbxZ4HsGyB_I-SHQaLYYXHCMdpHrtxwoofh7EE1N5yhhREZ5ee4gdB7ALoDFblzUT6IaQE9VZNMLyL2k0UKWarhn6k-r6CzMy_C1PMSa444Q0y7--XdgSTo0UMwg)' }}></div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-white truncate">Isabelle M.</span>
            <span className="text-[10px] text-gray-500 truncate">Shift Commander</span>
          </div>
          <span className="material-symbols-outlined text-gray-500 group-hover:text-white">logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
