import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, Flame, Target, Download, Share2 } from 'lucide-react';

const ALL_BADGES = [
  { id: 'first_log', name: 'First Step', icon: '🌱', description: 'Logged your first day!' },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥', description: '3 days in a row' },
  { id: 'streak_7', name: 'Week Warrior', icon: '⚡', description: '7-day logging streak' },
  { id: 'meatfree_day', name: 'Plant Power', icon: '🥗', description: 'Chose a plant-based diet' },
  { id: 'zero_waste_day', name: 'Zero Waste Hero', icon: '♻️', description: 'No waste logged today' },
  { id: 'low_carbon_day', name: 'Low Carbon Day', icon: '💚', description: 'Below daily target' },
  { id: 'week_goal_met', name: 'Goal Achieved!', icon: '🏆', description: 'Met weekly reduction goal' },
];

function exportToCSV(footprints: Record<string, { date: string; byCategory: { transport: number; energy: number; diet: number; waste: number }; totalKgCO2e: number }>): void {
  const rows = [
    ['Date', 'Transport (kg CO₂e)', 'Energy (kg CO₂e)', 'Diet (kg CO₂e)', 'Waste (kg CO₂e)', 'Total (kg CO₂e)'],
    ...Object.values(footprints).map(fp => [
      fp.date,
      fp.byCategory.transport.toFixed(3),
      fp.byCategory.energy.toFixed(3),
      fp.byCategory.diet.toFixed(3),
      fp.byCategory.waste.toFixed(3),
      fp.totalKgCO2e.toFixed(3),
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecopulse-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToHTML(footprints: Record<string, { date: string; byCategory: { transport: number; energy: number; diet: number; waste: number }; totalKgCO2e: number }>, weekTotal: number): void {
  const rows = Object.values(footprints)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(fp => `
      <tr>
        <td>${fp.date}</td>
        <td>${fp.byCategory.transport.toFixed(2)}</td>
        <td>${fp.byCategory.energy.toFixed(2)}</td>
        <td>${fp.byCategory.diet.toFixed(2)}</td>
        <td>${fp.byCategory.waste.toFixed(2)}</td>
        <td><strong>${fp.totalKgCO2e.toFixed(2)}</strong></td>
      </tr>
    `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EcoPulse Weekly Report — ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Inter, sans-serif; max-width: 800px; margin: 40px auto; color: #333; }
    h1 { color: #00D4A0; } h2 { color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #00D4A0; color: #fff; padding: 10px; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    .total { font-size: 1.5em; color: #00D4A0; font-weight: bold; }
    footer { margin-top: 40px; font-size: 0.8em; color: #999; }
  </style>
</head>
<body>
  <h1>🌍 EcoPulse Weekly Carbon Report</h1>
  <p>Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <p class="total">Week Total: ${weekTotal.toFixed(2)} kg CO₂e</p>
  <h2>Daily Breakdown</h2>
  <table>
    <thead><tr><th>Date</th><th>Transport</th><th>Energy</th><th>Diet</th><th>Waste</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>
    <p>EcoPulse uses approximate emission factors from CEA India, Our World in Data, and DEFRA/IPCC for awareness purposes.</p>
    <p>Data stored locally on your device — never shared.</p>
  </footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  win?.print();
}

export default function GoalsBadges() {
  const { badges, currentStreak, profile, footprints, getCurrentWeekStats } = useApp();
  const [goalPercent, setGoalPercent] = useState(profile?.weeklyGoalPercent ?? 10);
  const [exportFormat, setExportFormat] = useState<'csv' | 'html'>('csv');

  const weekStats = getCurrentWeekStats();
  const earnedIds = new Set(badges.map(b => b.id));

  const weekTotal = weekStats?.totalKgCO2e ?? 0;
  const prevWeekTotal = weekTotal * (1 + goalPercent / 100); // estimated previous
  const goalMet = weekTotal <= prevWeekTotal * (1 - goalPercent / 100);
  const progressPct = prevWeekTotal > 0 ? Math.min(100, Math.round((1 - weekTotal / prevWeekTotal) * 100)) : 0;

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV(footprints);
    } else {
      exportToHTML(footprints, weekTotal);
    }
  };

  return (
    <div className="space-y-5">
      {/* Streak */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <Flame size={20} className={currentStreak > 0 ? 'text-orange-400' : 'text-eco-muted'} aria-hidden="true" />
          <h3 className="font-bold text-eco-text">Logging Streak</h3>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-black gradient-text">{currentStreak}</span>
          <span className="text-eco-muted pb-1">{currentStreak === 1 ? 'day' : 'days'} in a row</span>
        </div>
        {currentStreak === 0 && (
          <p className="text-xs text-eco-muted mt-2">Log today to start your streak! 🌱</p>
        )}
        {currentStreak >= 3 && (
          <p className="text-xs text-eco-primary mt-2">🔥 You're on fire! Keep going!</p>
        )}
      </div>

      {/* Weekly Goal */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Target size={20} className="text-eco-primary" aria-hidden="true" />
          <h3 className="font-bold text-eco-text">Weekly Goal</h3>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label htmlFor="goal-slider" className="text-sm text-eco-muted whitespace-nowrap">
            Target: <span className="text-eco-primary font-bold">{goalPercent}% reduction</span>
          </label>
        </div>
        <input
          id="goal-slider"
          type="range"
          min={5} max={50} step={5}
          className="slider-eco"
          value={goalPercent}
          onChange={e => setGoalPercent(parseInt(e.target.value))}
          aria-label={`Weekly goal: ${goalPercent}% reduction`}
        />

        {weekStats && weekStats.daysLogged > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-eco-muted mb-2">
              <span>Progress this week</span>
              <span className={goalMet ? 'text-eco-primary font-semibold' : 'text-eco-muted'}>
                {goalMet ? '✅ Goal met!' : `${progressPct}% achieved`}
              </span>
            </div>
            <div
              className="h-2 bg-white/10 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Weekly goal progress: ${progressPct}%`}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(0, progressPct)}%`,
                  background: goalMet ? 'linear-gradient(90deg, #00D4A0, #00B4D8)' : 'linear-gradient(90deg, #EAB308, #F97316)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Award size={20} className="text-eco-accent" aria-hidden="true" />
          <h3 className="font-bold text-eco-text">Badges</h3>
          <span className="text-xs bg-eco-primary/20 text-eco-primary px-2 py-0.5 rounded-full">
            {earnedIds.size}/{ALL_BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3" role="list" aria-label="Achievement badges">
          {ALL_BADGES.map(badge => {
            const earned = earnedIds.has(badge.id);
            const earnedBadge = badges.find(b => b.id === badge.id);
            return (
              <div
                key={badge.id}
                role="listitem"
                aria-label={`${badge.name}: ${earned ? 'earned' : 'locked'}`}
                className={`glass-card p-3 text-center transition-all duration-300 ${
                  earned ? 'border-eco-primary/30 bg-eco-primary/5' : 'opacity-40 grayscale'
                }`}
                title={badge.description}
              >
                <div className="text-2xl mb-1 relative">
                  {badge.icon}
                  {!earned && (
                    <span className="absolute -top-1 -right-1 text-xs" aria-hidden="true">🔒</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-eco-text leading-tight">{badge.name}</div>
                {earned && earnedBadge?.earnedAt && (
                  <div className="text-xs text-eco-muted mt-0.5">
                    {new Date(earnedBadge.earnedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Download size={20} className="text-eco-secondary" aria-hidden="true" />
          <h3 className="font-bold text-eco-text">Export Report</h3>
        </div>
        <div className="flex gap-2 mb-4" role="radiogroup" aria-label="Export format">
          {(['csv', 'html'] as const).map(fmt => (
            <button
              key={fmt}
              type="button"
              role="radio"
              aria-checked={exportFormat === fmt}
              onClick={() => setExportFormat(fmt)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                exportFormat === fmt ? 'bg-eco-primary/20 text-eco-primary border border-eco-primary/30' : 'bg-white/5 text-eco-muted border border-white/10'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="btn-eco w-full justify-center"
          aria-label={`Download report as ${exportFormat.toUpperCase()}`}
          disabled={Object.keys(footprints).length === 0}
        >
          <Download size={16} aria-hidden="true" />
          Download {exportFormat.toUpperCase()} Report
        </button>
        {Object.keys(footprints).length === 0 && (
          <p className="text-xs text-eco-muted text-center mt-2">Log some days first to generate a report</p>
        )}
      </div>

      {/* Share */}
      <button
        type="button"
        className="btn-ghost w-full justify-center text-sm"
        onClick={() => {
          const text = `I'm tracking my carbon footprint with EcoPulse! This week: ${weekTotal.toFixed(1)} kg CO₂e. Join me in reducing emissions 🌍`;
          if (navigator.share) {
            navigator.share({ title: 'EcoPulse Weekly Progress', text });
          } else {
            navigator.clipboard.writeText(text);
            alert('Stats copied to clipboard!');
          }
        }}
        aria-label="Share your weekly progress"
      >
        <Share2 size={15} aria-hidden="true" />
        Share My Progress
      </button>
    </div>
  );
}
