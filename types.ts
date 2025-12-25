
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

export interface Drone {
  id: string;
  name: string;
  status: FleetStatus;
  risk: RiskLevel;
  battery: number;
  health: number;
  link: string;
  cycles: number;
  lastSync: string;
  image: string;
  type: string;
  fwVersion: string;
}

export interface Incident {
  id: string;
  timestamp: string;
  title: string;
  threat: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Investigating' | 'Resolved' | 'Closed';
  assignedTo?: string;
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
