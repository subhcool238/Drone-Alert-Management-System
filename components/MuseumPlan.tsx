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
 * no 3D library) that can be rotated. Markers are real buttons laid over the drawing.
 * Everything on the plan is positioned in plan units (0 to 100 across and down, data/plan.ts).
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
  /** preferred side of the name chip (it moves if that spot is taken) */
  labelSide?: 'below' | 'right';
  /** soft pulse (alert pins only) */
  pulse?: boolean;
  onSelect?: () => void;
}

export interface PlanRoute { name: string; points: Point[]; numbered?: boolean }
export interface PlanZone { id: string; label: string; x: number; y: number; w: number; h: number }

export interface LegendItem {
  label: string;
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
  /** extra classes for the legend row */
  legendClassName?: string;
  /** space kept free above and below the drawing, in px (for overlay cards) */
  insets?: { top?: number; bottom?: number };
  /** size the drawing to the full width of its box (the box grows to fit) instead of filling the box */
  fitWidth?: boolean;
  /** 3D only: drag, or use the buttons, to rotate the view */
  rotatable?: boolean;
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

type Rect = { l: number; t: number; r: number; b: number };
const hit = (a: Rect, b: Rect) => !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
const overlapArea = (a: Rect, b: Rect) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

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

// ---- 3D (isometric). The plan is rotated about its centre by "angle", then projected.
const C30 = 0.866;
const K3 = 0.7; // vertical squash of the projection (0.5 is true isometric; a little more top-down uses the panel better)
const Z_PER_METRE = 4;
const BLOCK_H: Record<Room['kind'], number> = { room: 26, corridor: 6, courtyard: 0, docks: 12 };

const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;

const Swatch: React.FC<{ s: LegendItem['swatch'] }> = ({ s }) => {
  if (s === 'hatch') {
    return <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-caution" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${COLORS.caution} 0 2px, transparent 2px 5px)` }} />;
  }
  if (s === 'dash') return <span aria-hidden="true" className="inline-block w-4 border-t-2 border-dashed border-primary" />;
  if ('boxes' in s) return <span aria-hidden="true" className="inline-flex gap-0.5">{s.boxes.map(b => <span key={b} className={`inline-block size-3 rounded-full ${b}`} />)}</span>;
  if ('icon' in s) return <span aria-hidden="true" className={`material-symbols-outlined text-[16px] ${s.className}`}>{s.icon}</span>;
  return <span aria-hidden="true" className={`inline-block size-3 rounded-full ${s.box}`} />;
};

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

const MuseumPlan: React.FC<MuseumPlanProps> = ({
  mode = '2D', markers = [], route, showGap = true, blindSpots = [], legend, drawingClassName = '',
  legendClassName = '', insets, fitWidth = false, rotatable = false
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 500 });
  const [angle, setAngle] = useState(0);
  const dragX = useRef<number | null>(null);

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
  const gapRoom = getRoom(COVERAGE_GAP.zone);
  const gapText = `Gap ${COVERAGE_GAP.minutes} min`;

