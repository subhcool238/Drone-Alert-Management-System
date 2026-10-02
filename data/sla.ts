import { Incident } from '../types';

// The one source of SLA response times per severity tier, in seconds.
// Alert cards, the Incidents table and panel, the Header summary and the
// Settings severity tiers all read from here.
export const SLA_SECONDS: Record<Incident['severity'], number> = {
  CRITICAL: 30,
  HIGH: 2 * 60,
  MEDIUM: 5 * 60,
  LOW: 15 * 60
};

// 30 -> "30s", 120 -> "2m", 900 -> "15m"
export const formatSlaTier = (seconds: number): string =>
  seconds >= 60 && seconds % 60 === 0 ? `${seconds / 60}m` : `${seconds}s`;
