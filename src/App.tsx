import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import { storage } from './lib/storage';

// Animated particle background
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      radius: number; opacity: number; color: string;
    };

    const particles: Particle[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '#00D4A0' : '#7C3AED',
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
}

// Gradient orb decorations
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute rounded-full opacity-20"
        style={{
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(0,212,160,0.3) 0%, transparent 70%)',
          top: '-200px', left: '-200px',
          filter: 'blur(40px)',
          animation: 'orb-float 12s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full opacity-15"
        style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
          bottom: '-150px', right: '-150px',
          filter: 'blur(40px)',
          animation: 'orb-float 10s ease-in-out infinite reverse',
          animationDelay: '4s',
        }}
      />
      <div
        className="absolute rounded-full opacity-10"
        style={{
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(0,180,216,0.3) 0%, transparent 70%)',
          top: '40%', left: '60%',
          filter: 'blur(30px)',
          animation: 'orb-float 8s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
    </div>
  );
}

function AppShell() {
  const { isOnboarded, profile } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  const handleResetProfile = () => {
    if (window.confirm('Reset your profile? This will clear all your data.')) {
      storage.clearAll();
      window.location.reload();
    }
  };

  if (!isOnboarded || !profile) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <BackgroundOrbs />
      <div className="relative z-10">
        <Navigation onResetProfile={handleResetProfile} />
        <main
          className="max-w-4xl mx-auto px-4 py-6 pb-24"
          id="main-content"
          tabIndex={-1}
        >
          {/* Skip to content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 btn-eco z-50"
          >
            Skip to main content
          </a>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