  // ---- projection
  const rad = (angle * Math.PI) / 180;
  const cs = Math.cos(rad), sn = Math.sin(rad);
  const proj = (px: number, py: number, z = 0) => {
    const u0 = px * (PLAN_W / 100) - PLAN_W / 2, v0 = py * (PLAN_H / 100) - PLAN_H / 2;
    const u = u0 * cs - v0 * sn, v = u0 * sn + v0 * cs;
    return { sx: (u - v) * C30, sy: (u + v) * K3 - z, depth: u + v };
  };
  const baseZ = (px: number, py: number): number => {
    const name = placeAt(px, py);
    if (name === 'Perimeter Alpha') return 0;
    return BLOCK_H[getRoom(name).kind] + 4; // top of the room block (the slab under it is 4 high)
  };
  // frame: the whole plan in 2D; in 3D the rotated plan (fence corners, with room above for markers and labels)
  const vb = (() => {
    if (!is3D) return { x: 0, y: 0, w: PLAN_W, h: PLAN_H };
    const pts = [proj(FENCE.x, FENCE.y), proj(FENCE.x + FENCE.w, FENCE.y), proj(FENCE.x + FENCE.w, FENCE.y + FENCE.h), proj(FENCE.x, FENCE.y + FENCE.h)];
    const minX = Math.min(...pts.map(p => p.sx)) - 30, maxX = Math.max(...pts.map(p => p.sx)) + 30;
    const minY = Math.min(...pts.map(p => p.sy)) - 70, maxY = Math.max(...pts.map(p => p.sy)) + 75;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  })();
  const aspect = vb.w / vb.h;
  const pw = fitWidth ? box.w : Math.min(box.w, box.h * aspect);
  const ph = pw / aspect;
  const scale = pw / vb.w;          // screen px per drawing unit
  const fs = 12.5 / scale;          // a 12.5px label, in drawing units
  const toU = (px: number) => px / scale;
  const charPx = 6.9;               // approx width of a semi-bold character at 12.5px
  const lhPx = 12.5 * 1.22;
  // plan position (and height) to screen pixels inside the drawing
  const toPx = (x: number, y: number, z = 0) => {
    if (!is3D) return { x: (x / 100) * pw, y: (y / 100) * ph };
    const p = proj(x, y, z);
    return { x: (p.sx - vb.x) * scale, y: (p.sy - vb.y) * scale };
  };
  const markerZ = (m: PlanMarker) => {
    const base = baseZ(m.x, m.y);
    // a drone's height follows its altitude (metres); one on the floor rests on its room
    return m.kind === 'drone' ? Math.max(base + 2, (m.altitude || 0) * Z_PER_METRE) : base + 10;
  };

  // ======================================================== labels (screen px)
  interface LabelBox { room: Room; lines: string[]; cx: number; top: number; rect: Rect; vertical: boolean }
  const gapLinesFor = (r: Room, lines: string[]) => (showGap && r.name === COVERAGE_GAP.zone ? [...lines, gapText] : lines);
  const sizeOf = (lines: string[]) => ({ w: Math.max(...lines.map(l => l.length)) * charPx + 4, h: lines.length * lhPx });

  const labels: LabelBox[] = [];
  const placed: Rect[] = [];
  if (!is3D) {
    ROOMS.forEach(r => {
      const vertical = r.labelAt === 'vertical';
      const roomPx = (vertical ? r.h * (PLAN_H / 100) : r.w * (PLAN_W / 100)) * scale;
      const lines = vertical ? [r.name] : gapLinesFor(r, wrap(r.name, Math.max(6, Math.floor((roomPx - 10) / charPx))));
      const { w: w4, h } = sizeOf(lines);
      const w = w4 - 4;
      const cx = ((r.x + r.w / 2) / 100) * pw;
      let top: number;
      let rect: Rect;
      if (vertical) {
        const cy = ((r.y + r.h * 0.36) / 100) * ph;
        top = cy;
        rect = { l: cx - 8, r: cx + 8, t: cy - w / 2, b: cy + w / 2 };
      } else {
        top = r.labelAt === 'bottom' ? ((r.y + r.h) / 100) * ph - 6 - h : (r.y / 100) * ph + 2;
        rect = { l: cx - w / 2, r: cx + w / 2, t: top, b: top + h };
      }
      labels.push({ room: r, lines, cx, top, rect, vertical });
      placed.push(rect);
    });
  } else {
    // roofs from the far side to the near side; each label tries a few spots on its roof so labels keep a gap
    const circles: Rect[] = markers.map(m => {
      const c = toPx(m.x, m.y, markerZ(m));
      return { l: c.x - 12, r: c.x + 12, t: c.y - 12, b: c.y + 12 };
    });
    const order = [...ROOMS].filter(r => r.labelAt !== 'vertical').sort((a, b) => proj(a.x + a.w / 2, a.y + a.h / 2).depth - proj(b.x + b.w / 2, b.y + b.h / 2).depth);
    order.forEach(r => {
      const h = BLOCK_H[r.kind] + 4;
      const corners = [proj(r.x, r.y, h), proj(r.x + r.w, r.y, h), proj(r.x + r.w, r.y + r.h, h), proj(r.x, r.y + r.h, h)];
      const roofPx = (Math.max(...corners.map(c => c.sx)) - Math.min(...corners.map(c => c.sx))) * scale;
      const lines = gapLinesFor(r, wrap(r.name, Math.max(6, Math.floor((roofPx * 0.62) / charPx))));
      const { w, h: bh } = sizeOf(lines);
      const c = toPx(r.x + r.w / 2, r.y + r.h / 2, h);
      const tries = [0, -0.7, 0.7, -1.4, 1.4, -2.1, 2.1].map(k => k * bh);
      let chosen: Rect | null = null;
      let best: Rect | null = null;
      let bestScore = Infinity;
      for (const dy of tries) {
        const rect = { l: c.x - w / 2, r: c.x + w / 2, t: c.y - bh / 2 + dy, b: c.y + bh / 2 + dy };
        const score = [...placed, ...circles].reduce((s, o) => s + overlapArea(rect, o), 0);
        if (score === 0) { chosen = rect; break; }
        if (score < bestScore) { bestScore = score; best = rect; }
      }
      // no free spot on a small view: leave the name off rather than crowd it (it is still in the hidden text list)
      if (!chosen) return;
      const rect = chosen;
      void best;
      labels.push({ room: r, lines, cx: c.x, top: rect.t, rect, vertical: false });
      placed.push(rect);
    });
  }

