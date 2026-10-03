import React, { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { COLORS } from '../data/theme';
import { COVERAGE_GAP } from '../data/patrols';
import {
  BUILDING, DOCK_BAYS, DOORS, FENCE, MAIN_GATE, PLAN_H, PLAN_W, ROOMS, getRoom, placeAt,
  Point, Room
} from '../data/plan';

/**
 * The shared museum floor plan, drawn in SVG (2D) or as an isometric extrusion (3D, SVG only,
 * no 3D library). Markers are real buttons laid over the drawing. Everything on the plan is
 * positioned in plan units (0 to 100 across and down, from data/plan.ts).
 */

export type MarkerTone = 'active' | 'idle' | 'charging' | 'fault' | 'p1' | 'p2' | 'p3' | 'p4';

export interface PlanMarker {
  id: string;
  kind: 'drone' | 'incident';
  x: number;
  y: number;
  /** metres above the floor (3D stem height) */
  altitude?: number;
  label: string;
  /** short text inside an incident pin (P1, P2 ...) */
  badge?: string;
  /** Material icon name inside a drone marker */
  icon?: string;
  tone: MarkerTone;
  ariaLabel: string;
  selected?: boolean;
  /** where the name chip sits (default below the marker) */
  labelSide?: 'below' | 'right';
  /** soft pulse (alert pins only) */
  pulse?: boolean;
  onSelect?: () => void;
}

export interface PlanRoute { name: string; points: Point[]; numbered?: boolean }
export interface PlanZone { id: string; label: string; x: number; y: number; w: number; h: number }

export interface LegendItem {
  label: string;
  /** an icon (name and colour class), a coloured box, a hatched box or a dashed line */
  swatch: { icon: string; className: string } | { box: string } | { boxes: string[] } | 'hatch' | 'dash';
}

interface MuseumPlanProps {
  mode?: '2D' | '3D';
  markers?: PlanMarker[];
  route?: PlanRoute;
  showGap?: boolean;
  blindSpots?: PlanZone[];
  legend?: LegendItem[];
  /** extra classes for the drawing wrapper (for example the thermal view filter) */
  drawingClassName?: string;
  /** space kept free around the drawing, in px (for overlay cards that sit above or below it) */
  insets?: { top?: number; bottom?: number };
  /** extra classes for the legend row */
  legendClassName?: string;
}

const MARKER_STYLE: Record<MarkerTone, string> = {
  active: 'bg-background border-primary text-primary',
  idle: 'bg-background border-gray-300 text-gray-200',
  charging: 'bg-background border-caution text-caution',
  fault: 'bg-danger-strong border-danger-light text-white',
  p1: 'bg-danger-strong border-white/70 text-white',
  p2: 'bg-warning border-white/70 text-black',
  p3: 'bg-caution border-white/70 text-black',
  p4: 'bg-success border-white/70 text-black'
};

// Greedy word wrap for a room label
const wrap = (text: string, maxChars: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > maxChars) { lines.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) lines.push(line);
  return lines;
};

// ---- 3D projection (isometric, 30 degrees). Plan units are 8 x 5 drawing units.
const C30 = 0.866;
const VB3 = { x: -30, y: -70, w: 1238, h: 800 };
const Z_PER_METRE = 4;
const BLOCK_H: Record<Room['kind'], number> = { room: 26, corridor: 6, courtyard: 0, docks: 12 };
const proj = (px: number, py: number, z = 0) => {
  const u = px * (PLAN_W / 100), v = py * (PLAN_H / 100);
  return { sx: (u - v + PLAN_H) * C30, sy: (u + v) * 0.5 - z };
};
const baseZ = (px: number, py: number): number => {
  const name = placeAt(px, py);
  if (name === 'Perimeter Alpha') return 0;
  return BLOCK_H[getRoom(name).kind] + 4; // top of the room block (the slab under it is 4 high)
};
const poly = (pts: { sx: number; sy: number }[]) => pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');

