import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getRecommendation } from '../lib/ecoBuddy';
import { rephraseRecommendation } from '../lib/ecoBuddyAI';
import { calculateFootprint } from '../lib/calculator';
import type { Recommendation } from '../types';
import factorsData from '../data/emissionFactors.json';
import type { EmissionFactors } from '../types';
import { Sparkles, RefreshCw, TrendingDown, Zap, Car, Utensils, Trash2 } from 'lucide-react';

const factors = factorsData as unknown as EmissionFactors;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  transport: <Car size={18} className="text-blue-400" aria-hidden="true" />,
  energy: <Zap size={18} className="text-yellow-400" aria-hidden="true" />,
  diet: <Utensils size={18} className="text-green-400" aria-hidden="true" />,
  waste: <Trash2 size={18} className="text-orange-400" aria-hidden="true" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  transport: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  energy: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
  diet: 'from-green-500/20 to-green-600/5 border-green-500/30',
  waste: 'from-orange-500/20 to-orange-600/5 border-orange-500/30',
  balanced: 'from-eco-primary/20 to-eco-primary/5 border-eco-primary/30',
};

export default function EcoBuddyCard() {
  const { getTodayLog, getWeekLogs, getWeekFootprints, profile, footprints } = useApp();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isAIEnhanced, setIsAIEnhanced] = useState(false);

  useEffect(() => {
    const todayLog = getTodayLog();
    if (!todayLog || !profile) return;

    const weekLogs = getWeekLogs();
    const weekFootprints = getWeekFootprints();
    const allFootprints = Object.values(footprints);

    const fp = calculateFootprint(todayLog, profile, factors);
    const rec = getRecommendation(
      todayLog,
      weekLogs.filter(l => l.date !== todayLog.date),
      allFootprints,
      profile,
      { byCategory: fp.byCategory, totalKgCO2e: fp.totalKgCO2e }
    );
    setRecommendation(rec);
    setAiMessage(rec.message);
    setIsAIEnhanced(false);

    // Try to get AI-rephrased version
    const fetchAI = async () => {
      setIsLoadingAI(true);
      try {
        const rephrased = await rephraseRecommendation(rec);
        if (rephrased !== rec.message) {
          setAiMessage(rephrased);
          setIsAIEnhanced(true);
        }
      } catch {
        // Silent fallback
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAI();
  }, [getTodayLog, getWeekLogs, getWeekFootprints, profile, footprints]);

  const handleRefreshAI = async () => {
    if (!recommendation) return;
    setIsLoadingAI(true);
    try {
      const rephrased = await rephraseRecommendation(recommendation);
      setAiMessage(rephrased);
      setIsAIEnhanced(rephrased !== recommendation.message);
    } catch {
      setAiMessage(recommendation.message);
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!getTodayLog()) {
    return (
      <div className="glass-card p-6 text-center space-y-3">
        <div className="text-4xl">🤖</div>
        <h3 className="font-bold text-eco-text">EcoBuddy</h3>
        <p className="text-eco-muted text-sm">
          Log today's activities to get your personalized carbon-saving recommendation!
        </p>
      </div>
    );
  }

  if (!recommendation) return null;

  const colorClass = CATEGORY_COLORS[recommendation.topCategory] ?? CATEGORY_COLORS['balanced'];

  return (
    <div
      className={`glass-card overflow-hidden border bg-gradient-to-br ${colorClass} animate-fade-in`}
      role="region"
      aria-label="EcoBuddy AI recommendation"
    >
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-eco-primary/20 flex items-center justify-center">
              <span className="text-xl" aria-hidden="true">🤖</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-eco-text">EcoBuddy</h3>
                {isAIEnhanced && (
                  <span className="flex items-center gap-1 text-xs bg-eco-accent/20 text-purple-400 border border-eco-accent/30 px-2 py-0.5 rounded-full">
                    <Sparkles size={10} aria-hidden="true" />
                    AI Enhanced
                  </span>
                )}
              </div>
              <p className="text-xs text-eco-muted">Your personalized action for today</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefreshAI}
            disabled={isLoadingAI}
            className="btn-ghost p-2"
            aria-label="Refresh AI recommendation"
          >
            <RefreshCw size={14} className={isLoadingAI ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Category tag */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 mb-3">
          {CATEGORY_ICONS[recommendation.topCategory]}
          <span className="text-xs font-semibold uppercase tracking-wider text-eco-muted">
            Top driver: {recommendation.topCategory}
          </span>
        </div>
      </div>

      {/* Message */}
      <div className="px-5 pb-5">
        {isLoadingAI ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-5/6" />
            <div className="h-4 bg-white/10 rounded w-4/6" />
          </div>
        ) : (
          <p className="text-eco-text leading-relaxed" aria-live="polite">
            {aiMessage ?? recommendation.message}
          </p>
        )}

        {/* Savings chip */}
        {recommendation.estimatedSavingsKgCO2e > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-eco-primary/10 text-eco-primary border border-eco-primary/20 px-3 py-1.5 rounded-full text-sm font-semibold">
            <TrendingDown size={14} aria-hidden="true" />
            Save ~{recommendation.estimatedSavingsKgCO2e} kg CO₂e
          </div>
        )}

        {/* Trend indicator */}
        {recommendation.trend && recommendation.trend !== 'flat' && (
          <div className={`mt-3 text-xs font-medium ${
            recommendation.trend === 'improving' ? 'text-eco-primary' : 'text-eco-warning'
          }`}>
            {recommendation.trend === 'improving' ? '📈 Emissions trending downward — keep it up!' : '⚠️ Emissions have been rising — small actions count!'}
          </div>
        )}
      </div>

      {/* Footer action tag */}
      <div className="px-5 pb-4">
        <span className="text-xs font-mono text-eco-muted opacity-60">#{recommendation.actionTag}</span>
      </div>
    </div>
  );
}
