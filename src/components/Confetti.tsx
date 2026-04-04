'use client';

import { useEffect, useRef } from 'react';

import styles from './Confetti.module.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  alpha: number;
}

const COLORS = ['#6C63FF', '#00D4AA', '#FF6B6B', '#FF8C00', '#4488FF', '#FFD93D'];
const PARTICLE_COUNT = 180;
const SPAWN_WINDOW_MS = 3000;
const MAX_DURATION_MS = 5200;

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createParticle(width: number): Particle {
  return {
    x: randomBetween(width * 0.15, width * 0.85),
    y: randomBetween(-80, -20),
    vx: randomBetween(-2.4, 2.4),
    vy: randomBetween(1.5, 4.4),
    size: randomBetween(6, 12),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: randomBetween(0, Math.PI * 2),
    spin: randomBetween(-0.14, 0.14),
    alpha: randomBetween(0.75, 1),
  };
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    let width = 0;
    let height = 0;
    let animationFrameId = 0;

    const particles: Particle[] = [];

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;

      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const resetParticle = (particle: Particle) => {
      Object.assign(particle, createParticle(width));
    };

    resizeCanvas();

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      particles.push(createParticle(width));
    }

    const startTime = performance.now();

    const renderFrame = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const spawnActive = elapsed < SPAWN_WINDOW_MS;

      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.035;
        particle.rotation += particle.spin;

        if (!spawnActive) {
          particle.alpha = Math.max(0, particle.alpha - 0.007);
        }

        if (particle.y > height + 40 || particle.x < -40 || particle.x > width + 40) {
          if (spawnActive) {
            resetParticle(particle);
          } else {
            particle.alpha = 0;
          }
        }

        if (particle.alpha <= 0) {
          continue;
        }

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.66);
        context.restore();
      }

      const activeParticleCount = particles.filter((particle) => particle.alpha > 0.01).length;

      if (elapsed < MAX_DURATION_MS && activeParticleCount > 0) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    animationFrameId = window.requestAnimationFrame(renderFrame);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(resizeCanvas)
        : null;

    resizeObserver?.observe(canvas);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
