
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

export interface Drone {
  id: string;
  name: string;
  status: FleetStatus;
  risk: RiskLevel;
  battery: number;
  batteryTimeRemaining?: string;
  health: number; // 0-100 score
  nominalCapacity: number; // For predictive maintenance
  link: string;
  linkStrength: number; // 0-100
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

export interface Incident {
  id: string;
  timestamp: string;
  title: string;
  threat: ThreatType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Investigating' | 'Resolved' | 'Closed';
  assignedTo?: string;
  location: string;
  slaLimit: number; // in seconds
  elapsed: number; // in seconds
  isLikelyFalseAlarm?: boolean;
  // Added slaBreach to fix property access errors in Incidents page
  slaBreach?: string;
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
}

export interface Guard {
  id: string;
  name: string;
  location: string;
  status: 'Patrolling' | 'Stationary' | 'On Break';
  assignment: string;
}