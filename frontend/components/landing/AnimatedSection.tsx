'use client';

import { motion, type TargetAndTransition } from 'framer-motion';
import { type ReactNode } from 'react';

type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface AnimatedSectionProps {
  children: ReactNode;
  direction?: AnimationDirection;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  scale?: boolean;
}

const getInitial = (direction: AnimationDirection, scale: boolean): TargetAndTransition => {
  const base: Record<string, number> = { opacity: 0 };
  if (scale) base.scale = 0.95;

  switch (direction) {
    case 'up':
      return { ...base, y: 40 };
    case 'down':
      return { ...base, y: -40 };
    case 'left':
      return { ...base, x: 40 };
    case 'right':
      return { ...base, x: -40 };
    case 'none':
      return base;
  }
};

const getAnimate = (scale: boolean): TargetAndTransition => ({
  opacity: 1,
  y: 0,
  x: 0,
  ...(scale ? { scale: 1 } : {}),
});

export function AnimatedSection({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className,
  once = true,
  amount = 0.2,
  scale = false,
}: AnimatedSectionProps) {
  return (
    <motion.div
      initial={getInitial(direction, scale)}
      whileInView={getAnimate(scale)}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  direction = 'up',
}: {
  children: ReactNode;
  className?: string;
  direction?: AnimationDirection;
}) {
  const yOffset = direction === 'up' ? 30 : direction === 'down' ? -30 : 0;
  const xOffset = direction === 'left' ? 30 : direction === 'right' ? -30 : 0;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: yOffset, x: xOffset },
        visible: {
          opacity: 1,
          y: 0,
          x: 0,
          transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxSection({
  children,
  className,
  speed = 0.3,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: -20 * speed }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
