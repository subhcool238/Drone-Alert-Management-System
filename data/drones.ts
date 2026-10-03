import { Drone, FleetStatus, RiskLevel } from '../types';
import { DRONE_IMAGE } from './images';

// One drone photo for the whole fleet (assets/images)
export const UNIFIED_DRONE_IMAGE = DRONE_IMAGE;

// Single source of truth for the fleet. Every screen reads from this list.
export const DRONES: Drone[] = [
  {
    id: 'D-001',
    name: 'Sentinel-1',
    status: FleetStatus.ACTIVE,
    risk: RiskLevel.LOW,
    battery: 78,
    batteryTimeRemaining: '35m',
    health: 98,
    nominalCapacity: 100,
    link: 'Strong',
    linkStrength: 98,
    cycles: 132,
    cyclesRemaining: 1868,
    lastSync: '2s ago',
    image: UNIFIED_DRONE_IMAGE,
    type: 'Indoor Guardian Pro',
    fwVersion: 'v2.4.1',
    flightTimeToday: '4h 12m',
    avgSpeed: 4.2,
    anomalies: ['All systems nominal', 'Vibration within threshold'],
    nextServiceHours: 124,
    x: 4.5, y: 42, altitude: 12.4 // Perimeter Alpha, west side
  },
  {
    id: 'D-004',
    name: 'Sentinel-2',
    status: FleetStatus.IDLE,
    risk: RiskLevel.LOW,
    battery: 100,
    batteryTimeRemaining: '46m',
    health: 96,
    nominalCapacity: 100,
    link: 'Strong',
    linkStrength: 95,
    cycles: 210,
    cyclesRemaining: 1790,
    lastSync: '5s ago',
    image: UNIFIED_DRONE_IMAGE,
    type: 'Indoor Guardian Pro',
    fwVersion: 'v2.4.1',
    flightTimeToday: '1h 20m',
    avgSpeed: 4.0,
    anomalies: ['All systems nominal', 'Vibration within threshold'],
    nextServiceHours: 210,
    x: 66, y: 73, altitude: 0 // dock bay 1
  },
  {
    id: 'D-005',
    name: 'Sentinel-3',
    status: FleetStatus.CHARGING,
    risk: RiskLevel.LOW,
    battery: 12,
    batteryTimeRemaining: '6m',
    health: 92,
    nominalCapacity: 98,
    link: 'Good',
    linkStrength: 88,
    cycles: 310,
    cyclesRemaining: 1690,
    lastSync: '8s ago',
    image: UNIFIED_DRONE_IMAGE,
    type: 'Indoor Guardian Pro',
    fwVersion: 'v2.4.1',
    flightTimeToday: '3h 40m',
    avgSpeed: 4.1,
    anomalies: ['All systems nominal', 'Charge rate within threshold'],
    nextServiceHours: 160,
    x: 89, y: 73, altitude: 0 // dock bay 3, charging
  },
  {
    id: 'D-006',
    name: 'Sentinel-4',
    status: FleetStatus.ACTIVE,
    risk: RiskLevel.LOW,
    battery: 65,
    batteryTimeRemaining: '30m',
    health: 94,
    nominalCapacity: 100,
    link: 'Strong',
    linkStrength: 93,
    cycles: 180,
    cyclesRemaining: 1820,
    lastSync: '3s ago',
    image: UNIFIED_DRONE_IMAGE,
    type: 'Indoor Guardian Pro',
    fwVersion: 'v2.4.1',
    flightTimeToday: '3h 05m',
    avgSpeed: 4.3,
    anomalies: ['All systems nominal', 'Gimbal calibration within threshold'],
    nextServiceHours: 140,
    x: 48, y: 28, altitude: 12.4 // North Courtyard
  },
  {
    id: 'D-002',
    name: 'Watcher-3',
    status: FleetStatus.IDLE,
    risk: RiskLevel.MEDIUM,
    battery: 100,
    batteryTimeRemaining: '45m',
    health: 75,
    nominalCapacity: 92,
    link: 'Good',
    linkStrength: 82,
    cycles: 450,
    cyclesRemaining: 1550,
    lastSync: '10m ago',
    image: UNIFIED_DRONE_IMAGE,
    type: 'Thermal Scout',
    fwVersion: 'v2.3.0',
    flightTimeToday: '2h 05m',
    avgSpeed: 3.8,
    anomalies: ['Lens calibration requested', 'Minor GPS drift detected'],
    nextServiceHours: 12,
    x: 80, y: 84, altitude: 0 // dock bay 5
  },
  {
    id: 'D-003',
    name: 'Surveyor-X',
    status: FleetStatus.FAULT,
    risk: RiskLevel.HIGH,
    battery: 12,
    batteryTimeRemaining: '0m',
    health: 45,
    nominalCapacity: 68,
    link: 'Weak',
    linkStrength: 15,
    cycles: 1205,
    cyclesRemaining: 795,
    lastSync: '1h ago',
    image: UNIFIED_DRONE_IMAGE,
    type: 'High-Altitude Recon',
    fwVersion: 'v1.9.8',
    flightTimeToday: '8h 44m',
    avgSpeed: 12.5,
    anomalies: ['Battery cell degradation', 'Telemetry link failure'],
    nextServiceHours: 0,
    x: 32.5, y: 70, altitude: 0 // last known position, West Corridor
  }
];

export const getDroneById = (id: string): Drone | undefined => DRONES.find(d => d.id === id);

export const getDroneByName = (name: string): Drone => {
  const drone = DRONES.find(d => d.name === name);
  if (!drone) throw new Error(`Unknown drone: ${name}`);
  return drone;
};

export const countByStatus = (status: FleetStatus): number => DRONES.filter(d => d.status === status).length;

// Drones that are not in Fault count as online
export const getOnlineCount = (): number => DRONES.filter(d => d.status !== FleetStatus.FAULT).length;

export const getFleetBatteryAvg = (): number =>
  Math.round(DRONES.reduce((sum, d) => sum + d.battery, 0) / DRONES.length);

// Display labels and dot colours used by the briefing tiles
export const STATUS_LABEL: Record<FleetStatus, string> = {
  [FleetStatus.ACTIVE]: 'Active',
  [FleetStatus.IDLE]: 'Idle',
  [FleetStatus.CHARGING]: 'Charging',
  [FleetStatus.FAULT]: 'Fault'
};

export const STATUS_DOT: Record<FleetStatus, string> = {
  [FleetStatus.ACTIVE]: 'bg-emerald-500',
  [FleetStatus.IDLE]: 'bg-primary',
  [FleetStatus.CHARGING]: 'bg-warning',
  [FleetStatus.FAULT]: 'bg-danger'
};

// Manual control health gate (flowchart: the drone must be healthy first).
// Returns the reason text when a drone cannot be taken under manual control, or null when it can.
export const MIN_MANUAL_BATTERY = 50;

export const getManualControlBlock = (d: Drone): string | null => {
  if (d.status === FleetStatus.FAULT) return 'Fault';
  if (d.status === FleetStatus.CHARGING) return `Charging, ${d.battery}%`;
  if (d.battery <= MIN_MANUAL_BATTERY) return `Battery ${d.battery}%`;
  return null;
};
