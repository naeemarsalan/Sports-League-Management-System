'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring, motion } from 'framer-motion';

interface StatsCounterProps {
  value: number;
  label: string;
  icon: React.ReactNode;
}

export default function StatsCounter({ value, label, icon }: StatsCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2000, bounce: 0 });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = Math.round(latest).toLocaleString();
      }
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <motion.div
      ref={ref}
      className="bg-[#141922] border border-[#34d9c3]/10 rounded-2xl p-6 text-center"
      whileHover={{ scale: 1.03, borderColor: 'rgba(52, 217, 195, 0.3)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="flex justify-center mb-3 text-[#34d9c3]">{icon}</div>
      <span
        ref={displayRef}
        className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent block mb-2"
      >
        0
      </span>
      <span className="text-gray-400 text-sm">{label}</span>
    </motion.div>
  );
}
