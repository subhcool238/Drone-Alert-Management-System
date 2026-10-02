import { useSecondsSinceLoad } from './incidents';

// Scenario clock: it reads 02:37:00 when the app first loads and then ticks every
// second. It builds on the same load moment as the SLA clocks (stored once at module
// level in data/incidents.ts), so it keeps counting when you move between screens.
const SCENARIO_START_SECONDS = 2 * 3600 + 37 * 60;

const pad = (n: number) => String(n).padStart(2, '0');

export const formatScenarioTime = (secondsSinceLoad: number): string => {
  const total = (SCENARIO_START_SECONDS + secondsSinceLoad) % 86400;
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};

export const useScenarioClock = (): string => formatScenarioTime(useSecondsSinceLoad());
