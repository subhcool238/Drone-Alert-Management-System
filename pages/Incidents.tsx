
import React, { useState, useMemo } from 'react';
import Button from '../components/Button';
import { activateOnKey } from '../components/a11y';
import ModalOverlay from '../components/ModalOverlay';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line, Legend 
} from 'recharts';
import { Incident, ThreatType, TimelineEvent } from '../types';
import { COLORS } from '../data/theme';
import { INCIDENTS as mockIncidents, getElapsed, getSlaState, useSecondsSinceLoad, getSlaUrgency, getAvgResponse } from '../data/incidents';

const analyticData = [
  { name: 'Mon', time: 180, target: 180 },
  { name: 'Tue', time: 140, target: 180 },
  { name: 'Wed', time: 210, target: 180 },
  { name: 'Thu', time: 160, target: 180 },
  { name: 'Fri', time: 250, target: 180 },
  { name: 'Sat', time: 90, target: 180 },
  { name: 'Sun', time: 120, target: 180 },
];

const threatDistribution = [
  { name: 'Human', value: 45, color: COLORS.danger },
  { name: 'Environmental', value: 25, color: COLORS.success },
  { name: 'Sensor', value: 20, color: COLORS.warning },
  { name: 'Other', value: 10, color: COLORS.border },
];

const reportData = [
  { id: 'REP-001', incId: 'INC-2025-082', type: 'Police Report', status: 'Pending', deadlineMins: 4, size: '2.4 MB' },
  { id: 'REP-002', incId: 'INC-2025-081', type: 'Insurance', status: 'Delivered', deadlineMins: 0, size: '1.1 MB' },
  { id: 'REP-003', incId: 'INC-2025-080', type: 'Internal Audit', status: 'Draft', deadlineMins: 12, size: '450 KB' },
];

