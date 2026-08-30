/**
 * motionVariants.js
 *
 * Centralized, consistent animation variants and easing curves for motion/react.
 * Follows "Google Stitch Luxury AI" guidelines:
 * - 3D depth, specular highlights, purposeful spring physics
 * - Snappy micro-interactions and refined cubic-bezier curves
 * - Smooth stagger sequences and orbital ambient floating
 */

export const transitions = {
  springFast: { type: 'spring', stiffness: 450, damping: 28 },
  springSmooth: { type: 'spring', stiffness: 320, damping: 26 },
  springSnappy: { type: 'spring', stiffness: 480, damping: 28 },
  springBouncy: { type: 'spring', stiffness: 380, damping: 18 },
  easeSmooth: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  easeFast: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  easeLuxury: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
};

export const pageVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
};

export const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const containerStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const itemFadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export const cardHover3D = {
  rest: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    z: 0,
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },
  hover: {
    scale: 1.018,
    y: -4,
    boxShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.7), 0 0 30px -5px rgba(99, 102, 241, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.16)',
    transition: { type: 'spring', stiffness: 350, damping: 22 },
  },
};

export const cardHover = cardHover3D;

export const buttonHoverTap = {
  hover: {
    scale: 1.025,
    y: -1.5,
    boxShadow: '0 12px 28px -6px rgba(59, 130, 246, 0.35)',
    transition: { type: 'spring', stiffness: 450, damping: 22 },
  },
  tap: {
    scale: 0.97,
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
};

export const floatAmbient = {
  animate: {
    y: [-6, 6, -6],
    rotate: [-0.5, 0.5, -0.5],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
