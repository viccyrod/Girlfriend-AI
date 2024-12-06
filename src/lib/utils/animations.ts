import { Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const slideIn = (direction: 'up' | 'down' | 'left' | 'right', duration: number = 0.2): Variants => {
  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return {
    hidden: { 
      opacity: 0,
      ...directionOffset[direction]
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      ...directionOffset[direction],
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 1, 1]
      }
    }
  };
};

export const scaleIn: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1]
    }
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: {
      duration: 0.1,
      ease: [0.4, 0, 1, 1]
    }
  }
};

export const springTransition = {
  type: "spring",
  stiffness: 700,
  damping: 30
};
