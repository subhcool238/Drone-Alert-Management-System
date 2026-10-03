import React, { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** id of the element that holds the dialog title */
  labelledBy: string;
  /** Called on Escape. Leave it out for a dialog that must not be dismissed with Escape. */
  onEscape?: () => void;
}

/**
 * The full-screen overlay of a modal dialog. It renders the same single div the modals used
 * before (same classes), and adds the dialog semantics and keyboard handling:
 * role="dialog" + aria-modal, focus moves in on open (to [data-autofocus] or the first
 * control), Tab is trapped inside, Escape closes when onEscape is given, and focus returns
 * to the control that opened it when the dialog closes.
 */
const ModalOverlay: React.FC<ModalOverlayProps> = ({ labelledBy, onEscape, onKeyDown, className = '', children, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = ref.current;
    if (root) {
      const target = root.querySelector<HTMLElement>('[data-autofocus]') || root.querySelector<HTMLElement>(FOCUSABLE) || root;
      target.focus();
    }
    return () => {
      if (opener && opener !== document.body && document.contains(opener)) opener.focus();
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Escape' && onEscape) {
      e.stopPropagation();
      onEscape();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={`${className} focus:outline-none`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default ModalOverlay;
