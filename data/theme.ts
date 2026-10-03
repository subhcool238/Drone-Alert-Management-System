// Hex mirror of the colour tokens in the Tailwind config (index.html), for the few places
// that cannot use classes: SVG attributes and chart props. Keep both in step.
export const COLORS = {
  primary: '#06b6d4',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#10b981',
  caution: '#fbbf24',
  background: '#0b0e14',
  panel: '#151a23',
  border: '#334155',
  textPrimary: '#ffffff',
  textSecondary: '#cbd5e1',
  textMuted: '#9ca3af'
} as const;
