
export enum FleetStatus {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  CHARGING = 'CHARGING',
  FAULT = 'FAULT'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ThreatType {
  HUMAN = 'HUMAN',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  SENSOR = 'SENSOR',
  OTHER = 'OTHER'
}

export interface TimelineEvent {
  time: string;
  event: string;
  details?: string;
  type: 'alert' | 'action' | 'escalation' | 'resolution';
}

export interface Incident {
  id: string;
  timestamp: string;
  title: string;
  threat: ThreatType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Investigating' | 'Responding' | 'Resolved' | 'Closed' | 'Escalated';
  assignedTo: string;
  location: string;
  slaLimit: number; // in seconds
  elapsed: number; // in seconds
  isLikelyFalseAlarm?: boolean;
  slaBreach?: string;
  respondedBy: string;
  responseTime: string;
  falseAlarmReason?: string;
  timeline: TimelineEvent[];
  evidence?: {
    type: 'video' | 'image' | 'log';
    url: string;
    caption: string;
  }[];
}

/**
 * Interface representing a drone in the fleet.
 * Fixes: Module '"../types"' has no exported member 'Drone'.
 */
export interface Drone {
  id: string;
  name: string;
  status: FleetStatus;
  risk: RiskLevel;
  battery: number;
  batteryTimeRemaining: string;
  health: number;
  nominalCapacity: number;
  link: string;
  linkStrength: number;
  cycles: number;
  cyclesRemaining: number;
  lastSync: string;
  image: string;
  type: string;
  fwVersion: string;
  flightTimeToday: string;
  avgSpeed: number;
  anomalies: string[];
  nextServiceHours: number;
}

export interface PatrolRoute {
  id: string;
  name: string;
  type: 'Standard' | 'Emergency';
  duration: string;
  waypoints: number;
  lastRun: string;
  coverage: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'DRAFT';
  drones: string[];
  guards: string[];
  hasCoverageGap: boolean;
  gapDuration?: string;
  frequency: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  approvalStatus: 'Pending' | 'Approved' | 'N/A';
  isNightMode: boolean;
}

export interface Guard {
  id: string;
  name: string;
  location: string;
  status: 'Patrolling' | 'Stationary' | 'On Break';
  assignment: string;
}