  // ======================================================== blind spot labels (2D): outside the zone, with a leader line
  interface BlindLabel { zone: PlanZone; rect: Rect; from: { x: number; y: number }; to: { x: number; y: number } }
  const blindLabels: BlindLabel[] = [];
  if (!is3D) {
    const obstacles: Rect[] = [...placed];
    ROOMS.forEach(r => (r.sensors || []).forEach(s => { const x = (s.x / 100) * pw, y = (s.y / 100) * ph; obstacles.push({ l: x - 11, r: x + 11, t: y - 11, b: y + 11 }); }));
    if (route?.numbered) route.points.forEach(p => { const x = (p.x / 100) * pw, y = (p.y / 100) * ph; obstacles.push({ l: x - 10, r: x + 10, t: y - 10, b: y + 10 }); });
    blindSpots.forEach(z => {
      const zr: Rect = { l: (z.x / 100) * pw, t: (z.y / 100) * ph, r: ((z.x + z.w) / 100) * pw, b: ((z.y + z.h) / 100) * ph };
      const w = z.label.length * charPx + 6, h = lhPx + 2;
      const gap = 10;
      const cands: Rect[] = [];
      // spots around the zone, nearest first
      for (let d = 0; d <= 4; d++) {
        const k = gap + d * 14;
        cands.push(
          { l: zr.r + k, t: zr.t, r: zr.r + k + w, b: zr.t + h },
          { l: zr.l - k - w, t: zr.t, r: zr.l - k, b: zr.t + h },
          { l: zr.l, t: zr.b + k, r: zr.l + w, b: zr.b + k + h },
          { l: zr.r - w, t: zr.b + k, r: zr.r, b: zr.b + k + h },
          { l: zr.l, t: zr.t - k - h, r: zr.l + w, b: zr.t - k },
          { l: zr.r - w, t: zr.t - k - h, r: zr.r, b: zr.t - k }
        );
      }
      const inside = (c: Rect) => c.l >= 0 && c.t >= 0 && c.r <= pw && c.b <= ph;
      let rect = cands.find(c => inside(c) && !obstacles.some(o => hit(c, o)) && !hit(c, zr));
      if (!rect) rect = cands.filter(inside).sort((a, b) => obstacles.reduce((s, o) => s + overlapArea(a, o), 0) - obstacles.reduce((s, o) => s + overlapArea(b, o), 0))[0] || cands[0];
      obstacles.push(rect);
      // leader line: from the nearest point of the zone to the nearest edge point of the label
      const cx = Math.min(Math.max((rect.l + rect.r) / 2, zr.l), zr.r);
      const cy = Math.min(Math.max((rect.t + rect.b) / 2, zr.t), zr.b);
      const tx = Math.min(Math.max(cx, rect.l), rect.r);
      const ty = Math.min(Math.max(cy, rect.t), rect.b);
      blindLabels.push({ zone: z, rect, from: { x: cx, y: cy }, to: { x: tx, y: ty } });
    });
  }

