// EcoPulse — EcoBuddy AI Layer (Gemini Integration)
// PRD Section 9, Step 6 & Section 6, Feature 5
// Isolated module — all Gemini calls are here, nowhere else.

import type { Recommendation } from '../types';
import { storage } from './storage';
import { getWeekKey } from './calculator';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const TIMEOUT_MS = 8000;

/** Get the Gemini API key from env (never commit this) */
function getApiKey(): string | undefined {
  return import.meta.env.VITE_GEMINI_API_KEY || undefined;
}

/** Abort-controller wrapped fetch with timeout */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Call Gemini API with a prompt text, returns text response or null */
async function callGemini(prompt: string): Promise<string | null> {
  const key = getApiKey();
  if (!key) return null;

  try {
    const response = await fetchWithTimeout(
      `${GEMINI_API_BASE}?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          },
        }),
      },
      TIMEOUT_MS
    );

    if (!response.ok) {
      console.warn('[EcoBuddy AI] Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text.trim() : null;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('[EcoBuddy AI] Gemini request timed out after', TIMEOUT_MS, 'ms');
    } else {
      console.warn('[EcoBuddy AI] Gemini request failed:', err);
    }
    return null;
  }
}

/**
 * Rephrase a rule-based recommendation in a warm, encouraging tone using Gemini.
 * Falls back to the original message if the API key is missing or the call fails.
 *
 * PRD Section 9, Step 6 — "rephraseRecommendation"
 */
export async function rephraseRecommendation(rec: Recommendation): Promise<string> {
  const prompt = `You are EcoBuddy, a warm and encouraging carbon footprint assistant.
Rephrase this carbon-saving tip in a friendly, motivating tone. Keep it to 2 sentences maximum.
IMPORTANT: Keep the exact CO₂e number (${rec.estimatedSavingsKgCO2e} kg) if it's above 0.
Original tip: "${rec.message}"
Respond with only the rephrased tip, nothing else.`;

  const aiResponse = await callGemini(prompt);
  return aiResponse ?? rec.message;
}

/**
 * Build a templated weekly insight when Gemini is unavailable.
 * Always returns a useful, human-readable summary.
 */
function buildTemplatedWeeklyInsight(weeklySummary: {
  weekTotal: number;
  avgPerDay: number;
  dominantCategory: string;
  trend: 'improving' | 'flat' | 'worsening';
}): string {
  const { weekTotal, avgPerDay, dominantCategory, trend } = weeklySummary;

  const trendMsg =
    trend === 'improving'
      ? 'Your emissions are trending downward — great work!'
      : trend === 'worsening'
      ? 'Your emissions have been rising slightly this week.'
      : 'Your emissions have been fairly consistent this week.';

  const categoryMsg: Record<string, string> = {
    transport: 'Transport is your biggest opportunity for impact — even small shifts toward public transit add up fast.',
    energy: 'Reducing home energy use (especially AC and cooking fuel) is your highest-leverage action right now.',
    diet: 'Your food choices are the largest driver this week — even one plant-based day makes a measurable difference.',
    waste: 'Waste and water are dominating this week — starting a compost bin could be your biggest single win.',
    balanced: 'Your footprint is fairly balanced across categories — keep up the consistent effort!',
  };

  return `${trendMsg} This week you logged ${Math.round(weekTotal * 10) / 10} kg CO₂e total (avg ${avgPerDay} kg/day). ${categoryMsg[dominantCategory] ?? categoryMsg['balanced']}`;
}

/**
 * Generate a personalized weekly AI insight using Gemini.
 * Caches the result in localStorage keyed by ISO week to avoid redundant calls.
 * Falls back to a templated summary if the API key is missing or the call fails.
 *
 * PRD Section 9, Step 6 — "generateWeeklyInsight"
 */
export async function generateWeeklyInsight(
  weeklySummary: {
    weekTotal: number;
    avgPerDay: number;
    dominantCategory: string;
    byCategory: { transport: number; energy: number; diet: number; waste: number };
    trend: 'improving' | 'flat' | 'worsening';
  },
  forceRefresh = false
): Promise<string> {
  const weekKey = getWeekKey(new Date().toISOString().slice(0, 10));
  const cachedStat = storage.getWeekStat(weekKey);

  // Return cached result if available (unless force refresh)
  if (!forceRefresh && cachedStat?.aiInsight && cachedStat.aiInsightGeneratedAt) {
    return cachedStat.aiInsight;
  }

  const fallback = buildTemplatedWeeklyInsight(weeklySummary);

  const prompt = `You are EcoBuddy, a warm and encouraging personal carbon footprint assistant.
Write a 2-3 sentence personalized weekly carbon summary for a user with these stats:
- Total CO₂e this week: ${weeklySummary.weekTotal} kg (avg ${weeklySummary.avgPerDay} kg/day)
- Biggest category: ${weeklySummary.dominantCategory} (${weeklySummary.byCategory[weeklySummary.dominantCategory as keyof typeof weeklySummary.byCategory]} kg)
- Trend: ${weeklySummary.trend}
Highlight their biggest improvement and biggest opportunity. Be encouraging and specific.
Respond with only the 2-3 sentence summary, nothing else.`;

  const aiResponse = await callGemini(prompt);
  const insight = aiResponse ?? fallback;

  // Cache the result
  const existingStat = storage.getWeekStat(weekKey);
  if (existingStat) {
    storage.saveWeeklyStats({
      ...existingStat,
      aiInsight: insight,
      aiInsightGeneratedAt: new Date().toISOString(),
    });
  }

  return insight;
}
