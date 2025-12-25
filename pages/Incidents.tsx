
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// Added ThreatType to imports to fix type assignment errors
import { Incident, ThreatType } from '../types';

// Updated mockIncidents to satisfy the Incident interface requirements
const mockIncidents: Incident[] = [
  { 
    id: 'INC-2025-082', 
    timestamp: 'Oct 24, 22:14', 
    title: 'Motion Detected - Zone B', 
    threat: ThreatType.HUMAN, 
    severity: 'CRITICAL', 
    status: 'Investigating', 
    slaBreach: '-2m',
    location: 'Zone B',
    slaLimit: 300,
    elapsed: 420
  },
  { 
    id: 'INC-2025-081', 
    timestamp: 'Oct 24, 18:30', 
    title: 'HVAC Vibration', 
    threat: ThreatType.ENVIRONMENTAL, 
    severity: 'HIGH', 
    status: 'Resolved',
    location: 'Sector 4',
    slaLimit: 600,
    elapsed: 300
  },
  { 
    id: 'INC-2025-080', 
    timestamp: 'Oct 23, 09:15', 
    title: 'Camera Offline - Zone A', 
    threat: ThreatType.SENSOR, 
    severity: 'MEDIUM', 
    status: 'Closed',
    location: 'Zone A',
    slaLimit: 1200,
    elapsed: 1100
  }
];

const analyticData = [
  { name: 'Day 1', time: 90 },
  { name: 'Day 3', time: 75 },
  { name: 'Day 7', time: 135 },
  { name: 'Day 14', time: 60 },
  { name: 'Day 18', time: 105 },
  { name: 'Day 21', time: 69 },
  { name: 'Day 30', time: 114 }
];

type TabType = 'list' | 'analytics' | 'reports';