  // ======================================================== marker name chips (screen px)
  const chipSide: Record<string, 'below' | 'right' | 'left' | 'above'> = {};
  {
    const obstacles: Rect[] = [...placed, ...blindLabels.map(b => b.rect)];
    const circles = markers.map(m => { const c = toPx(m.x, m.y, markerZ(m)); return { l: c.x - 12, r: c.x + 12, t: c.y - 12, b: c.y + 12 }; });
    const base = obstacles.length;
    obstacles.push(...circles);
    markers.forEach((m, i) => {
      const c = toPx(m.x, m.y, markerZ(m));
      const w = m.label.length * 6.8 + 10, h = 18;
      const rects: Record<string, Rect> = {
        below: { l: c.x - w / 2, r: c.x + w / 2, t: c.y + 14, b: c.y + 14 + h },
        right: { l: c.x + 16, r: c.x + 16 + w, t: c.y - h / 2, b: c.y + h / 2 },
        left: { l: c.x - 16 - w, r: c.x - 16, t: c.y - h / 2, b: c.y + h / 2 },
        above: { l: c.x - w / 2, r: c.x + w / 2, t: c.y - 14 - h, b: c.y - 14 }
      };
      const pref = m.labelSide === 'right' ? ['right', 'below', 'left', 'above'] : ['below', 'right', 'left', 'above'];
      const free = pref.find(s => {
        const q = rects[s];
        if (q.l < 0 || q.r > pw || q.t < 0 || q.b > ph) return false;
        return !obstacles.some((o, k) => k !== base + i && hit(q, o));
      });
      const pick = (free || pref[0]) as 'below' | 'right' | 'left' | 'above';
      chipSide[m.id] = pick;
      obstacles.push(rects[pick]);
    });
  }

  // ======================================================== 2D drawing
  const X = (x: number) => x * (PLAN_W / 100);
  const Y = (y: number) => y * (PLAN_H / 100);

  const room2D = (r: Room) => {
    const fill = r.kind === 'courtyard' ? 'rgba(16,185,129,0.07)' : r.kind === 'corridor' ? 'rgba(255,255,255,0.05)' : r.kind === 'docks' ? 'rgba(6,182,212,0.07)' : 'rgba(255,255,255,0.025)';
    return <rect key={r.id} x={X(r.x)} y={Y(r.y)} width={X(r.w)} height={Y(r.h)} fill={fill} stroke="#64748b" strokeWidth={2.5} />;
  };