const Incidents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'reports'>('list');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [threatFilter, setThreatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeScope, setTimeScope] = useState('Last 24h');
  const secondsSinceLoad = useSecondsSinceLoad();
  // Live SLA clock for open incidents (same clock as the Dashboard alert cards)
  const withLiveElapsed = (inc: Incident): Incident => ({ ...inc, elapsed: getElapsed(inc, secondsSinceLoad) });

  // What the SLA slot shows for an incident. The rules live in data/incidents.ts and data/sla.ts.
  const renderSlaCell = (inc: Incident) => {
    const sla = getSlaState(inc, secondsSinceLoad);
    switch (sla.kind) {
      case 'responded':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-success font-bold uppercase">Responded in {sla.text}</span>
            <span className="text-text-muted font-mono text-xs">Limit {sla.tier}</span>
          </div>
        );
      case 'ticking':
        return (
          <div className="flex flex-col gap-1">
            <span className={`font-bold uppercase font-mono ${getSlaUrgency(withLiveElapsed(inc))}`}>{sla.text}</span>
            <span className="text-text-muted font-mono text-xs">Remaining</span>
          </div>
        );
      case 'breached':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-danger-light font-bold uppercase">Breached</span>
            <span className="text-danger-light font-mono text-xs">Limit {sla.tier}</span>
          </div>
        );
      case 'closed-breached':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-danger-light font-bold uppercase">Breached</span>
            <span className="text-danger-light font-mono text-xs">{sla.response}</span>
          </div>
        );
      case 'closed-ok':
        return (
          <div className="flex flex-col gap-1">
            <span className="text-success font-bold uppercase">On-Time</span>
            <span className="text-text-muted font-mono text-xs">{sla.response}</span>
          </div>
        );
      default:
        return <span className="text-text-muted font-mono">-</span>;
    }
  };

  // Text and colour for the "SLA Response Performance" line in the detail panel
  const slaPerformance = (inc: Incident): { text: string; className: string } => {
    const sla = getSlaState(inc, secondsSinceLoad);
    switch (sla.kind) {
      case 'responded': return { text: `Responded in ${sla.text} (limit ${sla.tier})`, className: 'text-emerald-500' };
      case 'ticking': return { text: `Live: ${sla.text} remaining`, className: 'text-gray-300' };
      case 'breached': return { text: `Breached (limit ${sla.tier})`, className: 'text-danger-light' };
      case 'closed-breached': return { text: `Breached (${sla.response} vs ${sla.tier} limit)`, className: 'text-danger-light' };
      case 'closed-ok': return { text: 'Compliant (On-time)', className: 'text-emerald-500' };
      default: return { text: '-', className: 'text-gray-300' };
    }
  };

  const filteredIncidents = useMemo(() => {
    return mockIncidents.filter(inc => {
      const searchMatch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || inc.id.toLowerCase().includes(searchTerm.toLowerCase());
      const severityMatch = severityFilter === 'All' || inc.severity === severityFilter.toUpperCase();
      const threatMatch = threatFilter === 'All' || inc.threat === threatFilter.toUpperCase();
      const statusMatch = statusFilter === 'All' || inc.status === statusFilter;
      
      // Basic time scope filter logic (mocked)
      let timeMatch = true;
      if (timeScope === 'Current shift' || timeScope === 'Previous shift') timeMatch = inc.shift === timeScope;

      return searchMatch && severityMatch && threatMatch && statusMatch && timeMatch;
    });
  }, [searchTerm, severityFilter, threatFilter, statusFilter, timeScope]);

  const renderIncidentList = () => (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      {/* Summary Strip */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total (24H)', value: String(mockIncidents.length), icon: 'list_alt' },
          { label: 'Investigating', value: String(mockIncidents.filter(i => i.status === 'Investigating').length), icon: 'visibility', color: 'text-warning' },
          { label: 'Escalated', value: String(mockIncidents.filter(i => i.status === 'Escalated').length), icon: 'priority_high', color: 'text-danger-light' },
          { label: 'False Alarms', value: String(mockIncidents.filter(i => i.falseAlarmReason).length), icon: 'cancel', color: 'text-gray-400' },
          { label: 'Avg Response', value: getAvgResponse(), icon: 'timer', color: 'text-primary' }
        ].map((stat, i) => (
          <div key={i} className="bg-panel border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="size-10 rounded-xl bg-background border border-white/5 flex items-center justify-center">
              <span aria-hidden="true" className={`material-symbols-outlined text-text-muted ${stat.color}`}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
              <p className={`text-xl font-display font-bold text-white ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-panel border border-white/5 p-4 rounded-2xl flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <span aria-hidden="true" className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Search incident database"
            className="w-full bg-background border border-white/5 text-white text-xs rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary/50 transition-all font-bold uppercase tracking-wider placeholder-text-muted" 
            placeholder="Search incident database..."
          />
        </div>
        <div className="flex gap-2">
          {['Time scope', 'Severity', 'Threat', 'Status'].map((f) => (
            <div key={f} className="relative">
              <select 
                aria-label={f}
                value={f === 'Time scope' ? timeScope : undefined}
                onChange={e => {
                  if (f === 'Time scope') setTimeScope(e.target.value);
                  if (f === 'Severity') setSeverityFilter(e.target.value);
                  if (f === 'Threat') setThreatFilter(e.target.value);
                  if (f === 'Status') setStatusFilter(e.target.value);
                }}
                className="appearance-none bg-background border border-white/5 text-white text-xs font-bold rounded-xl pl-4 pr-10 py-3 uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="All">{f}: All</option>
                {f === 'Time scope' && ['Current shift', 'Previous shift', 'Last 24h'].map(o => <option key={o} value={o}>{o}</option>)}
                {f === 'Severity' && ['Critical', 'High', 'Medium', 'Low'].map(o => <option key={o}>{o}</option>)}
                {f === 'Threat' && ['Human', 'Environmental', 'Sensor'].map(o => <option key={o}>{o}</option>)}
                {f === 'Status' && ['Investigating', 'Responding', 'Resolved', 'Escalated'].map(o => <option key={o}>{o}</option>)}
              </select>
              <span aria-hidden="true" className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-lg">expand_more</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-panel border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex-1 min-h-0">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-background/50 sticky top-0 z-10 backdrop-blur-md">
              <tr className="border-b border-white/5 text-xs uppercase text-text-muted font-bold tracking-[0.12em]">
                <th className="px-6 py-5">Timestamp & ID</th>
                <th className="px-6 py-5">Incident & Threat</th>
                <th className="px-6 py-5">Severity</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Operator</th>
                <th className="px-6 py-5">SLA Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredIncidents.map(inc => (
                <tr 
                  key={inc.id} 
                  onClick={() => setSelectedIncident(inc)}
                  tabIndex={0}
                  onKeyDown={activateOnKey(() => setSelectedIncident(inc))}
                  aria-haspopup="dialog"
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <div className="font-bold font-mono text-white mb-1">{inc.id}</div>
                    <div className="text-text-muted font-mono text-xs">{inc.timestamp}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="font-bold text-gray-200 leading-tight max-w-[200px]">{inc.title}</div>
                       {inc.isCarriedOver && (
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-indigo-400" title={`Carried over from: ${inc.previousOwner}`}>sync_alt</span>
                       )}
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-text-muted uppercase tracking-wider">{inc.threat}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`font-bold tracking-widest ${
                      inc.severity === 'CRITICAL' ? 'text-danger-light' : 
                      inc.severity === 'HIGH' ? 'text-warning' : 'text-primary'
                    }`}>{inc.severity}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${
                        inc.status === 'Investigating' ? 'bg-warning animate-pulse' :
                        inc.status === 'Resolved' ? 'bg-success' : 
                        inc.status === 'Escalated' ? 'bg-danger' : 'bg-gray-500'
                      }`}></span>
                      <span className="text-gray-300 font-bold uppercase tracking-wider">{inc.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-400 font-medium">{inc.respondedBy}</td>
                  <td className="px-6 py-5">
                    {renderSlaCell(inc)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="icon" aria-label="View incident report" className="text-text-muted hover:text-white"><span className="material-symbols-outlined" aria-hidden="true">description</span></Button>
                      <Button variant="icon" aria-label="Flag incident" className="text-text-muted hover:text-danger-light"><span className="material-symbols-outlined" aria-hidden="true">flag</span></Button>
                    </div>
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
    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-10">
      <p className="text-xs font-bold text-text-muted uppercase tracking-wider">30-day sample data</p>
      <div className="grid grid-cols-4 gap-6">
        {[
          { l: 'SLA Breach Rate', v: '4.2%', s: 'Last 30 days', c: 'text-danger-light' },
          { l: 'False Alarm Rate', v: '33%', s: '12% decrease', c: 'text-gray-400' },
          { l: 'Avg Response', v: '2m 14s', s: 'Target: 3m', c: 'text-primary' },
          { l: 'Common Threat', v: 'Human Intruder', s: '45% total', c: 'text-white' }
        ].map((m, i) => (
          <div key={i} className="bg-panel border border-white/5 p-8 rounded-3xl shadow-xl">
             <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">{m.l}</span>
             <div className={`text-4xl font-display font-bold ${m.c} tracking-tighter`}>{m.v}</div>
             <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mt-3">{m.s}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-panel border border-white/5 rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.12em]">Response Time Trend vs SLA Target</h2>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="size-2 rounded-full bg-primary"></div>
                 <span className="text-xs font-bold text-text-muted uppercase">Avg Response</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-0.5 border-t border-dashed border-danger"></div>
                 <span className="text-xs font-bold text-danger-light uppercase tracking-wider">SLA Limit</span>
               </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: COLORS.textMuted, fontSize: 13}} dy={15} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{backgroundColor: COLORS.panel, border: '1px solid #ffffff10', borderRadius: '12px'}}
                  itemStyle={{color: COLORS.primary, fontSize: '12px', fontWeight: 'bold'}}
                />
                <Line type="monotone" dataKey="time" stroke={COLORS.primary} strokeWidth={4} dot={{ r: 4, fill: COLORS.primary }} activeDot={{ r: 8 }} />
                <Line type="stepAfter" dataKey="target" stroke={COLORS.danger} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-panel border border-white/5 rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-2xl">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.12em]">Threat Type Distribution</h2>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={threatDistribution} 
                  innerRadius={60} 
                  outerRadius={100} 
                  paddingAngle={8} 
                  dataKey="value"
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-display font-bold text-white leading-none">24</span>
               <span className="text-xs text-text-muted font-bold uppercase mt-1">Total Cases</span>
            </div>
          </div>
          <div className="space-y-4">
             {threatDistribution.map(item => (
               <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">{item.value}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <Button variant="bare" className="h-[280px] border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all group">
         <div className="size-16 rounded-3xl bg-panel border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
           <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl">add</span>
         </div>
         <div className="text-center">
           <h2 className="text-[12px] font-bold text-white uppercase tracking-[0.2em] mb-1">New Incident Report</h2>
           <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Select Incident to Start</p>
         </div>
      </Button>

      {reportData.map(rep => {
        const isUrgent = rep.deadlineMins > 0 && rep.deadlineMins <= 5;
        return (
          <div key={rep.id} className="bg-panel border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start">
               <div className="flex flex-col gap-1">
                 <span className="text-xs text-text-muted font-bold uppercase tracking-[0.12em]">{rep.id}</span>
                 <h2 className="text-xl font-display font-bold text-white tracking-tight">{rep.type}</h2>
               </div>
               <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                 rep.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' : 
                 rep.status === 'Pending' ? 'bg-warning/10 text-warning' : 'bg-white/5 text-text-muted'
               }`}>
                 {rep.status}
               </span>
            </div>

            {rep.deadlineMins > 0 && (
              <div className={`mt-8 p-4 rounded-2xl flex items-center justify-between border ${
                isUrgent ? 'bg-danger/10 border-danger/30' : 'bg-background/80 border-white/5'
              }`}>
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${isUrgent ? 'text-danger-light' : 'text-text-muted'}`}>timer</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isUrgent ? 'text-danger-light' : 'text-text-muted'}`}>Report Deadline</span>
                </div>
                <span className={`text-[12px] font-mono font-bold ${isUrgent ? 'text-danger-light' : 'text-white'}`}>{rep.deadlineMins}m remaining</span>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                 <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Source Incident</span>
                 <span className="text-xs font-bold text-gray-400">{rep.incId}</span>
              </div>
              <div className="flex gap-2">
                 <Button variant="icon" aria-label="Download report" className="size-10 bg-background border border-white/10 text-text-muted hover:text-white">
                   <span aria-hidden="true" className="material-symbols-outlined text-lg">download</span>
                 </Button>
                 <Button variant="icon" aria-label="Share report" className="size-10 bg-background border border-white/10 text-text-muted hover:text-white">
                   <span aria-hidden="true" className="material-symbols-outlined text-lg">share</span>
                 </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* TABS */}
      <div className="shrink-0 mb-8 border-b border-white/5">
        <div className="flex gap-10">
          {[
            { id: 'list', label: 'Incident Database' },
            { id: 'analytics', label: 'Tactical Analytics' },
            { id: 'reports', label: 'Report Center' }
          ].map(tab => (
            <Button variant="bare" 
 key={tab.id}
 aria-pressed={activeTab === tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`pb-4 text-xs font-bold uppercase tracking-[0.12em] transition-all relative ${ activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-white' }`}>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px_rgba(6,182,212,0.6)] rounded-full"></div>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'list' && renderIncidentList()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'reports' && renderReports()}
      </div>

      {/* DETAIL MODAL */}
      {selectedIncident && (
        <ModalOverlay labelledBy="incident-title" onEscape={() => setSelectedIncident(null)} className="fixed inset-0 z-[100] flex items-center justify-end bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl h-full bg-panel border-l border-white/10 flex flex-col shadow-[-40px_0_60px_-15px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500">
            {/* Modal Header */}
            <div className="p-10 border-b border-white/5 flex justify-between items-start bg-background/20">
               <div className="flex-1 pr-10">
                  <div className="flex items-center gap-4 mb-4">
                    <h2 id="incident-title" className="text-4xl font-mono font-bold text-white tracking-tighter">{selectedIncident.id}</h2>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold border ${
                      selectedIncident.severity === 'CRITICAL' ? 'bg-danger/10 border-danger/30 text-danger-light' : 'bg-primary/10 border-primary/30 text-primary'
                    }`}>{selectedIncident.severity}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-400">{selectedIncident.title}</h3>
                    {selectedIncident.isCarriedOver && (
                      <div className="group relative flex items-center">
                        <span className="bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider flex items-center gap-2 cursor-help">
                          <span aria-hidden="true" className="material-symbols-outlined text-[14px]">sync_alt</span> Carried over from previous shift
                        </span>
                        <div className="absolute top-full left-0 mt-2 p-3 bg-panel border border-white/10 rounded-xl shadow-2xl z-50 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <p className="text-xs text-text-muted font-bold uppercase mb-1">Assigned to: {selectedIncident.previousOwner}</p>
                          <p className="text-xs text-gray-300 italic">"{selectedIncident.handoverNote}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{selectedIncident.location}</span>
                    <span className="size-1 rounded-full bg-gray-800"></span>
                    <span className="text-xs text-primary font-bold uppercase tracking-wider">{selectedIncident.threat} Threat</span>
                  </div>
               </div>
               <Button variant="icon" aria-label="Close" onClick={() => setSelectedIncident(null)} className="text-text-muted hover:text-white shrink-0"><span className="material-symbols-outlined text-3xl" aria-hidden="true">close</span></Button>
            </div>

            {/* Modal Content */}
            <div tabIndex={0} role="region" aria-label="Incident details" className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
               {/* Timeline Section */}
               <section>
                 <h4 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-10">Mission Timeline & Escalations</h4>
                 <div className="space-y-0 pl-4 border-l border-white/5 relative">
                    {selectedIncident.timeline.map((item, idx) => (
                      <div key={idx} className="relative pb-10 group last:pb-0">
                         <div className={`absolute -left-[21px] size-4 rounded-full border-2 bg-panel transition-all ${
                           item.type === 'escalation' ? 'border-danger' : 
                           item.type === 'alert' ? 'border-warning' : 'border-primary'
                         }`}></div>
                         <div className="flex flex-col gap-1.5 ml-6">
                            <span className="text-xs font-mono text-text-muted font-bold">{item.time}</span>
                            <span className={`text-sm font-bold ${item.type === 'escalation' ? 'text-danger-light' : 'text-white'}`}>{item.event}</span>
                            {item.details && <p className="text-xs text-text-muted font-medium">{item.details}</p>}
                         </div>
                      </div>
                    ))}
                 </div>
               </section>

               {/* Evidence Section */}
               <section>
                 <h4 className="text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-6">Tactical Evidence</h4>
                 <div className="grid grid-cols-2 gap-6">
                    {selectedIncident.evidence?.map((ev, i) => (
                      <div key={i} className="group relative rounded-3xl overflow-hidden aspect-video bg-background border border-white/5 shadow-inner">
                         <img src={ev.url} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt={ev.caption}/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{ev.caption}</span>
                            <span aria-hidden="true" className="material-symbols-outlined text-white text-lg">fullscreen</span>
                         </div>
                      </div>
                    ))}
                 </div>
               </section>

               {/* Metadata Section */}
               <section className="bg-background/40 border border-white/5 rounded-[2.5rem] p-10 grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="flex flex-col gap-1">
                       <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Assigned Operator</span>
                       <span className="text-sm font-bold text-white">{selectedIncident.respondedBy}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                       <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Primary Mission Asset</span>
                       <span className="text-sm font-bold text-primary">{selectedIncident.assignedTo}</span>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="flex flex-col gap-1">
                       <span className="text-xs text-text-muted font-bold uppercase tracking-wider">SLA Response Performance</span>
                       <span className={`text-sm font-bold ${slaPerformance(selectedIncident).className}`}>
                         {slaPerformance(selectedIncident).text}
                       </span>
                     </div>
                     <div className="flex flex-col gap-1">
                       <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Status Code</span>
                       <span className="text-sm font-bold text-gray-300">{selectedIncident.status}</span>
                     </div>
                  </div>
               </section>
            </div>

            {/* Modal Footer */}
            <div className="p-10 border-t border-white/5 bg-background/20 flex gap-4 shrink-0">
              <Button variant="primary" className="flex-1 font-bold py-4 text-xs uppercase tracking-[0.12em] shadow-2xl shadow-primary/20">
                Export Detailed PDF
              </Button>
              <Button variant="secondary" className="px-10 bg-background text-white font-bold py-4 text-xs uppercase tracking-[0.12em]">
                Share Externally
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-10 right-10 z-[60]">
         <Button variant="primary" className="px-10 py-4 shadow-2xl gap-4 transform active:scale-95 group overflow-hidden">
           <span aria-hidden="true" className="material-symbols-outlined text-2xl">add</span>
           <span className="text-xs font-bold uppercase tracking-[0.12em]">Manual Entry</span>
         </Button>
      </div>
    </div>
  );
};

export default Incidents;
