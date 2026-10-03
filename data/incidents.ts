import { useEffect, useState } from 'react';
import { Incident, ThreatType } from '../types';
import { SLA_SECONDS, formatSlaTier } from './sla';

// Single source of truth for incidents. The sidebar badge, Dashboard live alerts,
// Header briefing and Incidents page all read from this list.
//
// Scenario: the app loads at 02:37:00. "detectedSecondsBeforeLoad" says how long
// before that moment an alert was detected, and "respondedInSeconds" marks an
// alert an operator has already responded to (its SLA clock stops there).
export const INCIDENTS: Incident[] = [
  {
    id: 'INC-2025-082',
    timestamp: 'Today 02:36:48',
    shift: 'Current shift',
    detectedSecondsBeforeLoad: 12,
    respondedInSeconds: 12,
    title: 'Motion Detected',
    threat: ThreatType.HUMAN,
    severity: 'CRITICAL',
    status: 'Investigating',
    location: 'Storage Area B (North)',
    slaLimit: SLA_SECONDS.CRITICAL,
    elapsed: 12,
    respondedBy: 'Isabelle M.',
    responseTime: 'N/A',
    assignedTo: 'Sentinel-1',
    assignmentStatus: 'En route',
    eta: '01:30',
    confidence: 92,
    priority: 'P1',
    timeline: [
      { time: '02:36:48', event: 'Alert Triggered', details: 'Motion sensor B-12 active', type: 'alert' },
      { time: '02:37:00', event: 'Operator Acknowledged', details: 'Assigned to Sentinel-1', type: 'action' }
    ],
    evidence: [
      { type: 'video', url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=400', caption: 'FPV Sector B' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1551817958-c5b5d1b74a33?auto=format&fit=crop&q=80&w=400', caption: 'Snapshot 02:36:50' }
    ]
  },
  {
    id: 'INC-2025-083',
    timestamp: 'Today 02:36:35',
    shift: 'Current shift',
    detectedSecondsBeforeLoad: 25,
    title: 'Signal Degradation',
    threat: ThreatType.SENSOR,
    severity: 'HIGH',
    status: 'Investigating',
    location: 'Watcher-3 @ East Wing',
    slaLimit: SLA_SECONDS.HIGH,
    elapsed: 25,
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
    timestamp: 'Today 02:36:10',
    shift: 'Current shift',
    detectedSecondsBeforeLoad: 50,
    title: 'Temp Spike',
    threat: ThreatType.ENVIRONMENTAL,
    severity: 'MEDIUM',
    status: 'Investigating',
    location: 'Server Room 4',
    slaLimit: SLA_SECONDS.MEDIUM,
    elapsed: 50,
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
    timestamp: 'Yesterday 18:30',
    shift: 'Previous shift',
    title: 'HVAC Unit Vibration',
    threat: ThreatType.ENVIRONMENTAL,
    severity: 'MEDIUM',
    status: 'Resolved',
    location: 'Sector 4',
    slaLimit: SLA_SECONDS.MEDIUM,
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
    timestamp: 'Yesterday 09:15',
    title: 'Signal Degradation',
    threat: ThreatType.SENSOR,
    severity: 'LOW',
    status: 'Closed',
    location: 'Main Gate',
    slaLimit: SLA_SECONDS.LOW,
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

// Live SLA clocks: all start moments hang off the one load moment below (stored once
// at module level, so it never restarts when you change pages).
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

// Elapsed SLA seconds: frozen at the response time once responded, ticking for other
// open incidents, fixed for closed ones.
export const getElapsed = (inc: Incident, seconds: number): number => {
  if (inc.respondedInSeconds !== undefined) return inc.respondedInSeconds;
  return isOpen(inc) ? inc.elapsed + seconds : inc.elapsed;
};

const mmss = (total: number): string => {
  const t = Math.max(0, total);
  return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
};

export const formatSla = (a: Incident): string => mmss(a.slaLimit - a.elapsed);

export const getSlaUrgency = (a: Incident): string => {
  const remaining = a.slaLimit - a.elapsed;
  const ratio = remaining / a.slaLimit;
  if (ratio < 0.2) return 'text-danger-light';
  if (ratio < 0.5) return 'text-warning';
  return 'text-success';
};

// "7m 00s" -> 420. Returns null when there is no response time yet (e.g. "N/A").
export const parseResponseSeconds = (value: string): number | null => {
  const match = value.match(/^(\d+)m\s*(\d+)s$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export type SlaState =
  | { kind: 'responded'; text: string; tier: string }
  | { kind: 'ticking'; text: string; tier: string }
  | { kind: 'breached'; tier: string }
  | { kind: 'closed-ok'; response: string; tier: string }
  | { kind: 'closed-breached'; response: string; tier: string }
  | { kind: 'none' };

// One place that decides what the SLA slot shows, for every screen.
// Open and responded: "Responded in mm:ss". Open and waiting: a countdown that stops
// at 00:00 and becomes "breached" (never negative). Closed: on-time or breached from the
// response time against the tier in data/sla.ts.
export const getSlaState = (inc: Incident, seconds: number): SlaState => {
  if (!inc.slaLimit) return { kind: 'none' };
  const tier = formatSlaTier(inc.slaLimit);
  if (isOpen(inc)) {
    if (inc.respondedInSeconds !== undefined) {
      return { kind: 'responded', text: mmss(inc.respondedInSeconds), tier };
    }
    const remaining = inc.slaLimit - getElapsed(inc, seconds);
    return remaining <= 0 ? { kind: 'breached', tier } : { kind: 'ticking', text: mmss(remaining), tier };
  }
  const responseSeconds = parseResponseSeconds(inc.responseTime);
  if (responseSeconds === null) return { kind: 'none' };
  return responseSeconds <= inc.slaLimit
    ? { kind: 'closed-ok', response: inc.responseTime, tier }
    : { kind: 'closed-breached', response: inc.responseTime, tier };
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
