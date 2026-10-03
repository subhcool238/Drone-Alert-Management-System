import React from 'react';

/**
 * Shared button. Every variant gets the same radius (rounded-lg, except the toggle switch),
 * a minimum height of 32px (24px for icon buttons and toggles), a visible focus ring
 * (2px cyan with offset) and a real disabled style.
 *
 * Variants carry colour only where the colour is the same everywhere it is used:
 *   primary         cyan fill, black text
 *   danger          solid red, white text
 *   danger-outline  red outline and text (add your own background)
 *   success         green fill, black text
 *   indigo          indigo fill, white text
 *   secondary       thin white border and hover tint (add your own text colour and background)
 *   text            text-only button (add your own text colour)
 *   icon            icon-only button, at least 24x24. Needs an aria-label.
 *   segment         one option of a segmented control (add your own colours)
 *   toggle          on/off switch (set role="switch" and aria-checked)
 *   bare            anything else (tabs, tiles); only the focus ring and disabled style
 *
 * Size, padding, typography and shadows stay on the caller through className.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'danger-outline'
  | 'success'
  | 'indigo'
  | 'text'
  | 'icon'
  | 'segment'
  | 'toggle'
  | 'bare';

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const DISABLED = 'disabled:opacity-70 disabled:cursor-not-allowed';
const STRUCT = 'inline-flex items-center justify-center rounded-lg transition-all min-h-[32px]';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `${STRUCT} bg-primary text-black hover:bg-primary/90`,
  secondary: `${STRUCT} border border-white/10 hover:bg-white/5`,
  danger: `${STRUCT} bg-danger-strong text-white hover:brightness-110`,
  'danger-outline': `${STRUCT} border border-danger/30 text-danger-light hover:bg-danger/10`,
  success: `${STRUCT} bg-success text-black hover:brightness-110`,
  indigo: `${STRUCT} bg-indigo-600 text-white hover:brightness-110`,
  text: STRUCT,
  icon: 'inline-flex items-center justify-center rounded-lg transition-all min-h-[24px] min-w-[24px]',
  segment: STRUCT,
  toggle: 'relative inline-flex items-center rounded-full transition-colors min-h-[24px]',
  bare: 'transition-all'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'bare', className = '', type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`${VARIANTS[variant]} ${FOCUS} ${DISABLED} ${className}`.trim()}
      {...rest}
    />
  )
);
Button.displayName = 'Button';

export default Button;
