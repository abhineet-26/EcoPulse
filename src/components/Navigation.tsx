import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon, Leaf, Settings } from 'lucide-react';

interface NavProps {
  onResetProfile?: () => void;
}

export default function Navigation({ onResetProfile }: NavProps) {
  const { theme, toggleTheme, profile, currentStreak } = useApp();

  return (
    <header
      className="sticky top-0 z-30 glass-card rounded-none border-x-0 border-t-0 px-4 py-3 md:px-6"
      style={{ backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-eco-primary/20 border border-eco-primary/30 flex items-center justify-center">
            <Leaf size={18} className="text-eco-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-black gradient-text leading-none">EcoPulse</h1>
            <p className="text-xs text-eco-muted leading-none">Carbon Companion</p>
          </div>
        </div>

        {/* Center — greeting */}
        {profile?.name && (
          <div className="hidden md:block text-sm text-eco-muted">
            Hey, <span className="text-eco-text font-semibold">{profile.name}</span> 👋
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          {currentStreak > 0 && (
            <div
              className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full text-xs font-semibold"
              aria-label={`${currentStreak}-day logging streak`}
            >
              🔥 {currentStreak}d
            </div>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-ghost p-2"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'light'}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>

          {/* Settings / reset */}
          {onResetProfile && (
            <button
              type="button"
              onClick={onResetProfile}
              className="btn-ghost p-2"
              aria-label="Open settings"
            >
              <Settings size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
