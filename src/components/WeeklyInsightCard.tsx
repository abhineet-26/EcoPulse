import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateWeeklyInsight } from '../lib/ecoBuddyAI';
import { buildWeeklySummary } from '../lib/ecoBuddy';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function WeeklyInsightCard() {
  const { getWeekFootprints, getCurrentWeekStats } = useApp();
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAI, setIsAI] = useState(false);

  const weekFootprints = getWeekFootprints();
  const weekStats = getCurrentWeekStats();

  useEffect(() => {
    if (weekFootprints.length === 0) return;
    fetchInsight();
  }, [weekFootprints.length]);

  const fetchInsight = async (forceRefresh = false) => {
    if (weekFootprints.length === 0) return;
    setIsLoading(true);
    try {
      const summary = buildWeeklySummary(weekFootprints);
      const result = await generateWeeklyInsight(summary, forceRefresh);
      setInsight(result);
      // Detect if AI enhanced (AI responses tend to be different from template)
      setIsAI(!!import.meta.env.VITE_GEMINI_API_KEY);
    } catch {
      const summary = buildWeeklySummary(weekFootprints);
      setInsight(`This week you've logged ${weekFootprints.length} days. Keep tracking to unlock more insights!`);
      setIsAI(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (weekFootprints.length === 0) {
    return (
      <div className="glass-card p-5 text-center space-y-2">
        <div className="text-3xl">📊</div>
        <h3 className="font-semibold text-eco-text text-sm">Weekly AI Insight</h3>
        <p className="text-eco-muted text-xs">Log at least 1 day this week to see your weekly summary.</p>
      </div>
    );
  }

  const TrendIcon = weekStats?.trend === 'improving'
    ? TrendingDown
    : weekStats?.trend === 'worsening'
    ? TrendingUp
    : Minus;

  const trendColor = weekStats?.trend === 'improving'
    ? 'text-eco-primary'
    : weekStats?.trend === 'worsening'
    ? 'text-eco-danger'
    : 'text-eco-muted';

  return (
    <div className="glass-card overflow-hidden border border-eco-accent/20 bg-gradient-to-br from-eco-accent/10 to-transparent">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-eco-accent/20 flex items-center justify-center">
              <span className="text-lg" aria-hidden="true">✨</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-eco-text">Weekly AI Insight</h3>
                {isAI && (
                  <span className="flex items-center gap-1 text-xs bg-eco-accent/20 text-purple-400 border border-eco-accent/30 px-1.5 py-0.5 rounded-full">
                    <Sparkles size={9} aria-hidden="true" />
                    Gemini
                  </span>
                )}
              </div>
              <p className="text-xs text-eco-muted">{weekFootprints.length} days logged this week</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchInsight(true)}
            disabled={isLoading}
            className="btn-ghost p-1.5 text-xs"
            aria-label="Refresh weekly insight"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
        </div>

        {/* Stats row */}
        {weekStats && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xs text-eco-muted">Week Total</div>
              <div className="text-lg font-bold gradient-text">{weekStats.totalKgCO2e.toFixed(1)}</div>
              <div className="text-xs text-eco-muted">kg CO₂e</div>
            </div>
            <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xs text-eco-muted">Daily Avg</div>
              <div className="text-lg font-bold text-eco-text">{weekStats.avgPerDay.toFixed(1)}</div>
              <div className="text-xs text-eco-muted">kg CO₂e</div>
            </div>
            <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xs text-eco-muted">Trend</div>
              <TrendIcon size={22} className={`mx-auto my-0.5 ${trendColor}`} aria-hidden="true" />
              <div className={`text-xs font-medium capitalize ${trendColor}`}>{weekStats.trend}</div>
            </div>
          </div>
        )}

        {/* Insight text */}
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-5/6" />
            <div className="h-3 bg-white/10 rounded w-4/6" />
          </div>
        ) : (
          <p className="text-sm text-eco-text leading-relaxed" aria-live="polite">
            {insight}
          </p>
        )}
      </div>
    </div>
  );
}