const Incidents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');

  const renderList = () => (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Incidents (30d)', value: '24', color: 'text-white' },
          { label: 'Investigating', value: '3', color: 'text-warning' },
          { label: 'Escalated', value: '1', color: 'text-danger' },
          { label: 'False Alarms', value: '8', color: 'text-gray-300' },
          { label: 'Avg Response', value: '02:14', sub: 'vs 03:00 Target', color: 'text-success' },
        ].map((stat, i) => (
          <div key={i} className="bg-panel border border-white/5 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              {stat.sub && <span className="text-[9px] text-text-muted">{stat.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-white/5 p-3 rounded-lg flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input className="w-full bg-background border border-white/5 text-white text-xs rounded pl-10 pr-4 py-2 focus:ring-1 focus:ring-primary outline-none" placeholder="Search incidents..." type="text"/>
        </div>
        <div className="flex items-center gap-3">
          {['Severity: All', 'Threat: All', 'Status: All'].map((filter, i) => (
            <div key={i} className="relative">
              <select className="appearance-none bg-background border border-white/5 text-white text-xs rounded pl-4 pr-10 py-2 focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                <option>{filter}</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-panel border border-white/5 rounded-lg overflow-hidden shadow-sm flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/50 text-[10px] uppercase text-text-muted border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-bold tracking-widest w-1/6">Timestamp & ID</th>
                <th className="px-6 py-4 font-bold tracking-widest w-1/4">Title & Threat</th>
                <th className="px-6 py-4 font-bold tracking-widest w-1/6">Severity</th>
                <th className="px-6 py-4 font-bold tracking-widest w-1/6">Status</th>
                <th className="px-6 py-4 font-bold tracking-widest w-1/6">Response</th>
                <th className="px-6 py-4 font-bold tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockIncidents.map(inc => (
                <tr key={inc.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 align-top">
                    <div className="font-bold text-white">{inc.id}</div>
                    <div className="text-[10px] text-text-muted mt-1">{inc.timestamp}</div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="font-bold text-white leading-snug">{inc.title}</div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-gray-400 border border-white/10">
                        {inc.threat}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className={`font-bold text-[10px] uppercase tracking-wider ${
                      inc.severity === 'CRITICAL' ? 'text-danger' : 
                      inc.severity === 'HIGH' ? 'text-warning' : 'text-primary'
                    }`}>{inc.severity}</span>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        inc.status === 'Investigating' ? 'bg-warning animate-pulse' :
                        inc.status === 'Resolved' ? 'bg-success' : 'bg-gray-500'
                      }`}></span>
                      <span className="text-white font-medium">{inc.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="text-white text-xs font-mono">Auto-dispatch</div>
                    {/* Accessing slaBreach correctly as an optional property */}
                    {inc.slaBreach ? (
                      <div className="text-[9px] text-danger font-bold mt-1 uppercase tracking-tight">SLA BREACHED ({inc.slaBreach})</div>
                    ) : (
                      <div className="text-[9px] text-success font-bold mt-1 uppercase tracking-tight">On-time</div>
                    )}
                  </td>
                  <td className="px-6 py-5 align-top text-right">
                    <button className="text-text-muted hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1 custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-panel border border-white/5 p-5 rounded-xl">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Total Incidents (30D)</h3>
          <div className="text-3xl font-display font-bold text-white">24</div>
        </div>
        <div className="bg-panel border border-white/5 p-5 rounded-xl">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Avg Response Time</h3>
          <div className="text-3xl font-display font-bold text-emerald-400 font-mono">2m 14s</div>
        </div>
        <div className="bg-panel border border-white/5 p-5 rounded-xl">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">SLA Breach Rate</h3>
          <div className="text-3xl font-display font-bold text-danger font-mono">4.2%</div>
        </div>
        <div className="bg-panel border border-white/5 p-5 rounded-xl">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">False Alarm Rate</h3>
          <div className="text-3xl font-display font-bold text-white">33%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[400px]">
        <div className="lg:col-span-2 bg-panel border border-white/5 p-6 rounded-xl flex flex-col relative overflow-hidden shadow-sm">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Response Time Trend vs SLA</h3>
          <div className="flex-1 relative">
            <div className="absolute left-0 right-0 top-[60%] border-t border-dashed border-danger z-10 opacity-40">
              <span className="text-[10px] text-danger font-bold uppercase tracking-widest absolute right-4 -top-5">SLA Target (3m)</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <Bar dataKey="time" radius={[2, 2, 0, 0]}>
                  {analyticData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.time > 120 ? '#0891b2' : '#06b6d4'} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Bar>
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} stroke="#64748b" dy={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-panel border border-white/5 p-6 rounded-xl flex flex-col shadow-sm">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Threat Type Distribution</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative size-40 rounded-full flex items-center justify-center shadow-inner mb-6" 
                 style={{ background: 'conic-gradient(#ef4444 0deg 180deg, #6b7280 180deg 288deg, #f97316 288deg 360deg)' }}>
              <div className="size-32 rounded-full bg-panel flex flex-col items-center justify-center border border-white/5">
                <span className="text-2xl font-bold text-white font-display">24</span>
                <span className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Total</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              {[
                { label: 'Human Intruder', percent: '50%', color: 'bg-danger' },
                { label: 'Environmental', percent: '30%', color: 'bg-gray-500' },
                { label: 'Sensor Fault', percent: '20%', color: 'bg-warning' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${item.color}`}></span>
                    <span className="text-gray-300 font-medium">{item.label}</span>
                  </div>
                  <span className="font-mono text-gray-500 font-bold">{item.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-white/5 p-6 rounded-xl shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Top False Alarm Causes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { cause: 'HVAC Vibration', count: 4 },
            { cause: 'Door Left Open', count: 2 },
            { cause: 'Sensor Miscalibration', count: 2 },
          ].map((item, i) => (
            <div key={i} className="bg-background border border-white/5 p-4 rounded-lg flex items-center justify-between group hover:border-primary/30 transition-all cursor-pointer">
              <span className="text-xs font-medium text-gray-300 group-hover:text-white">{item.cause}</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{item.count} incidents</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <div className="w-full lg:w-1/3 h-64 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 hover:border-primary/20 transition-all cursor-pointer group bg-transparent">
        <div className="size-12 rounded-full bg-panel border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
          <span className="material-symbols-outlined text-primary text-2xl">assessment</span>
        </div>
        <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-widest">Generate New Report</h3>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">Select incident & format</p>
      </div>

      <div className="w-full lg:w-1/3 bg-panel border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col h-64 justify-between relative group hover:border-white/20 transition-all">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="inline-flex items-center px-2 py-1 rounded bg-danger/10 border border-danger/20">
              <span className="material-symbols-outlined text-danger text-xs mr-1">timer</span>
              <span className="text-[9px] font-bold text-danger uppercase tracking-widest">Deadline: 12m</span>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
          </div>
          <h3 className="text-base font-bold text-white mb-1 tracking-tight">Incident #082 – Police Report</h3>
          <p className="text-xs text-text-muted leading-relaxed">Required for critical intrusion event submission. Draft incomplete.</p>
        </div>
        <div className="flex gap-3 mt-auto">
          <button className="flex-1 bg-primary hover:bg-primary/90 text-black text-[10px] font-bold py-2.5 rounded-lg transition-all uppercase tracking-widest shadow-lg shadow-primary/20">
            Finalize
          </button>
          <button className="flex-1 bg-background hover:bg-white/5 text-gray-400 border border-white/10 text-[10px] font-bold py-2.5 rounded-lg transition-all uppercase tracking-widest">
            View Draft
          </button>
        </div>
      </div>

      <div className="w-full lg:w-1/3 bg-panel border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col h-64 justify-between relative group hover:border-white/20 transition-all">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="material-symbols-outlined text-emerald-500 text-xs mr-1">check_circle</span>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Delivered</span>
            </div>
            <span className="text-[10px] text-text-muted font-bold uppercase">2h ago</span>
          </div>
          <h3 className="text-base font-bold text-white mb-1 tracking-tight">Monthly Audit – Oct</h3>
          <p className="text-xs text-text-muted leading-relaxed">Recipient: Internal Compliance Team. Verified and archived.</p>
        </div>
        <div className="flex gap-3 mt-auto">
          <button className="flex-1 bg-background hover:bg-white/5 text-gray-400 border border-white/10 text-[10px] font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">download</span>
            PDF
          </button>
          <button className="flex-1 bg-background hover:bg-white/5 text-gray-400 border border-white/10 text-[10px] font-bold py-2.5 rounded-lg transition-all uppercase tracking-widest">
            Resend
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Tab Header Sidebar-style Logic managed inside view but tab switching is here */}
      <div className="shrink-0 mb-6">
        <div className="flex gap-8 border-b border-white/5">
          {[
            { id: 'list', label: 'Incident List' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'reports', label: 'Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'list' && renderList()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* Footer / Floating Button Placeholder */}
      <div className="fixed bottom-10 right-10 z-50">
        <button className="bg-primary hover:bg-primary/90 text-black font-bold p-4 rounded-full shadow-2xl flex items-center justify-center group transition-all transform active:scale-95">
          <span className="material-symbols-outlined text-2xl">add</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap px-0 group-hover:px-2 uppercase tracking-widest text-[10px] font-bold">New Incident</span>
        </button>
      </div>
    </div>
  );
};

export default Incidents;