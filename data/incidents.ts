import { useEffect, useState } from 'react';
import { Incident, ThreatType } from '../types';

// Single source of truth for incidents. The sidebar badge, Dashboard live alerts,
// Header briefing and Incidents page all read from this list.
export const INCIDENTS: Incident[] = [
  {
    id: 'INC-2025-082',
    timestamp: '2025-10-24 22:14',
    relativeTime: '2m ago',
    title: 'Motion Detected',
    threat: ThreatType.HUMAN,
    severity: 'CRITICAL',
    status: 'Investigating',
    location: 'Storage Area B (North)',
    slaLimit: 300,
    elapsed: 6,
    respondedBy: 'Isabelle M.',
    responseTime: 'N/A',
    assignedTo: 'Sentinel-1',
    assignmentStatus: 'En route',
    eta: '01:30',
    confidence: 92,
    priority: 'P1',
    isCarriedOver: true,
    previousOwner: 'Marc (Day Shift)',
    handoverNote: 'Sensor flickering noticed, check power stability.',
    timeline: [
      { time: '22:14:00', event: 'Alert Triggered', details: 'Motion sensor B-12 active', type: 'alert' },
      { time: '22:14:30', event: 'Operator Acknowledged', details: 'Assigned to Sentinel-1', type: 'action' }
    ],
    evidence: [
      { type: 'video', url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=400', caption: 'FPV Sector B' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1551817958-c5b5d1b74a33?auto=format&fit=crop&q=80&w=400', caption: 'Snapshot 22:15' }
    ]
  },
  {
    id: 'INC-2025-083',
    timestamp: '2025-10-24 22:04',
    relativeTime: '12m ago',
    title: 'Signal Degradation',
    threat: ThreatType.SENSOR,
    severity: 'HIGH',
    status: 'Investigating',
    location: 'Watcher-3 @ East Wing',
    slaLimit: 600,
    elapsed: 45,
    respondedBy: 'System',
    responseTime: 'N/A',
    assignedTo: 'None',
    assignmentStatus: 'Queued',
    eta: '03:00',
    confidence: 41,
    priority: 'P2',
    isLikelyFalseAlarm: true,
    timeline: []
  },
  {
    id: 'INC-2025-084',
    timestamp: '2025-10-24 22:01',
    relativeTime: '15m ago',
    title: 'Temp Spike',
    threat: ThreatType.ENVIRONMENTAL,
    severity: 'MEDIUM',
    status: 'Investigating',
    location: 'Server Room 4',
    slaLimit: 300,
    elapsed: 180,
    respondedBy: 'System',
    responseTime: 'N/A',
    assignedTo: 'None',
    assignmentStatus: 'Queued',
    eta: '04:15',
    confidence: 68,
    priority: 'P3',
    timeline: []
  },
  {
    id: 'INC-2025-081',
    timestamp: '2025-10-24 18:30',
    title: 'HVAC Unit Vibration',
    threat: ThreatType.ENVIRONMENTAL,
    severity: 'MEDIUM',
    status: 'Resolved',
    location: 'Sector 4',
    slaLimit: 600,
    elapsed: 300,
    respondedBy: 'Auto-dispatch',
    responseTime: '5m 00s',
    assignedTo: 'Watcher-3',
    falseAlarmReason: 'HVAC resonance anomaly',
    timeline: [
      { time: '18:30:00', event: 'Alert Triggered', type: 'alert' },
      { time: '18:35:00', event: 'Resolved', details: 'Marked as false alarm', type: 'resolution' }
    ]
  },
  {
    id: 'INC-2025-080',
    timestamp: '2025-10-23 09:15',
    title: 'Signal Degradation',
    threat: ThreatType.SENSOR,
    severity: 'LOW',
    status: 'Closed',
    location: 'Main Gate',
    slaLimit: 1200,
    elapsed: 1100,
    respondedBy: 'System Admin',
    responseTime: '18m 20s',
    assignedTo: 'None',
    timeline: []
  }
];

export const isOpen = (inc: Incident): boolean => inc.status !== 'Resolved' && inc.status !== 'Closed';

export const getOpenIncidents = (): Incident[] => INCIDENTS.filter(isOpen);

export const getOpenCount = (): number => getOpenIncidents().length;

// Live SLA clocks: open incidents keep counting from the moment the app loaded,
// so every screen shows the same countdown.
const loadedAt = Date.now();
const secondsSinceLoad = () => Math.floor((Date.now() - loadedAt) / 1000);

export const useSecondsSinceLoad = (): number => {
  const [seconds, setSeconds] = useState(secondsSinceLoad);
  useEffect(() => {
    const timer = setInterval(() => setSeconds(secondsSinceLoad()), 1000);
    return () => clearInterval(timer);
  }, []);
  return seconds;
};

export const getElapsed = (inc: Incident, seconds: number): number =>
  isOpen(inc) ? inc.elapsed + seconds : inc.elapsed;

export const formatSla = (a: Incident): string => {
  const remaining = Math.max(0, a.slaLimit - a.elapsed);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const getSlaUrgency = (a: Incident): string => {
  const remaining = a.slaLimit - a.elapsed;
  const ratio = remaining / a.slaLimit;
  if (ratio < 0) return 'text-danger animate-pulse font-black';
  if (ratio < 0.2) return 'text-danger animate-pulse';
  if (ratio < 0.5) return 'text-warning';
  return 'text-success';
};

// "7m 00s" -> 420. Returns null when there is no response time yet (e.g. "N/A").
const parseResponseSeconds = (value: string): number | null => {
  const match = value.match(/^(\d+)m\s*(\d+)s$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

// Average over incidents that actually have a response time, formatted mm:ss.
export const getAvgResponse = (): string => {
  const times = INCIDENTS
    .map(i => parseResponseSeconds(i.responseTime))
    .filter((t): t is number => t !== null);
  if (times.length === 0) return '-';
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const m = Math.floor(avg / 60);
  const s = avg % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
