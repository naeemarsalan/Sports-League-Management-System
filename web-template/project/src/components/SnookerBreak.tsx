import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ──────────────────────────────────────────────────────
const W = 420;
const H = 360;
const BALL_R = 11;
const CUE_R = 12;
const FRICTION = 0.984;
const MIN_V = 0.15;
const MAX_POWER = 18;
const CUE_STICK_LEN = 180;
const CUE_STICK_WIDTH = 6;
const WALL_BOUNCE = 0.75;
const POCKET_R = 18;

// Pockets (6-pocket table)
const POCKETS = [
  { x: POCKET_R, y: POCKET_R },
  { x: W / 2, y: POCKET_R - 4 },
  { x: W - POCKET_R, y: POCKET_R },
  { x: POCKET_R, y: H - POCKET_R },
  { x: W / 2, y: H - POCKET_R + 4 },
  { x: W - POCKET_R, y: H - POCKET_R },
];

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  stripe: boolean;
  sunk: boolean;
  id: string;
}

const BALL_DEFS = [
  { id: 'cue', color: '#f0efe8', stripe: false },
  { id: '1', color: '#f5c518', stripe: false },
  { id: '2', color: '#1a3fbf', stripe: false },
  { id: '3', color: '#d42b2b', stripe: false },
  { id: '4', color: '#5b2d8e', stripe: false },
  { id: '5', color: '#e87425', stripe: false },
  { id: '6', color: '#1a7a3a', stripe: false },
  { id: '7', color: '#8b1a1a', stripe: false },
  { id: '8', color: '#1a1a1a', stripe: false },
  { id: '9', color: '#f5c518', stripe: true },
  { id: '10', color: '#1a3fbf', stripe: true },
];

// Rack center
const RX = W * 0.58;
const RY = H * 0.5;

// Triangle rack positions (apex faces left toward cue ball)
const RACK = [
  { x: 0, y: 0 },
  { x: 22, y: -13 },
  { x: 22, y: 13 },
  { x: 44, y: -26 },
  { x: 44, y: 0 },
  { x: 44, y: 26 },
  { x: 66, y: -39 },
  { x: 66, y: -13 },
  { x: 66, y: 13 },
  { x: 66, y: 39 },
];

function getInitialBalls(): Ball[] {
  const cue: Ball = {
    id: 'cue', x: W * 0.22, y: H * 0.5,
    vx: 0, vy: 0, color: '#f0efe8', stripe: false, sunk: false,
  };
  const racked = RACK.map((pos, i) => ({
    ...BALL_DEFS[i + 1],
    x: RX + pos.x,
    y: RY + pos.y,
    vx: 0, vy: 0, sunk: false,
  }));
  return [cue, ...racked];
}

// Break: cue ball shoots right into the rack
function getPostBreakBalls(): Ball[] {
  const balls = getInitialBalls();
  // Give each racked ball a scatter velocity as if broken
  const scatterVels = [
    { vx: 1.5, vy: 6 },
    { vx: -5.5, vy: -3 },
    { vx: 5, vy: -2.5 },
    { vx: -7, vy: -5 },
    { vx: 0.5, vy: -6.5 },
    { vx: 7, vy: -4 },
    { vx: -7.5, vy: -2 },
    { vx: -3, vy: -6 },
    { vx: 4, vy: -5.5 },
    { vx: 8, vy: 0.5 },
  ];
  // Cue ball: recoils left
  balls[0].vx = -2;
  balls[0].vy = 0.3;
  for (let i = 1; i < balls.length; i++) {
    balls[i].vx = scatterVels[i - 1].vx;
    balls[i].vy = scatterVels[i - 1].vy;
  }
  return balls;
}

// ─── Drawing helpers ────────────────────────────────────────────────

