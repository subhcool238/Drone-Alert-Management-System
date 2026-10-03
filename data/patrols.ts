import { PatrolRoute, FleetStatus, Drone } from '../types';
import type { Point } from './plan';
import { DRONES, STATUS_LABEL, getDroneByName } from './drones';

// The one shared coverage gap record. The Dashboard tile, briefing line,
// Header summary and Patrol Routes all read from here.
export const COVERAGE_GAP = { zone: 'North Storage Wing', minutes: 45 };

// Waypoints of each route on the museum plan (x and y from 0 to 100), in visiting order.
// The count of each list equals the "waypoints" number on the route card.
const gallerySweep = (): Point[] => {
  const xs = [38, 42, 46, 50, 54, 58];
  return [50, 60, 70, 80].flatMap((y, row) => (row % 2 === 0 ? xs : [...xs].reverse()).map(x => ({ x, y })));
};

export const ROUTE_WAYPOINTS: Record<string, Point[]> = {
  // Perimeter Alpha: once round the fence line, between the fence and the building
  'PR-01': [
    { x: 4.5, y: 6 }, { x: 30, y: 6 }, { x: 50, y: 6 }, { x: 72, y: 6 }, { x: 95.5, y: 6 }, { x: 95.5, y: 34 },
    { x: 95.5, y: 63 }, { x: 95.5, y: 93 }, { x: 70, y: 93 }, { x: 30, y: 93 }, { x: 4.5, y: 93 }, { x: 4.5, y: 50 }
  ],
  // North Storage Wing: a loop inside the wing
  'PR-02': [
    { x: 65, y: 19.5 }, { x: 74, y: 19.5 }, { x: 83, y: 19.5 }, { x: 92, y: 19.5 },
    { x: 92, y: 25 }, { x: 83, y: 25 }, { x: 74, y: 25 }, { x: 65, y: 25 }
  ],
  // Gallery Sweep: four passes through the Grand Gallery
  'PR-03': gallerySweep()
};

// The two blind spots the Patrol Routes card counts ("2 Zones")
export const BLIND_SPOTS: { id: string; label: string; x: number; y: number; w: number; h: number }[] = [
  { id: 'BS-1', label: 'Blind spot 1', x: 50, y: 10, w: 11, h: 14 },
  { id: 'BS-2', label: 'Blind spot 2', x: 7, y: 31, w: 10, h: 12 }
];

export const PATROL_ROUTES: PatrolRoute[] = [
  {
    id: 'PR-01',
    name: 'Perimeter Alpha',
    type: 'Standard',
    duration: '18 min',
    waypoints: 12,
    lastRun: '02:00 today',
    coverage: 100,
    status: 'ACTIVE',
    drones: [getDroneByName('Sentinel-1').name],
    guards: ['Pierre L.'],
    hasCoverageGap: false,
    frequency: 'Every 2 Hours',
    startTime: '00:00',
    endTime: '23:59',
    approvalStatus: 'Approved',
    isNightMode: true
  },
  {
    id: 'PR-02',
    name: COVERAGE_GAP.zone,
    type: 'Emergency',
    duration: '12 min',
    waypoints: 8,
    lastRun: 'Yesterday',
    coverage: 85,
    status: 'SCHEDULED',
    drones: [],
    guards: ['Sarah J.'],
    hasCoverageGap: true,
    gapDuration: `${COVERAGE_GAP.minutes} min`,
    frequency: 'On Demand',
    startTime: '00:00',
    endTime: '23:59',
    approvalStatus: 'Pending',
    isNightMode: true
  },
  {
    id: 'PR-03',
    name: 'Gallery Sweep',
    type: 'Standard',
    duration: '45 min',
    waypoints: 24,
    lastRun: 'Never',
    coverage: 0,
    status: 'DRAFT',
    drones: [getDroneByName('Watcher-3').name],
    guards: [],
    hasCoverageGap: false,
    frequency: 'Nightly',
    startTime: '22:00',
    endTime: '06:00',
    approvalStatus: 'N/A',
    isNightMode: true
  }
];

export const getCoverageGapCount = (): number => PATROL_ROUTES.filter(r => r.hasCoverageGap).length;

// Flowchart health checks for picking a drone: Idle, not in Fault, battery above 50%
export const MIN_RECOMMEND_BATTERY = 50;

export type PatrolRecommendation =
  | { ok: true; route: PatrolRoute; drone: Drone; summary: string; reason: string }
  | { ok: false; message: string };

// First anomaly flag that is not the "nominal" line
const firstFlag = (d: Drone): string | undefined => d.anomalies.find(a => !/nominal/i.test(a));

// Rule-based: pick the route with a coverage gap, then the Idle drone with the
// highest health score that is not in Fault and has more than 50% battery.
export const getPatrolRecommendation = (routes: PatrolRoute[] = PATROL_ROUTES): PatrolRecommendation => {
  const route = routes.find(r => r.hasCoverageGap);
  if (!route) return { ok: false, message: 'No route has a coverage gap.' };

  const idle = DRONES.filter(d => d.status === FleetStatus.IDLE);
  const eligible = idle.filter(d => d.status !== FleetStatus.FAULT && d.battery > MIN_RECOMMEND_BATTERY);
  if (eligible.length === 0) {
    return { ok: false, message: `No Idle drone above ${MIN_RECOMMEND_BATTERY}% battery.` };
  }

  const best = [...eligible].sort((a, b) => b.health - a.health)[0];
  const skipped = idle
    .filter(d => d.id !== best.id)
    .map(d => {
      if (d.battery <= MIN_RECOMMEND_BATTERY) return `${d.name} skipped: battery ${d.battery}%`;
      const flag = firstFlag(d);
      return `${d.name} skipped: health ${d.health}${flag ? `, flag: ${flag}` : ''}`;
    });

  const reason =
    `${best.name}: ${STATUS_LABEL[best.status]}, ${best.battery}% battery, health ${best.health}.` +
    skipped.map(s => ` ${s}.`).join('');

  return {
    ok: true,
    route,
    drone: best,
    summary: `Assign ${best.name} to ${route.name} (gap ${route.gapDuration}).`,
    reason
  };
};

const pad2 = (n: number) => String(n).padStart(2, '0');

// "Next Run" text per route, from its status and schedule:
// Draft: not scheduled. On demand: no time. Active "Every N Hours": last run plus N hours.
// Scheduled: the start of its window.
export const getNextRun = (route: PatrolRoute): string => {
  if (route.status === 'DRAFT') return 'Not scheduled';
  if (/on demand/i.test(route.frequency)) return 'On demand';
  if (route.status === 'ACTIVE') {
    const every = route.frequency.match(/Every (\d+) Hours?/i);
    const last = route.lastRun.match(/^(\d{1,2}):(\d{2})/);
    if (every && last) return `${pad2((Number(last[1]) + Number(every[1])) % 24)}:${last[2]}`;
  }
  return route.startTime;
};
