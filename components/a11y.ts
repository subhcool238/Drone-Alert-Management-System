import type React from 'react';

// Enter or Space activates the element, like a native button. Ignores keys pressed on a
// focusable child (an input or button inside the card).
export const activateOnKey = (handler: () => void) => (e: React.KeyboardEvent) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handler();
  }
};

// Props that make a clickable non-button element reachable and operable from the keyboard.
export const clickableProps = (handler: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onClick: handler,
  onKeyDown: activateOnKey(handler)
});