  // text block at pixel position (centre x, top y) as SVG text
  const textBlock = (key: string, lines: string[], cx: number, firstBaseline: number, halo: boolean) => (
    <text key={key} textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600}
      style={halo ? { paintOrder: 'stroke' } : undefined} stroke={halo ? COLORS.background : undefined} strokeWidth={halo ? fs * 0.22 : undefined} strokeLinejoin="round">
      {lines.map((l, i) => <tspan key={i} x={toU(cx)} y={toU(firstBaseline + i * lhPx)} fill={l === gapText ? COLORS.caution : undefined}>{l}</tspan>)}
    </text>
  );

  const drawing2D = (
    <>
      <defs>
        <pattern id="museum-gap-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="12" stroke={COLORS.caution} strokeWidth="4" strokeOpacity="0.5" />
        </pattern>
      </defs>
      <rect x={X(FENCE.x)} y={Y(FENCE.y)} width={X(FENCE.w)} height={Y(FENCE.h)} fill="none" stroke={COLORS.primary} strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="10 6" />
      <rect x={X(MAIN_GATE.x - 4)} y={Y(MAIN_GATE.y) - 4} width={X(8)} height="8" fill={COLORS.background} />
      <path d={`M${X(MAIN_GATE.x - 4)} ${Y(MAIN_GATE.y) - 8} v16 M${X(MAIN_GATE.x + 4)} ${Y(MAIN_GATE.y) - 8} v16`} stroke={COLORS.textSecondary} strokeWidth="3" />
      <rect x={X(BUILDING.x)} y={Y(BUILDING.y)} width={X(BUILDING.w)} height={Y(BUILDING.h)} fill="#10141c" stroke="#94a3b8" strokeWidth="5" />
      {ROOMS.map(room2D)}
      {[[42, 24], [54, 24], [42, 35], [54, 35]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={X(x)} cy={Y(y)} r="11" fill="rgba(16,185,129,0.16)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
      ))}
      {showGap && <rect x={X(gapRoom.x)} y={Y(gapRoom.y)} width={X(gapRoom.w)} height={Y(gapRoom.h)} fill="url(#museum-gap-hatch)" stroke={COLORS.caution} strokeWidth="2.5" strokeDasharray="8 5" />}
      {blindSpots.map(b => (
        <rect key={b.id} x={X(b.x)} y={Y(b.y)} width={X(b.w)} height={Y(b.h)} fill="rgba(239,68,68,0.1)" stroke={COLORS.dangerLight} strokeWidth="2.5" strokeDasharray="5 4" />
      ))}
      {DOORS.map((d, i) => d.o === 'v'
        ? <line key={i} x1={X(d.x)} x2={X(d.x)} y1={Y(d.y - d.len / 2)} y2={Y(d.y + d.len / 2)} stroke="#10141c" strokeWidth="6" />
        : <line key={i} y1={Y(d.y)} y2={Y(d.y)} x1={X(d.x - d.len / 2)} x2={X(d.x + d.len / 2)} stroke="#10141c" strokeWidth="6" />)}
      {DOCK_BAYS.map((b, i) => <rect key={i} x={X(b.x) - 16} y={Y(b.y) - 13} width="32" height="26" rx="4" fill="none" stroke={COLORS.primary} strokeOpacity="0.55" strokeWidth="1.8" strokeDasharray="3 3" />)}
      {ROOMS.flatMap(r => (r.sensors || []).map((s, i) => s.type === 'camera'
        ? <CameraIcon key={`${r.id}-${i}`} x={X(s.x)} y={Y(s.y)} k={0.8 / Math.max(scale, 0.4)} />
        : <MotionIcon key={`${r.id}-${i}`} x={X(s.x)} y={Y(s.y)} k={0.8 / Math.max(scale, 0.4)} />))}
      <text x={X(MAIN_GATE.x + 5)} y={PLAN_H - 2} fill={COLORS.textSecondary} fontSize={fs} fontWeight={600}>Main Gate</text>
      {route && (
        <polyline points={[...route.points, route.points[0]].map(p => `${X(p.x)},${Y(p.y)}`).join(' ')} fill="none" stroke={COLORS.primary} strokeWidth="3" strokeDasharray="10 6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      )}
      {route && route.points.map((p, i) => route.numbered ? (
        <g key={i} transform={`translate(${X(p.x)},${Y(p.y)})`}>
          <circle r={toU(9)} fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" />
          <text y={fs * 0.36} textAnchor="middle" fill="#fff" fontSize={fs} fontWeight={700}>{i + 1}</text>
        </g>
      ) : <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="5" fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" />)}
      {labels.map(l => l.vertical
        ? <text key={l.room.id} transform={`rotate(-90 ${toU(l.cx)} ${toU(l.top)})`} x={toU(l.cx)} y={toU(l.top) + fs * 0.35} textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600}>{l.lines[0]}</text>
        : textBlock(l.room.id, l.lines, l.cx, l.room.labelAt === 'bottom'
            ? ((l.room.y + l.room.h) / 100) * ph - 6 * scale - lhPx * (l.lines.length - 1)
            : (l.room.y / 100) * ph + 12.5 * 1.25, false))}
      {blindLabels.map(b => (
        <g key={b.zone.id}>
          <line x1={toU(b.from.x)} y1={toU(b.from.y)} x2={toU(b.to.x)} y2={toU(b.to.y)} stroke={COLORS.dangerLight} strokeWidth="1.5" />
          <text x={toU((b.rect.l + b.rect.r) / 2)} y={toU(b.rect.t + 12.5 * 0.82 + 1)} textAnchor="middle" fill={COLORS.dangerLight} fontSize={fs} fontWeight={600} style={{ paintOrder: 'stroke' }} stroke={COLORS.background} strokeWidth={fs * 0.22} strokeLinejoin="round">{b.zone.label}</text>
        </g>
      ))}
    </>
  );

  // ======================================================== 3D drawing
  const polyPts = (pts: { sx: number; sy: number }[]) => pts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');

  const box3D = (r: { x: number; y: number; w: number; h: number }, h: number, top: string, stroke = 'rgba(148,163,184,0.45)') => {
    const x0 = r.x, x1 = r.x + r.w, y0 = r.y, y1 = r.y + r.h;
    // side faces: outward normal in plan axes, and the two corners of the bottom edge
    const faces = [
      { n: [0, -1], a: [x0, y0], b: [x1, y0] },
      { n: [0, 1], a: [x0, y1], b: [x1, y1] },
      { n: [-1, 0], a: [x0, y0], b: [x0, y1] },
      { n: [1, 0], a: [x1, y0], b: [x1, y1] }
    ];
    return (
      <>
        {h > 0 && faces.map((f, i) => {
          const nu = f.n[0] * cs - f.n[1] * sn, nv = f.n[0] * sn + f.n[1] * cs;
          if (nu + nv <= 0.001) return null; // faces away from the viewer
          const t = (nu - nv + 1.42) / 2.84;
          const fill = mix([8, 11, 17], [24, 31, 44], t);
          return <polygon key={i} points={polyPts([proj(f.a[0], f.a[1], h), proj(f.b[0], f.b[1], h), proj(f.b[0], f.b[1], 0), proj(f.a[0], f.a[1], 0)])} fill={fill} stroke={stroke} strokeWidth="1" />;
        })}
        <polygon points={polyPts([proj(x0, y0, h), proj(x1, y0, h), proj(x1, y1, h), proj(x0, y1, h)])} fill={top} stroke={stroke} strokeWidth="1.2" />
      </>
    );
  };
  const roomDepth = (r: Room) => proj(r.x + r.w / 2, r.y + r.h / 2).depth;
  const sortedRooms = [...ROOMS].sort((a, b) => roomDepth(a) - roomDepth(b));
  const topFill: Record<Room['kind'], string> = { room: '#1c2433', corridor: '#161d2a', courtyard: '#12261f', docks: '#12303a' };

  const fencePts = [proj(FENCE.x, FENCE.y), proj(FENCE.x + FENCE.w, FENCE.y), proj(FENCE.x + FENCE.w, FENCE.y + FENCE.h), proj(FENCE.x, FENCE.y + FENCE.h)];
  const gz = BLOCK_H[gapRoom.kind] + 4;
  const gapTop = [proj(gapRoom.x, gapRoom.y, gz), proj(gapRoom.x + gapRoom.w, gapRoom.y, gz), proj(gapRoom.x + gapRoom.w, gapRoom.y + gapRoom.h, gz), proj(gapRoom.x, gapRoom.y + gapRoom.h, gz)];
  const gate = proj(MAIN_GATE.x, MAIN_GATE.y);

  const drawing3D = (
    <>
      <defs>
        <pattern id="museum-gap-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="12" stroke={COLORS.caution} strokeWidth="4" strokeOpacity="0.6" />
        </pattern>
      </defs>
      <polygon points={polyPts(fencePts)} fill="#0e1219" stroke={COLORS.primary} strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="10 6" />
      {box3D(BUILDING, 4, '#10141c', '#94a3b8')}
      {sortedRooms.map(r => <g key={r.id}>{box3D(r, BLOCK_H[r.kind] + 4, topFill[r.kind])}</g>)}
      {[[42, 24], [54, 24], [42, 35], [54, 35]].map(([x, y]) => {
        const p = proj(x, y, 4);
        return <g key={`${x}-${y}`}><line x1={p.sx} y1={p.sy} x2={p.sx} y2={p.sy - 14} stroke="rgba(16,185,129,0.6)" strokeWidth="3" /><circle cx={p.sx} cy={p.sy - 20} r="11" fill="rgba(16,185,129,0.25)" stroke="rgba(16,185,129,0.6)" strokeWidth="1.5" /></g>;
      })}
      {showGap && <polygon points={polyPts(gapTop)} fill="url(#museum-gap-hatch)" stroke={COLORS.caution} strokeWidth="2.5" strokeDasharray="8 5" />}
      {blindSpots.map(b => {
        const z = baseZ(b.x + b.w / 2, b.y + b.h / 2);
        return <polygon key={b.id} points={polyPts([proj(b.x, b.y, z), proj(b.x + b.w, b.y, z), proj(b.x + b.w, b.y + b.h, z), proj(b.x, b.y + b.h, z)])} fill="rgba(239,68,68,0.14)" stroke={COLORS.dangerLight} strokeWidth="2.5" strokeDasharray="5 4" />;
      })}
      {DOCK_BAYS.map((b, i) => {
        const z = BLOCK_H.docks + 4;
        return <polygon key={i} points={polyPts([proj(b.x - 3.4, b.y - 4.4, z), proj(b.x + 3.4, b.y - 4.4, z), proj(b.x + 3.4, b.y + 4.4, z), proj(b.x - 3.4, b.y + 4.4, z)])} fill="none" stroke={COLORS.primary} strokeOpacity="0.6" strokeWidth="1.8" strokeDasharray="3 3" />;
      })}
      <line x1={gate.sx - 14} y1={gate.sy + 7} x2={gate.sx - 14} y2={gate.sy - 12} stroke={COLORS.textSecondary} strokeWidth="3" />
      <line x1={gate.sx + 14} y1={gate.sy - 7} x2={gate.sx + 14} y2={gate.sy - 26} stroke={COLORS.textSecondary} strokeWidth="3" />
      <text x={gate.sx} y={gate.sy + 22 + fs} textAnchor="middle" fill={COLORS.textSecondary} fontSize={fs} fontWeight={600} style={{ paintOrder: 'stroke' }} stroke={COLORS.background} strokeWidth={fs * 0.22}>Main Gate</text>
      {route && (
        <polyline points={polyPts([...route.points, route.points[0]].map(p => proj(p.x, p.y, baseZ(p.x, p.y) + 4)))} fill="none" stroke={COLORS.primary} strokeWidth="3" strokeDasharray="10 6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      )}
      {route && route.points.map((p, i) => {
        const q = proj(p.x, p.y, baseZ(p.x, p.y) + 4);
        return route.numbered
          ? <g key={i} transform={`translate(${q.sx},${q.sy})`}><circle r={toU(9)} fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" /><text y={fs * 0.36} textAnchor="middle" fill="#fff" fontSize={fs} fontWeight={700}>{i + 1}</text></g>
          : <circle key={i} cx={q.sx} cy={q.sy} r="5" fill={COLORS.panel} stroke={COLORS.primary} strokeWidth="2" />;
      })}
      {/* stems: thin line from the roof up to the marker, and a shadow */}
      {markers.map(m => {
        const base = baseZ(m.x, m.y);
        const f = proj(m.x, m.y, base), t = proj(m.x, m.y, markerZ(m));
        return (
          <g key={m.id}>
            <ellipse cx={f.sx} cy={f.sy} rx="9" ry="4.5" fill="rgba(0,0,0,0.55)" />
            {t.sy < f.sy - 1 && <line x1={f.sx} y1={f.sy} x2={t.sx} y2={t.sy} stroke={m.kind === 'drone' ? COLORS.primary : COLORS.textSecondary} strokeOpacity="0.7" strokeWidth="1.5" />}
          </g>
        );
      })}
      {/* room names stand upright on their roofs, kept apart from each other and from the markers */}
      {labels.map(l => textBlock(l.room.id, l.lines, l.cx, l.top + 12.5 * 0.82, true))}
    </>
  );

  // ======================================================== markers (real buttons)
  const markerButton = (m: PlanMarker) => {
    const c = toPx(m.x, m.y, markerZ(m));
    const side = chipSide[m.id] || 'below';
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
        style={{ left: c.x, top: c.y, transform: shift }}
      >
        <span className="relative flex items-center justify-center">
          {m.pulse && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-danger-light/40 animate-pulse scale-150" />}
          <span aria-hidden="true" className={`relative size-6 rounded-full border-2 flex items-center justify-center text-xs font-black shadow-lg ${MARKER_STYLE[m.tone]} ${m.selected ? 'ring-2 ring-white ring-offset-1 ring-offset-background' : ''}`}>
            {m.kind === 'drone'
              ? <span className="material-symbols-outlined text-[16px]">{m.icon || 'flight'}</span>
              : m.badge}
          </span>
        </span>
        <span aria-hidden="true" className={`${side === 'right' || side === 'left' ? '' : side === 'above' ? 'mb-0.5' : 'mt-0.5'} px-1 py-0.5 rounded bg-background/90 border text-xs font-semibold leading-none whitespace-nowrap ${m.selected ? 'border-white text-white' : 'border-white/10 text-gray-200'}`}>{m.label}</span>
      </Button>
    );
  };

  // ---- drag to rotate (3D)
  const canRotate = is3D && rotatable;
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canRotate || (e.target as HTMLElement).closest('button')) return;
    dragX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragX.current === null) return;
    const dx = e.clientX - dragX.current;
    dragX.current = e.clientX;
    setAngle(a => a + dx * 0.4);
  };
  const endDrag = () => { dragX.current = null; };

  const rotateBtn = 'size-8 bg-background/90 border border-white/10 text-gray-300 hover:text-white rounded-lg';

  return (
    <div
      className={fitWidth ? 'relative w-full flex flex-col p-3 gap-1' : `absolute inset-0 flex flex-col ${is3D ? 'p-1.5' : 'p-4'} gap-1`}
      style={insets ? { paddingTop: insets.top, paddingBottom: insets.bottom } : undefined}
    >
      <div ref={areaRef} className={fitWidth ? 'relative w-full flex justify-center' : 'relative flex-1 min-h-0 flex items-center justify-center'}>
        <div
          className={`relative select-none ${drawingClassName}`}
          style={{ width: pw, height: ph, cursor: canRotate ? 'grab' : undefined, touchAction: canRotate ? 'none' : undefined }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
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
        {canRotate && (
          <div className="absolute bottom-0 right-1 z-30 flex gap-1">
            <Button variant="icon" aria-label="Rotate view left" onClick={() => setAngle(a => a - 15)} className={rotateBtn}><span aria-hidden="true" className="material-symbols-outlined text-[18px]">rotate_left</span></Button>
            <Button variant="icon" aria-label="Reset view" onClick={() => setAngle(0)} className={rotateBtn}><span aria-hidden="true" className="material-symbols-outlined text-[18px]">restart_alt</span></Button>
            <Button variant="icon" aria-label="Rotate view right" onClick={() => setAngle(a => a + 15)} className={rotateBtn}><span aria-hidden="true" className="material-symbols-outlined text-[18px]">rotate_right</span></Button>
          </div>
        )}
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
