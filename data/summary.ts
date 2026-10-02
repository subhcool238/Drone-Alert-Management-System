import { FleetStatus, Incident } from '../types';
import { STATUS_LABEL, countByStatus } from './drones';
import { getOpenIncidents, getElapsed, formatSla } from './incidents';
import { COVERAGE_GAP, getCoverageGapCount } from './patrols';

const SEVERITY_RANK: Record<Incident['severity'], number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

// Rule-based system summary built only from the shared drone, incident and patrol data.
export const buildSystemSummary = (secondsSinceLoad: number): string => {
  const open = getOpenIncidents();
  const parts: string[] = [];

  parts.push(open.length === 0 ? 'No open incidents.' : `Open incidents: ${open.length}.`);

  const counts = [FleetStatus.ACTIVE, FleetStatus.IDLE, FleetStatus.CHARGING, FleetStatus.FAULT]
    .map(s => `${countByStatus(s)} ${STATUS_LABEL[s]}`)
    .join(', ');
  parts.push(`Drones: ${counts}.`);

  // Highest severity open alert; ties go to the one with the least SLA time left
  const top = [...open].sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      (a.slaLimit - getElapsed(a, secondsSinceLoad)) - (b.slaLimit - getElapsed(b, secondsSinceLoad))
  )[0];
  if (top) {
    const left = formatSla({ ...top, elapsed: getElapsed(top, secondsSinceLoad) });
    parts.push(`Highest: ${top.severity} ${top.title}, SLA ${left} left.`);
  }

  parts.push(
    getCoverageGapCount() > 0
      ? `Coverage gap: ${COVERAGE_GAP.zone}, ${COVERAGE_GAP.minutes} min.`
      : 'No coverage gaps.'
  );

  return parts.join(' ');
};