function drawTable(ctx: CanvasRenderingContext2D) {
  // Felt
  ctx.fillStyle = '#0d3320';
  ctx.fillRect(0, 0, W, H);

  // Inner felt (slightly lighter)
  const pad = 12;
  ctx.fillStyle = '#0f4028';
  ctx.beginPath();
  ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 4);
  ctx.fill();

  // Cushion rails
  ctx.strokeStyle = '#1a5c3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 4);
  ctx.stroke();

  // Outer wood rail
  ctx.strokeStyle = '#5c3a1a';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(1, 1, W - 2, H - 2, 10);
  ctx.stroke();
  ctx.strokeStyle = '#7a4e28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, W - 2, H - 2, 10);
  ctx.stroke();

  // Pockets
  for (const p of POCKETS) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
    ctx.fillStyle = '#050505';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Baulk line
  const baulkX = W * 0.3;
  ctx.beginPath();
  ctx.moveTo(baulkX, pad + 4);
  ctx.lineTo(baulkX, H - pad - 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // D semicircle
  ctx.beginPath();
  ctx.arc(baulkX, H / 2, 40, Math.PI * 0.5, Math.PI * 1.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();

  // Spot
  ctx.beginPath();
  ctx.arc(RX, RY, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, r: number, highlight = false) {
  if (ball.sunk) return;
  const { x, y, color, stripe } = ball;

  ctx.save();
  // Shadow
  ctx.beginPath();
  ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  if (stripe) {
    // White base
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Color stripe band
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(x - r, y - r * 0.45, r * 2, r * 0.9);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Shine
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Number circle (for non-cue balls)
  if (ball.id !== 'cue') {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = `bold ${r * 0.45}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ball.id, x, y + 0.5);
  }

  // Highlight ring when clickable
  if (highlight) {
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(52,217,195,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Pulse glow
    ctx.beginPath();
    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(52,217,195,0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCueStick(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number, pullback: number,
) {
  const gap = CUE_R + 6 + pullback;
  const startX = cx - Math.cos(angle) * gap;
  const startY = cy - Math.sin(angle) * gap;
  const endX = cx - Math.cos(angle) * (gap + CUE_STICK_LEN);
  const endY = cy - Math.sin(angle) * (gap + CUE_STICK_LEN);

  ctx.save();
  ctx.lineCap = 'round';

  // Stick shadow
  ctx.beginPath();
  ctx.moveTo(startX + 2, startY + 2);
  ctx.lineTo(endX + 2, endY + 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = CUE_STICK_WIDTH + 2;
  ctx.stroke();

  // Main stick body (tapered: thinner at tip)
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  const stickGrad = ctx.createLinearGradient(startX, startY, endX, endY);
  stickGrad.addColorStop(0, '#c49a6c');
  stickGrad.addColorStop(0.15, '#e8c992');
  stickGrad.addColorStop(0.2, '#c49a6c');
  stickGrad.addColorStop(1, '#5c3a1a');
  ctx.strokeStyle = stickGrad;
  ctx.lineWidth = CUE_STICK_WIDTH;
  ctx.stroke();

  // Ferrule (white tip)
  const ferruleLen = 8;
  const fEndX = cx - Math.cos(angle) * (gap + ferruleLen);
  const fEndY = cy - Math.sin(angle) * (gap + ferruleLen);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(fEndX, fEndY);
  ctx.strokeStyle = '#e8e0d0';
  ctx.lineWidth = CUE_STICK_WIDTH - 1;
  ctx.stroke();

  // Tip
  ctx.beginPath();
  ctx.arc(startX, startY, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#4a90c4';
  ctx.fill();

  ctx.restore();
}

function drawAimLine(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number,
) {
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  const len = 300;
  ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawPowerBar(ctx: CanvasRenderingContext2D, power: number) {
  const barW = 120;
  const barH = 8;
  const x = W / 2 - barW / 2;
  const y = H - 24;
  const filled = power / MAX_POWER;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, barW + 2, barH + 2, 4);
  ctx.fill();

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(x, y, barW, barH, 3);
  ctx.fill();

  // Fill with color gradient based on power
  const grad = ctx.createLinearGradient(x, y, x + barW, y);
  grad.addColorStop(0, '#34d9c3');
  grad.addColorStop(0.6, '#f5c518');
  grad.addColorStop(1, '#d42b2b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, barW * filled, barH, 3);
  ctx.fill();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('POWER', W / 2, y - 4);
  ctx.restore();
}

// ─── Physics ────────────────────────────────────────────────────────

function stepPhysics(balls: Ball[]) {
  const pad = 16;

  for (const b of balls) {
    if (b.sunk) continue;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= FRICTION;
    b.vy *= FRICTION;
    if (Math.abs(b.vx) < MIN_V) b.vx = 0;
    if (Math.abs(b.vy) < MIN_V) b.vy = 0;

    const r = b.id === 'cue' ? CUE_R : BALL_R;

    // Wall collisions
    if (b.x - r < pad) { b.x = pad + r; b.vx = Math.abs(b.vx) * WALL_BOUNCE; }
    if (b.x + r > W - pad) { b.x = W - pad - r; b.vx = -Math.abs(b.vx) * WALL_BOUNCE; }
    if (b.y - r < pad) { b.y = pad + r; b.vy = Math.abs(b.vy) * WALL_BOUNCE; }
    if (b.y + r > H - pad) { b.y = H - pad - r; b.vy = -Math.abs(b.vy) * WALL_BOUNCE; }

    // Pocket check
    for (const p of POCKETS) {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (dx * dx + dy * dy < (POCKET_R - 2) * (POCKET_R - 2)) {
        b.sunk = true;
        b.vx = 0;
        b.vy = 0;
        // If cue ball sunk, respawn it
        if (b.id === 'cue') {
          b.sunk = false;
          b.x = W * 0.22;
          b.y = H * 0.5;
        }
        break;
      }
    }
  }

  // Ball-ball collisions
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].sunk) continue;
    for (let j = i + 1; j < balls.length; j++) {
      if (balls[j].sunk) continue;
      const a = balls[i];
      const b = balls[j];
      const rA = a.id === 'cue' ? CUE_R : BALL_R;
      const rB = b.id === 'cue' ? CUE_R : BALL_R;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = rA + rB;
      if (dist < minDist && dist > 0) {
        // Separate overlapping
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
        // Elastic collision (equal mass)
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dot = dvx * nx + dvy * ny;
        if (dot > 0) {
          a.vx -= dot * nx;
          a.vy -= dot * ny;
          b.vx += dot * nx;
          b.vy += dot * ny;
        }
      }
    }
  }
}

function isMoving(balls: Ball[]): boolean {
  return balls.some((b) => !b.sunk && (Math.abs(b.vx) > MIN_V || Math.abs(b.vy) > MIN_V));
}

// ─── Break Animation (Framer Motion) ───────────────────────────────

const FM_RACK_POSITIONS = [
  { x: 0, y: 0 },
  { x: 22, y: -13 },
  { x: 22, y: 13 },
  { x: 44, y: -26 },
  { x: 44, y: 0 },
  { x: 44, y: 26 },
  { x: 66, y: -39 },
  { x: 66, y: -13 },
  { x: 66, y: 13 },
  { x: 66, y: 39 },
];

const FM_SCATTER = [
  { x: 5, y: 70, rotate: 720 },
  { x: -55, y: -30, rotate: -540 },
  { x: 60, y: -25, rotate: 480 },
  { x: -80, y: -55, rotate: -360 },
  { x: 0, y: -75, rotate: 600 },
  { x: 75, y: -50, rotate: -480 },
  { x: -90, y: -20, rotate: 540 },
  { x: -30, y: -70, rotate: -720 },
  { x: 40, y: -65, rotate: 400 },
  { x: 95, y: -5, rotate: -500 },
];

const FM_BALL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const FM_BALL_COLORS: Record<string, { fill: string; stripe?: boolean }> = {
  '1': { fill: '#f5c518' },
  '2': { fill: '#1a3fbf' },
  '3': { fill: '#d42b2b' },
  '4': { fill: '#5b2d8e' },
  '5': { fill: '#e87425' },
  '6': { fill: '#1a7a3a' },
  '7': { fill: '#8b1a1a' },
  '8': { fill: '#111111' },
  '9': { fill: '#f5c518', stripe: true },
  '10': { fill: '#1a3fbf', stripe: true },
};

const IMPACT_TIME = 1.0;
const CUE_TRAVEL_TIME = 0.7;
const CUE_TRAVEL_START = IMPACT_TIME - CUE_TRAVEL_TIME;
// Rack center in the framer-motion container
const FM_RX = '58%';
const FM_RY = '50%';

function FMBall({ color, stripe, size = 22 }: { color: string; stripe?: boolean; size?: number }) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={`fms-${color.replace('#', '')}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 1} fill={color} />
      {stripe && (
        <>
          <circle cx={r} cy={r} r={r - 1} fill="white" />
          <clipPath id={`fmc-${color.replace('#', '')}`}>
            <circle cx={r} cy={r} r={r - 1} />
          </clipPath>
          <rect x={0} y={r - 5} width={size} height={10} fill={color} style={{ clipPath: `url(#fmc-${color.replace('#', '')})` }} />
        </>
      )}
      <circle cx={r} cy={r} r={r - 1} fill={`url(#fms-${color.replace('#', '')})`} />
    </svg>
  );
}

function BreakAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a7a3a]/20 to-transparent rounded-full blur-3xl" />

      {/* Cue ball travels from left to apex */}
      <motion.div
        className="absolute"
        style={{ left: '22%', top: FM_RY, marginTop: -12 }}
        initial={{ x: -120, opacity: 0 }}
        animate={{ x: [null, 80, 60], opacity: 1 }}
        transition={{
          x: {
            times: [0, 0.7, 1],
            duration: CUE_TRAVEL_TIME + 0.3,
            delay: CUE_TRAVEL_START,
            ease: ['easeIn', 'easeOut'],
          },
          opacity: { duration: 0.15, delay: CUE_TRAVEL_START },
        }}
      >
        <FMBall color="#f0efe8" size={24} />
      </motion.div>

      {/* Racked balls */}
      {FM_RACK_POSITIONS.map((pos, i) => {
        const key = FM_BALL_KEYS[i];
        const bc = FM_BALL_COLORS[key];
        const scatter = FM_SCATTER[i];
        return (
          <motion.div
            key={key}
            className="absolute"
            style={{
              left: `calc(${FM_RX} + ${pos.x}px)`,
              top: `calc(${FM_RY} + ${pos.y}px)`,
              marginLeft: -11, marginTop: -11,
            }}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            animate={{ x: scatter.x, y: scatter.y, rotate: scatter.rotate }}
            transition={{
              x: { duration: 0.7, delay: IMPACT_TIME, ease: [0.2, 0.8, 0.3, 1] },
              y: { duration: 0.7, delay: IMPACT_TIME, ease: [0.2, 0.8, 0.3, 1] },
              rotate: { duration: 1.0, delay: IMPACT_TIME, ease: 'easeOut' },
            }}
          >
            <FMBall color={bc.fill} stripe={bc.stripe} size={22} />
          </motion.div>
        );
      })}

      {/* Impact flash */}
      <motion.div
        className="absolute rounded-full bg-white"
        style={{
          left: `calc(${FM_RX} - 5px)`,
          top: `calc(${FM_RY} - 5px)`,
          width: 10, height: 10,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 5, 0], opacity: [0, 0.7, 0] }}
        transition={{ duration: 0.35, delay: IMPACT_TIME }}
      />
    </div>
  );
}