const CameraIcon: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <g transform={`translate(${x},${y}) scale(${k})`} stroke={COLORS.textMuted} strokeWidth="1.6" fill="none">
    <rect x="-7" y="-4.5" width="10" height="9" rx="1.5" />
    <path d="M3 -1 L8 -4 V4 L3 1 Z" />
  </g>
);
const MotionIcon: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <g transform={`translate(${x},${y}) scale(${k})`} stroke={COLORS.textMuted} strokeWidth="1.6" fill="none">
    <circle r="1.8" fill={COLORS.textMuted} />
    <path d="M-4.5 -4.5 A6.4 6.4 0 0 0 -4.5 4.5 M4.5 -4.5 A6.4 6.4 0 0 1 4.5 4.5" />
    <path d="M-8 -7.5 A10.8 10.8 0 0 0 -8 7.5 M8 -7.5 A10.8 10.8 0 0 1 8 7.5" />
  </g>
);

const Swatch: React.FC<{ s: LegendItem['swatch'] }> = ({ s }) => {
  if (s === 'hatch') {
    return <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-caution" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${COLORS.caution} 0 2px, transparent 2px 5px)` }} />;
  }
  if (s === 'dash') return <span aria-hidden="true" className="inline-block w-4 border-t-2 border-dashed border-primary" />;
  if ('boxes' in s) return <span aria-hidden="true" className="inline-flex gap-0.5">{s.boxes.map(b => <span key={b} className={`inline-block size-3 rounded-full ${b}`} />)}</span>;
  if ('icon' in s) return <span aria-hidden="true" className={`material-symbols-outlined text-[16px] ${s.className}`}>{s.icon}</span>;
  return <span aria-hidden="true" className={`inline-block size-3 rounded-full ${s.box}`} />;
};

