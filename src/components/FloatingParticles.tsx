import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

export function FloatingParticles({ isAccelerating }: { isAccelerating: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accelRef = useRef(isAccelerating);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    accelRef.current = isAccelerating;
  }, [isAccelerating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const count = isMobile ? 15 : isTablet ? 25 : 40;

      for (let i = 0; i < count; i++) {
        particles.push(createParticle(true));
      }
    };

    const createParticle = (randomY = false) => {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + 10,
        size: Math.random() > 0.9 ? Math.random() * 2 + 2 : Math.random() * 1.5 + 0.5,
        speedY: Math.random() * 0.3 + 0.1, // very slow rise
        speedX: (Math.random() - 0.5) * 0.1,
        opacity: randomY ? Math.random() * 0.3 : 0,
        targetOpacity: Math.random() * 0.15 + 0.05,
        colorType: Math.random()
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, index) => {
        const accel = prefersReducedMotion ? 0.2 : (accelRef.current ? 4 : 1);
        p.y -= p.speedY * accel;
        p.x += p.speedX * accel;

        if (p.opacity < p.targetOpacity && p.y > height * 0.1) {
           p.opacity += 0.002 * accel;
        }
        if (p.y < height * 0.2) {
           p.opacity -= 0.003 * accel;
        }

        if (p.y < -10 || p.opacity < 0) {
          particles[index] = createParticle(false);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        let r, g, b;
        if (p.colorType > 0.8) {
           r = 77; g = 141; b = 255; // Accent
        } else if (p.colorType > 0.5) {
           r = 120; g = 160; b = 210; // Mid
        } else {
           r = 210; g = 225; b = 240; // Light
        }
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, p.opacity)})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}
