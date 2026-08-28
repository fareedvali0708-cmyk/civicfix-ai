/**
 * motionVariants.js
 *
 * Centralized, consistent animation variants and easing curves for motion/react.
 * Follows "premium civic-tech SaaS" guidelines:
 * - Subtle, purposeful, non-distracting
 * - Snappy springs and refined cubic-bezier curves
 * - Unified timing
 */

export const transitions = {
  springFast: { type: 'spring', stiffness: 450, damping: 30 },
  springSmooth: { type: 'spring', stiffness: 350, damping: 28 },
  easeSmooth: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  easeFast: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

export const pageVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
};

export const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export const containerStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const itemFadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -3,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

export const buttonHoverTap = {
  hover: {
    scale: 1.018,
    y: -1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
};
