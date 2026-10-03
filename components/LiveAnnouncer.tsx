import React, { useEffect, useRef, useState } from 'react';
import { getOpenIncidents, getElapsed, getSlaState, useSecondsSinceLoad } from '../data/incidents';

type Priority = 'polite' | 'assertive';
type Listener = (message: string, priority: Priority) => void;

const listeners = new Set<Listener>();

/** Announce a message to screen readers once. Use it for state changes, never for ticking values. */
export const announce = (message: string, priority: Priority = 'polite') => {
  listeners.forEach(l => l(message, priority));
};

/**
 * Two visually hidden live regions (polite and assertive) that stay mounted for the whole
 * session, plus the watcher that announces incident and SLA state changes. Nothing here
 * announces the countdown values themselves: only a change of state (new incident,
 * Responded, Breached, Warning, Critical) is spoken, once.
 */
const LiveAnnouncer: React.FC = () => {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');

  useEffect(() => {
    const listener: Listener = (message, priority) => {
      const set = priority === 'assertive' ? setAssertive : setPolite;
      // Clear first so the same message can be announced again
      set('');
      window.setTimeout(() => set(message), 50);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Watch the open incidents and speak only when an incident appears or its SLA state changes
  const seconds = useSecondsSinceLoad();
  const previous = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    const next: Record<string, string> = {};
    const titles: Record<string, string> = {};
    getOpenIncidents().forEach(inc => {
      const sla = getSlaState(inc, seconds);
      let level = 'ok';
      if (sla.kind === 'responded') level = 'Responded';
      else if (sla.kind === 'breached') level = 'Breached';
      else if (sla.kind === 'ticking') {
        const ratio = (inc.slaLimit - getElapsed(inc, seconds)) / inc.slaLimit;
        level = ratio < 0.2 ? 'Critical (red)' : ratio < 0.5 ? 'Warning (yellow)' : 'ok';
      }
      next[inc.id] = level;
      titles[inc.id] = inc.title;
    });
    const before = previous.current;
    if (before) {
      Object.entries(next).forEach(([id, level]) => {
        const old = before[id];
        if (old === undefined) {
          announce(`New incident ${id}: ${titles[id]}`, 'assertive');
        } else if (old !== level && level !== 'ok') {
          const urgent = level === 'Breached' || level.startsWith('Critical');
          announce(`${id}, ${titles[id]}: ${level}`, urgent ? 'assertive' : 'polite');
        }
      });
    }
    previous.current = next;
  }, [seconds]);

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{polite}</div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">{assertive}</div>
    </>
  );
};

export default LiveAnnouncer;
