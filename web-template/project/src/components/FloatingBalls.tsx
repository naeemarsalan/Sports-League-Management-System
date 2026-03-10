'use client';

import { motion } from 'framer-motion';

const BALLS = [
  { color: '#d42b2b', x: '8%', y: '15%', size: 18, duration: 7, delay: 0 },
  { color: '#f5c518', x: '85%', y: '25%', size: 14, duration: 9, delay: 1.5 },
  { color: '#1a3fbf', x: '12%', y: '70%', size: 16, duration: 8, delay: 0.8 },
  { color: '#5b2d8e', x: '90%', y: '60%', size: 12, duration: 10, delay: 2 },
  { color: '#1a7a3a', x: '45%', y: '90%', size: 10, duration: 7.5, delay: 0.5 },
  { color: '#e87425', x: '70%', y: '10%', size: 15, duration: 8.5, delay: 1 },
  { color: '#8b1a1a', x: '25%', y: '85%', size: 11, duration: 9.5, delay: 1.8 },
  { color: '#111111', x: '60%', y: '50%', size: 20, duration: 11, delay: 0.3 },
];

export default function FloatingBalls() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {BALLS.map((ball, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: ball.x,
            top: ball.y,
            width: ball.size,
            height: ball.size,
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3), ${ball.color}, rgba(0,0,0,0.4))`,
            boxShadow: `0 0 ${ball.size}px ${ball.color}33`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.4, 0.2, 0.4, 0],
            y: [0, -20, 10, -15, 0],
            x: [0, 10, -8, 12, 0],
          }}
          transition={{
            duration: ball.duration,
            delay: ball.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
