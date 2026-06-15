import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CategoryChart from './CategoryChart';
import EcoBuddyCard from './EcoBuddyCard';
import WeeklyInsightCard from './WeeklyInsightCard';
import DailyLogForm from './DailyLogForm';
import GoalsBadges from './GoalsBadges';
import { compareToAverage } from '../lib/calculator';
import factorsData from '../data/emissionFactors.json';
import type { EmissionFactors } from '../types';
import { Plus, TrendingDown, TrendingUp, Minus, Leaf, Info } from 'lucide-react';

const factors = factorsData as unknown as EmissionFactors;

function AnimatedNumber({ value, unit = '' }: { value: number; unit?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = value;
    const duration = 600;
    const start = Date.now();
    const startVal = display;
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + (target - startVal) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {display.toFixed(2)}{unit}
    </span>
  );
}

function ComparisonBar({ userKg, indiaAvg, globalAvg }: { userKg: number; indiaAvg: number; globalAvg: number }) {
  const maxVal = Math.max(userKg, globalAvg) * 1.1;
  const userPct = (userKg / maxVal) * 100;
  const indiaPct = (indiaAvg / maxVal) * 100;
  const globalPct = (globalAvg / maxVal) * 100;

  return (
    <div className="space-y-3" aria-label="Footprint comparison">
      {[
        { label: 'You', value: userKg, pct: userPct, color: 'bg-eco-primary' },
        { label: 'India avg', value: indiaAvg, pct: indiaPct, color: 'bg-blue-400' },
        { label: 'Global avg', value: globalAvg, pct: globalPct, color: 'bg-orange-400' },
      ].map(item => (
        <div key={item.label}>
          <div className="flex justify-between text-xs text-eco-muted mb-1">
            <span>{item.label}</span>
            <span className="font-mono font-semibold text-eco-text">{item.value.toFixed(1)} kg</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color} transition-all duration-700`}
              style={{ width: `${item.pct}%` }}
              role="presentation"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const {
    profile,
    getTodayFootprint,
    getTodayLog,
    getWeekFootprints,
    getCurrentWeekStats,
    currentStreak,
    badges,
  } = useApp();

  const [showLogForm, setShowLogForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'goals'>('overview');

  const todayFP = getTodayFootprint();
  const todayLog = getTodayLog();
  const weekFPs = getWeekFootprints();
  const weekStats = getCurrentWeekStats();

  const userDailyKg = todayFP?.totalKgCO2e ?? 0;
  const indiaAvg = factors.benchmarks.indiaAveragePerDay;
  const globalAvg = factors.benchmarks.globalAveragePerDay;
  const sustainableTarget = factors.benchmarks.sustainableTargetPerDay;

  const vsIndia = compareToAverage(userDailyKg, indiaAvg);
  const isBelowIndia = vsIndia < 0;
  const isBelowTarget = userDailyKg <= sustainableTarget;

  const CompIcon = isBelowIndia ? TrendingDown : vsIndia === 0 ? Minus : TrendingUp;
  const compColor = isBelowIndia ? 'text-eco-primary' : 'text-eco-danger';

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'charts' as const, label: 'Charts' },
    { id: 'goals' as const, label: 'Goals & Badges' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Today's total */}
        <div className="col-span-2 glass-card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-eco-primary/10 to-transparent pointer-events-none" aria-hidden="true" />
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-wider text-eco-muted mb-1">Today's Footprint</div>
            <div className="text-4xl font-black gradient-text">
              {todayFP ? <AnimatedNumber value={todayFP.totalKgCO2e} /> : '—'}
            </div>
            <div className="text-eco-muted text-sm mt-0.5">kg CO₂e</div>
            {todayFP && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${compColor}`}>
                <CompIcon size={12} aria-hidden="true" />
                {Math.abs(vsIndia)}% {isBelowIndia ? 'below' : 'above'} India average
              </div>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="glass-card p-5 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-2xl font-black text-eco-text">{currentStreak}</div>
          <div className="text-xs text-eco-muted">day streak</div>
        </div>

        {/* This week */}
        <div className="glass-card p-5 text-center">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-black text-eco-text">{weekStats?.totalKgCO2e.toFixed(1) ?? '—'}</div>
          <div className="text-xs text-eco-muted">kg this week</div>
        </div>
      </div>

      {/* Status banner */}
      {todayFP && (
        <div
          className={`glass-card p-4 flex items-center gap-3 border ${
            isBelowTarget
              ? 'border-eco-primary/30 bg-eco-primary/5'
              : isBelowIndia
              ? 'border-blue-500/30 bg-blue-500/5'
              : 'border-orange-500/30 bg-orange-500/5'
          }`}
          role="status"
          aria-live="polite"
        >
          <Leaf size={18} className={isBelowTarget ? 'text-eco-primary' : 'text-eco-muted'} aria-hidden="true" />
          <p className="text-sm">
            {isBelowTarget
              ? `✨ You're below the sustainable target of ${sustainableTarget} kg CO₂e/day — excellent!`
              : isBelowIndia
              ? `👍 You're ${Math.abs(vsIndia)}% below the India daily average. Keep it up!`
              : `💡 You're ${vsIndia}% above the India daily average. See EcoBuddy's tip below.`}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-2xl p-1.5" role="tablist" aria-label="Dashboard sections">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-eco-primary/20 text-eco-primary shadow-inner'
                : 'text-eco-muted hover:text-eco-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div id="panel-overview" role="tabpanel" hidden={activeTab !== 'overview'}>
        <div className="space-y-5">
          <EcoBuddyCard />
          <WeeklyInsightCard />

          {/* Comparison */}
          {todayFP && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="text-eco-muted" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-eco-muted uppercase tracking-wider">How You Compare</h3>
              </div>
              <ComparisonBar userKg={userDailyKg} indiaAvg={indiaAvg} globalAvg={globalAvg} />
              <p className="text-xs text-eco-muted mt-3">
                Sources: CEA India 2022-23, Our World in Data, IEA 2023. Values are daily per-capita estimates.
              </p>
            </div>
          )}
        </div>
      </div>

      <div id="panel-charts" role="tabpanel" hidden={activeTab !== 'charts'}>
        <div className="glass-card p-5">
          <CategoryChart todayFootprint={todayFP} weekFootprints={weekFPs} />
        </div>
      </div>

      <div id="panel-goals" role="tabpanel" hidden={activeTab !== 'goals'}>
        <GoalsBadges />
      </div>

      {/* Log form modal */}
      {showLogForm && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Daily log form"
          onClick={e => { if (e.target === e.currentTarget) setShowLogForm(false); }}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <DailyLogForm onClose={() => setShowLogForm(false)} />
          </div>
        </div>
      )}

      {/* Log today button — fab */}
      <button
        type="button"
        onClick={() => setShowLogForm(true)}
        className="fixed bottom-6 right-6 btn-eco rounded-2xl py-4 px-5 text-base shadow-xl glow-eco z-40 flex items-center gap-2"
        aria-label={todayLog ? "Update today's log" : "Log today's activities"}
      >
        <Plus size={20} aria-hidden="true" />
        {todayLog ? 'Update Log' : 'Log Today'}
      </button>
    </div>
  );
}