const MuseumPlan: React.FC<MuseumPlanProps> = ({
  mode = '2D', markers = [], route, showGap = true, blindSpots = [], legend, drawingClassName = '', legendClassName = '', insets
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = () => setBox({ w: Math.max(el.clientWidth, 100), h: Math.max(el.clientHeight, 100) });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const is3D = mode === '3D';
  const vb = is3D ? VB3 : { x: 0, y: 0, w: PLAN_W, h: PLAN_H };
  const aspect = vb.w / vb.h;
  const pw = Math.min(box.w, box.h * aspect);
  const ph = pw / aspect;
  const scale = pw / vb.w;             // screen px per drawing unit
  const fs = 12.5 / scale;             // a 12.5px label, in drawing units
  const charPx = 6.9;                  // approx width of a bold capital at 12.5px

  const gapRoom = getRoom(COVERAGE_GAP.zone);
  const gapText = `Gap ${COVERAGE_GAP.minutes} min`;

  // ---- label lines for a room, wrapped to the room's on-screen width
  const labelLines = (r: Room): string[] => {
    const px = is3D
      ? (r.labelAt === 'vertical' ? r.h * (PLAN_H / 100) : r.w * (PLAN_W / 100)) * scale
      : ((r.labelAt === 'vertical' ? r.h * (PLAN_H / 100) : r.w * (PLAN_W / 100))) * scale;
    const lines = wrap(r.name, Math.max(6, Math.floor((px - 10) / charPx)));
    if (showGap && r.name === COVERAGE_GAP.zone) lines.push(gapText);
    return lines;
  };

  // ======================================================== 2D drawing
  const X = (x: number) => x * (PLAN_W / 100);
  const Y = (y: number) => y * (PLAN_H / 100);

  const room2D = (r: Room) => {
    const fill = r.kind === 'courtyard' ? 'rgba(16,185,129,0.07)' : r.kind === 'corridor' ? 'rgba(255,255,255,0.05)' : r.kind === 'docks' ? 'rgba(6,182,212,0.07)' : 'rgba(255,255,255,0.025)';
    return <rect key={r.id} x={X(r.x)} y={Y(r.y)} width={X(r.w)} height={Y(r.h)} fill={fill} stroke="#64748b" strokeWidth={2.5} strokeDasharray={r.kind === 'courtyard' ? '2 0' : undefined} />;
  };

  const label2D = (r: Room) => {
    const lines = labelLines(r);
    const lh = fs * 1.22;
    if (r.labelAt === 'vertical') {
      const cx = X(r.x + r.w / 2), cy = Y(r.y + r.h * 0.36);
      return <text key={r.id} transform={`rotate(-90 ${cx} ${cy})`} x={cx} y={cy + fs * 0.35} textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600}>{lines.join(' ')}</text>;
    }
    const cx = X(r.x + r.w / 2);
    const y0 = r.labelAt === 'bottom' ? Y(r.y + r.h) - 6 - lh * (lines.length - 1) : Y(r.y) + fs * 1.25;
    return (
      <text key={r.id} x={cx} textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600}>
        {lines.map((l, i) => <tspan key={i} x={cx} y={y0 + i * lh} fill={l === gapText ? COLORS.caution : undefined}>{l}</tspan>)}
      </text>
    );
  };

  const drawing2D = (
    <>
      <defs>
        <pattern id="museum-gap-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="12" stroke={COLORS.caution} strokeWidth="4" strokeOpacity="0.5" />
        </pattern>
      </defs>
      {/* perimeter fence */}
      <rect x={X(FENCE.x)} y={Y(FENCE.y)} width={X(FENCE.w)} height={Y(FENCE.h)} fill="none" stroke={COLORS.primary} strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="10 6" />
      <rect x={X(MAIN_GATE.x - 4)} y={Y(MAIN_GATE.y) - 4} width={X(8)} height="8" fill={COLORS.background} />
      <path d={`M${X(MAIN_GATE.x - 4)} ${Y(MAIN_GATE.y) - 8} v16 M${X(MAIN_GATE.x + 4)} ${Y(MAIN_GATE.y) - 8} v16`} stroke={COLORS.textSecondary} strokeWidth="3" />
      {/* building */}
      <rect x={X(BUILDING.x)} y={Y(BUILDING.y)} width={X(BUILDING.w)} height={Y(BUILDING.h)} fill="#10141c" stroke="#94a3b8" strokeWidth="5" />
      {ROOMS.map(room2D)}
      {/* courtyard trees and paving */}
      {[[42, 24], [54, 24], [42, 35], [54, 35]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={X(x)} cy={Y(y)} r="11" fill="rgba(16,185,129,0.16)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
      ))}
      {/* coverage gap zone */}
      {showGap && <rect x={X(gapRoom.x)} y={Y(gapRoom.y)} width={X(gapRoom.w)} height={Y(gapRoom.h)} fill="url(#museum-gap-hatch)" stroke={COLORS.caution} strokeWidth="2.5" strokeDasharray="8 5" />}
      {/* blind spots */}
      {blindSpots.map(b => (
        <g key={b.id}>
          <rect x={X(b.x)} y={Y(b.y)} width={X(b.w)} height={Y(b.h)} fill="rgba(239,68,68,0.1)" stroke={COLORS.dangerLight} strokeWidth="2.5" strokeDasharray="5 4" />
          <text x={X(b.x + b.w / 2)} y={Y(b.y + b.h) - 6} textAnchor="middle" fill={COLORS.dangerLight} fontSize={fs} fontWeight={600} style={{ paintOrder: 'stroke' }} stroke={COLORS.background} strokeWidth={fs * 0.25} strokeLinejoin="round">{b.label}</text>
        </g>
      ))}
      {/* doorways */}
      {DOORS.map((d, i) => d.o === 'v'
        ? <line key={i} x1={X(d.x)} x2={X(d.x)} y1={Y(d.y - d.len / 2)} y2={Y(d.y + d.len / 2)} stroke="#10141c" strokeWidth="6" />
        : <line key={i} y1={Y(d.y)} y2={Y(d.y)} x1={X(d.x - d.len / 2)} x2={X(d.x + d.len / 2)} stroke="#10141c" strokeWidth="6" />)}
      {/* dock bays */}
      {DOCK_BAYS.map((b, i) => <rect key={i} x={X(b.x) - 16} y={Y(b.y) - 13} width="32" height="26" rx="4" fill="none" stroke={COLORS.primary} strokeOpacity="0.55" strokeWidth="1.8" strokeDasharray="3 3" />)}
      {/* sensors */}
      {ROOMS.flatMap(r => (r.sensors || []).map((s, i) => s.type === 'camera'
        ? <CameraIcon key={`${r.id}-${i}`} x={X(s.x)} y={Y(s.y)} k={1 / Math.max(scale, 0.4) * 0.8} />
        : <MotionIcon key={`${r.id}-${i}`} x={X(s.x)} y={Y(s.y)} k={1 / Math.max(scale, 0.4) * 0.8} />))}
      {/* main gate label */}
      <text x={X(MAIN_GATE.x + 5)} y={PLAN_H - 2} fill={COLORS.textSecondary} fontSize={fs} fontWeight={600}>Main Gate</text>
      {/* route */}
      {route && (
        <polyline points={[...route.points, route.points[0]].map(p => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke={COLORS.primary} strokeWidth="3" strokeDasharray="10 6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      )}
      {route && route.points.map((p, i) => route.numbered ? (
        <g key={i} transform={`translate(${X(p.x)},${Y(p.y)})`}>
          <circle r={9 / scale} fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" />
          <text y={fs * 0.36} textAnchor="middle" fill="#fff" fontSize={fs} fontWeight={700}>{i + 1}</text>
        </g>
      ) : <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="5" fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" />)}
      {ROOMS.map(label2D)}
    </>
  );

  // ======================================================== 3D drawing
  const box3D = (r: { x: number; y: number; w: number; h: number }, h: number, top: string, left: string, right: string, stroke = 'rgba(148,163,184,0.45)') => {
    const A = proj(r.x, r.y, h), B = proj(r.x + r.w, r.y, h), Cc = proj(r.x + r.w, r.y + r.h, h), D = proj(r.x, r.y + r.h, h);
    const Cb = proj(r.x + r.w, r.y + r.h, 0), Db = proj(r.x, r.y + r.h, 0), Bb = proj(r.x + r.w, r.y, 0);
    return (
      <>
        {h > 0 && <polygon points={poly([D, Cc, Cb, Db])} fill={left} stroke={stroke} strokeWidth="1" />}
        {h > 0 && <polygon points={poly([B, Cc, Cb, Bb])} fill={right} stroke={stroke} strokeWidth="1" />}
        <polygon points={poly([A, B, Cc, D])} fill={top} stroke={stroke} strokeWidth="1.2" />
      </>
    );
  };
  const sortedRooms = [...ROOMS].sort((a, b) => (a.x + a.w / 2 + a.y + a.h / 2) - (b.x + b.w / 2 + b.y + b.h / 2));

  const topFill: Record<Room['kind'], string> = { room: '#1c2433', corridor: '#161d2a', courtyard: '#12261f', docks: '#12303a' };

  // 3D labels lie flat on the roof of their room (the plan's x axis runs down and to the right)
  const label3D = (r: Room) => {
    const h = BLOCK_H[r.kind] + 4;
    const c = proj(r.x + r.w / 2, r.y + r.h * 0.34, h);
    if (r.labelAt === 'vertical') return null;
    if (false) {
      return <text key={r.id} x={c.sx} y={c.sy + fs * 0.35} textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600} style={{ paintOrder: 'stroke' }} stroke={COLORS.background} strokeWidth={fs * 0.25} strokeLinejoin="round">{r.name}</text>;
    }
    const lines = labelLines(r);
    const lh = fs * 1.22;
    const y0 = fs * 0.35 - ((lines.length - 1) * lh) / 2;
    return (
      <g key={r.id} transform={`matrix(${C30} 0.5 ${-C30} 0.5 ${c.sx} ${c.sy})`}>
        <text textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600} style={{ paintOrder: 'stroke' }} stroke={COLORS.background} strokeWidth={fs * 0.25} strokeLinejoin="round">
          {lines.map((l, i) => <tspan key={i} x={0} y={y0 + i * lh} fill={l === gapText ? COLORS.caution : undefined}>{l}</tspan>)}
        </text>
      </g>
    );
  };

  const fencePts = [proj(FENCE.x, FENCE.y), proj(FENCE.x + FENCE.w, FENCE.y), proj(FENCE.x + FENCE.w, FENCE.y + FENCE.h), proj(FENCE.x, FENCE.y + FENCE.h)];
  const gapTop = [proj(gapRoom.x, gapRoom.y, BLOCK_H[gapRoom.kind]), proj(gapRoom.x + gapRoom.w, gapRoom.y, BLOCK_H[gapRoom.kind]), proj(gapRoom.x + gapRoom.w, gapRoom.y + gapRoom.h, BLOCK_H[gapRoom.kind]), proj(gapRoom.x, gapRoom.y + gapRoom.h, BLOCK_H[gapRoom.kind])];

  const markerPos = (m: PlanMarker) => {
    if (!is3D) return { l: (m.x / 100) * 100, t: (m.y / 100) * 100, floor: null as null | { sx: number; sy: number }, top: null as null | { sx: number; sy: number } };
    const base = baseZ(m.x, m.y);
    // a drone's height follows its altitude (metres); one on the floor rests on its room
    const z = m.kind === 'drone' ? Math.max(base + 2, (m.altitude || 0) * Z_PER_METRE) : base + 10;
    const top = proj(m.x, m.y, z);
    const floor = proj(m.x, m.y, base);
    return { l: ((top.sx - vb.x) / vb.w) * 100, t: ((top.sy - vb.y) / vb.h) * 100, floor, top };
  };

  const drawing3D = (
    <>
      <defs>
        <pattern id="museum-gap-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="12" stroke={COLORS.caution} strokeWidth="4" strokeOpacity="0.6" />
        </pattern>
      </defs>
      {/* ground inside the fence */}
      <polygon points={poly(fencePts)} fill="#0e1219" stroke={COLORS.primary} strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="10 6" />
      {/* building slab */}
      {box3D(BUILDING, 4, '#10141c', '#0b0e14', '#080a0f', '#94a3b8')}
      {/* courtyard (open air, floor level) and blocks, back to front */}
      {sortedRooms.map(r => <g key={r.id}>{box3D(r, BLOCK_H[r.kind] + 4, topFill[r.kind], '#10151f', '#0b0f16')}</g>)}
      {/* trees in the courtyard */}
      {[[42, 24], [54, 24], [42, 35], [54, 35]].map(([x, y]) => {
        const p = proj(x, y, 4);
        return <g key={`${x}-${y}`}><line x1={p.sx} y1={p.sy} x2={p.sx} y2={p.sy - 14} stroke="rgba(16,185,129,0.6)" strokeWidth="3" /><circle cx={p.sx} cy={p.sy - 20} r="11" fill="rgba(16,185,129,0.25)" stroke="rgba(16,185,129,0.6)" strokeWidth="1.5" /></g>;
      })}
      {/* coverage gap on top of the wing */}
      {showGap && <polygon points={poly(gapTop.map(p => ({ sx: p.sx, sy: p.sy - 4 })))} fill="url(#museum-gap-hatch)" stroke={COLORS.caution} strokeWidth="2.5" strokeDasharray="8 5" />}
      {blindSpots.map(b => {
        const z = baseZ(b.x + b.w / 2, b.y + b.h / 2) + 4;
        const pts = [proj(b.x, b.y, z), proj(b.x + b.w, b.y, z), proj(b.x + b.w, b.y + b.h, z), proj(b.x, b.y + b.h, z)];
        return <polygon key={b.id} points={poly(pts)} fill="rgba(239,68,68,0.14)" stroke={COLORS.dangerLight} strokeWidth="2.5" strokeDasharray="5 4" />;
      })}
      {/* dock bays */}
      {DOCK_BAYS.map((b, i) => {
        const z = BLOCK_H.docks + 4;
        return <polygon key={i} points={poly([proj(b.x - 3.4, b.y - 4.4, z), proj(b.x + 3.4, b.y - 4.4, z), proj(b.x + 3.4, b.y + 4.4, z), proj(b.x - 3.4, b.y + 4.4, z)])} fill="none" stroke={COLORS.primary} strokeOpacity="0.6" strokeWidth="1.8" strokeDasharray="3 3" />;
      })}
      {/* gate */}
      {(() => { const g = proj(MAIN_GATE.x, MAIN_GATE.y); return <><line x1={g.sx - 14} y1={g.sy + 7} x2={g.sx - 14} y2={g.sy - 12} stroke={COLORS.textSecondary} strokeWidth="3" /><line x1={g.sx + 14} y1={g.sy - 7} x2={g.sx + 14} y2={g.sy - 26} stroke={COLORS.textSecondary} strokeWidth="3" /><text x={g.sx} y={g.sy + 22 + fs} textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600}>Main Gate</text></>; })()}
      {/* route */}
      {route && (
        <polyline points={poly([...route.points, route.points[0]].map(p => proj(p.x, p.y, baseZ(p.x, p.y) + 4)))} fill="none" stroke={COLORS.primary} strokeWidth="3" strokeDasharray="10 6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      )}
      {route && route.points.map((p, i) => {
        const q = proj(p.x, p.y, baseZ(p.x, p.y) + 4);
        return route.numbered
          ? <g key={i} transform={`translate(${q.sx},${q.sy})`}><circle r={9 / scale} fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" /><text y={fs * 0.36} textAnchor="middle" fill="#fff" fontSize={fs} fontWeight={700}>{i + 1}</text></g>
          : <circle key={i} cx={q.sx} cy={q.sy} r="5" fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" />;
      })}
      {ROOMS.map(label3D)}
      {/* stems: thin line from the floor up to the marker, and a floor shadow */}
      {markers.map(m => {
        const p = markerPos(m);
        if (!p.floor || !p.top) return null;
        return (
          <g key={m.id}>
            <ellipse cx={p.floor.sx} cy={p.floor.sy} rx="9" ry="4.5" fill="rgba(0,0,0,0.55)" />
            {p.top.sy < p.floor.sy - 1 && <line x1={p.floor.sx} y1={p.floor.sy} x2={p.top.sx} y2={p.top.sy} stroke={m.kind === 'drone' ? COLORS.primary : COLORS.textSecondary} strokeOpacity="0.7" strokeWidth="1.5" />}
          </g>
        );
      })}
    </>
  );

  // ======================================================== markers (real buttons)
  // Name chips: each goes below, right, left or above its marker, whichever is free of the room
  // labels, the other markers and the chips already placed (screen pixels).
  type Rect = { l: number; t: number; r: number; b: number };
  const hit = (a: Rect, b: Rect) => !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
  const chipSide: Record<string, 'below' | 'right' | 'left' | 'above'> = {};
  if (!is3D) {
    const obstacles: Rect[] = [];
    ROOMS.forEach(r => {
      const lines = labelLines(r);
      const lw = Math.max(...lines.map(l => l.length)) * charPx;
      const lhPx = 12.5 * 1.22;
      const cx = ((r.x + r.w / 2) / 100) * pw;
      if (r.labelAt === 'vertical') {
        const cy = ((r.y + r.h * 0.36) / 100) * ph;
        obstacles.push({ l: cx - 8, r: cx + 8, t: cy - lw / 2, b: cy + lw / 2 });
        return;
      }
      const hgt = lines.length * lhPx;
      const t = r.labelAt === 'bottom' ? ((r.y + r.h) / 100) * ph - 6 - hgt : (r.y / 100) * ph + 2;
      obstacles.push({ l: cx - lw / 2, r: cx + lw / 2, t, b: t + hgt });
    });
    const circles = markers.map(m => ({ l: (m.x / 100) * pw - 12, r: (m.x / 100) * pw + 12, t: (m.y / 100) * ph - 12, b: (m.y / 100) * ph + 12 }));
    obstacles.push(...circles);
    markers.forEach((m, i) => {
      const cx = (m.x / 100) * pw, cy = (m.y / 100) * ph;
      const w = m.label.length * 6.8 + 10, h = 18;
      const rects: Record<string, Rect> = {
        below: { l: cx - w / 2, r: cx + w / 2, t: cy + 14, b: cy + 14 + h },
        right: { l: cx + 16, r: cx + 16 + w, t: cy - h / 2, b: cy + h / 2 },
        left: { l: cx - 16 - w, r: cx - 16, t: cy - h / 2, b: cy + h / 2 },
        above: { l: cx - w / 2, r: cx + w / 2, t: cy - 14 - h, b: cy - 14 }
      };
      const order = m.labelSide === 'right' ? ['right', 'below', 'left', 'above'] : ['below', 'right', 'left', 'above'];
      const free = order.find(s => {
        const q = rects[s];
        if (q.l < 0 || q.r > pw || q.t < 0 || q.b > ph) return false;
        return !obstacles.some((o, k) => !(k === ROOMS.length + i) && hit(q, o));
      });
      const pick = (free || order[0]) as 'below' | 'right' | 'left' | 'above';
      chipSide[m.id] = pick;
      obstacles.push(rects[pick]);
    });
  }
  const markerButton = (m: PlanMarker) => {
    const p = markerPos(m);
    const left = is3D ? p.l : m.x;
    const top = is3D ? p.t : m.y;
    const side = is3D ? (m.labelSide === 'right' ? 'right' : 'below') : (chipSide[m.id] || 'below');
    const flex = side === 'right' ? 'flex-row items-center gap-1' : side === 'left' ? 'flex-row-reverse items-center gap-1' : side === 'above' ? 'flex-col-reverse items-center' : 'flex-col items-center';
    const shift = side === 'right' ? 'translate(-12px, -50%)' : side === 'left' ? 'translate(calc(-100% + 12px), -50%)' : side === 'above' ? 'translate(-50%, calc(-100% + 12px))' : 'translate(-50%, -12px)';
    return (
      <Button
        key={m.id}
        variant="bare"
        aria-label={m.ariaLabel}
        aria-pressed={!!m.selected}
        onClick={m.onSelect}
        className={`absolute z-20 flex ${flex} group/marker rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
        style={{ left: `${left}%`, top: `${top}%`, transform: shift }}
      >
        <span className="relative flex items-center justify-center">
          {m.pulse && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-danger-light/40 animate-pulse scale-150" />}
          <span aria-hidden="true" className={`relative size-6 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-lg ${MARKER_STYLE[m.tone]} ${m.selected ? 'ring-2 ring-white ring-offset-1 ring-offset-background' : ''}`}>
            {m.kind === 'drone'
              ? <span className="material-symbols-outlined text-[16px]">{m.icon || 'flight'}</span>
              : m.badge}
          </span>
        </span>
        {(!is3D || m.selected) && <span aria-hidden="true" className={`${side === 'right' || side === 'left' ? '' : side === 'above' ? 'mb-0.5' : 'mt-0.5'} px-1 py-0.5 rounded bg-background/90 border text-xs font-semibold leading-none whitespace-nowrap ${m.selected ? 'border-white text-white' : 'border-white/10 text-gray-200'}`}>{m.label}</span>}
      </Button>
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col p-4 gap-1" style={insets ? { paddingTop: insets.top, paddingBottom: insets.bottom } : undefined}>
      <div ref={areaRef} className="relative flex-1 min-h-0 flex items-center justify-center">
      <div className={`relative ${drawingClassName}`} style={{ width: pw, height: ph }}>
        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} width="100%" height="100%" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
          {is3D ? drawing3D : drawing2D}
        </svg>
        {markers.map(markerButton)}
        {/* every marker and zone as text, for screen readers */}
        <ul aria-label={`Museum plan, ${is3D ? '3D' : '2D'} view`} className="sr-only">
          {markers.map(m => <li key={m.id}>{m.ariaLabel}</li>)}
          {showGap && <li>Coverage gap: {COVERAGE_GAP.zone}, unpatrolled for {COVERAGE_GAP.minutes} minutes</li>}
          {blindSpots.map(b => <li key={b.id}>{b.label}, near {placeAt(b.x + b.w / 2, b.y + b.h / 2)}</li>)}
          {route && <li>Route {route.name}, {route.points.length} waypoints{route.numbered ? ', numbered 1 to ' + route.points.length : ''}</li>}
          <li>Rooms: {ROOMS.map(r => r.name).join(', ')}. Main Gate on the south fence.</li>
        </ul>
      </div>
      </div>
      {legend && (
        <div className={`shrink-0 flex flex-wrap justify-center gap-x-4 gap-y-0.5 ${legendClassName}`}>
          {legend.map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs font-bold text-gray-200 whitespace-nowrap">
              <Swatch s={l.swatch} />{l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MuseumPlan;