// ─── Interactive Canvas Phase ───────────────────────────────────────

function InteractiveTable() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const phaseRef = useRef<'settling' | 'idle' | 'aiming' | 'shooting'>('settling');
  const angleRef = useRef(0);
  const powerRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameRef = useRef(0);
  const pulseRef = useRef(0);
  const hintOpacity = useRef(1);

  const getCanvasCoords = useCallback((e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (W / rect.width),
      y: (e.clientY - rect.top) * (H / rect.height),
    };
  }, []);

  const getCueBall = useCallback(() => {
    return ballsRef.current.find((b) => b.id === 'cue' && !b.sunk);
  }, []);

  useEffect(() => {
    ballsRef.current = getPostBreakBalls();
    phaseRef.current = 'settling';

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function render() {
      if (!ctx) return;
      const balls = ballsRef.current;
      const phase = phaseRef.current;
      pulseRef.current += 0.05;

      // Physics step
      if (phase === 'settling' || phase === 'shooting') {
        stepPhysics(balls);
        if (!isMoving(balls)) {
          phaseRef.current = 'idle';
          hintOpacity.current = 1;
        }
      }

      // Draw
      ctx.clearRect(0, 0, W, H);
      drawTable(ctx);

      // Draw aim line & power bar when aiming
      const cue = getCueBall();
      if (phase === 'aiming' && cue) {
        drawAimLine(ctx, cue.x, cue.y, angleRef.current);
      }

      // Draw balls
      for (const b of balls) {
        if (b.id === 'cue') continue; // draw cue ball last
        drawBall(ctx, b, BALL_R);
      }
      // Draw cue ball with highlight when idle
      if (cue) {
        const showHighlight = phase === 'idle' && !cue.sunk;
        drawBall(ctx, cue, CUE_R, showHighlight);
      }

      // Draw cue stick when aiming
      if (phase === 'aiming' && cue) {
        drawCueStick(ctx, cue.x, cue.y, angleRef.current, powerRef.current * 3);
        if (powerRef.current > 0) {
          drawPowerBar(ctx, powerRef.current);
        }
      }

      // Hint text when idle
      if (phase === 'idle' && cue) {
        hintOpacity.current = Math.max(hintOpacity.current - 0.003, 0);
        if (hintOpacity.current > 0) {
          ctx.save();
          ctx.fillStyle = `rgba(52,217,195,${hintOpacity.current * 0.7})`;
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Click the cue ball to shoot', W / 2, H - 14);
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [getCueBall]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const phase = phaseRef.current;
    const { x, y } = getCanvasCoords(e);
    const cue = getCueBall();
    if (!cue) return;

    if (phase === 'idle') {
      // Check if clicking on cue ball
      const dx = x - cue.x;
      const dy = y - cue.y;
      if (dx * dx + dy * dy <= (CUE_R + 8) * (CUE_R + 8)) {
        phaseRef.current = 'aiming';
        angleRef.current = Math.atan2(y - cue.y, x - cue.x);
        powerRef.current = 0;
        dragStartRef.current = null;
      }
    } else if (phase === 'aiming') {
      // Start power drag
      dragStartRef.current = { x, y };
    }
  }, [getCanvasCoords, getCueBall]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const phase = phaseRef.current;
    const { x, y } = getCanvasCoords(e);
    const cue = getCueBall();
    if (!cue) return;

    if (phase === 'aiming') {
      if (dragStartRef.current) {
        // Dragging back for power — measure distance pulled away from aim direction
        const dx = x - dragStartRef.current.x;
        const dy = y - dragStartRef.current.y;
        // Power = how far pulled back (opposite to aim direction)
        const pullback = -(dx * Math.cos(angleRef.current) + dy * Math.sin(angleRef.current));
        powerRef.current = Math.max(0, Math.min(MAX_POWER, pullback / 6));
      } else {
        // Just aiming — update angle
        angleRef.current = Math.atan2(y - cue.y, x - cue.x);
      }
    }
  }, [getCanvasCoords, getCueBall]);

  const handleMouseUp = useCallback(() => {
    const phase = phaseRef.current;
    const cue = getCueBall();
    if (!cue) return;

    if (phase === 'aiming' && dragStartRef.current && powerRef.current > 0.5) {
      // Shoot!
      const power = powerRef.current;
      cue.vx = Math.cos(angleRef.current) * power;
      cue.vy = Math.sin(angleRef.current) * power;
      phaseRef.current = 'shooting';
      powerRef.current = 0;
      dragStartRef.current = null;
    } else if (phase === 'aiming' && !dragStartRef.current) {
      // Haven't dragged yet — do nothing, wait for drag
    } else if (phase === 'aiming') {
      // Released without power — cancel
      dragStartRef.current = null;
    }
  }, [getCueBall]);

  const handleMouseLeave = useCallback(() => {
    if (phaseRef.current === 'aiming') {
      dragStartRef.current = null;
      powerRef.current = 0;
    }
  }, []);

  // Cancel aiming on right click / escape
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (phaseRef.current === 'aiming') {
      phaseRef.current = 'idle';
      powerRef.current = 0;
      dragStartRef.current = null;
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="w-full h-full rounded-lg cursor-crosshair"
      style={{ imageRendering: 'auto' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    />
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function SnookerBreak() {
  const [phase, setPhase] = useState<'break' | 'interactive'>('break');

  const handleBreakComplete = useCallback(() => {
    setPhase('interactive');
  }, []);

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: W, height: H }}
      aria-hidden="true"
    >
      <AnimatePresence mode="wait">
        {phase === 'break' ? (
          <motion.div
            key="break"
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BreakAnimation onComplete={handleBreakComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="interactive"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <InteractiveTable />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
