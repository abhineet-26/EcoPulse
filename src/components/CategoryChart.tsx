import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  CartesianGrid, Legend
} from 'recharts';
import type { CalculatedFootprint } from '../types';
import { BarChart2, PieChart as PieIcon, Table } from 'lucide-react';

const CATEGORY_COLORS = {
  transport: '#3B82F6',
  energy: '#EAB308',
  diet: '#22C55E',
  waste: '#F97316',
};

const CATEGORY_ICONS: Record<string, string> = {
  transport: '🚗',
  energy: '⚡',
  diet: '🍽️',
  waste: '🗑️',
};

const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  energy: 'Energy',
  diet: 'Diet',
  waste: 'Waste',
};

interface Props {
  todayFootprint: CalculatedFootprint | null;
  weekFootprints: CalculatedFootprint[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatShortDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-xs border border-white/20">
        {label && <div className="text-eco-muted mb-1">{label}</div>}
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="font-semibold text-eco-text">{p.value.toFixed(2)} kg CO₂e</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CategoryChart({ todayFootprint, weekFootprints }: Props) {
  const [viewMode, setViewMode] = useState<'pie' | 'bar' | 'table'>('pie');

  const categoryData = todayFootprint
    ? Object.entries(todayFootprint.byCategory).map(([key, value]) => ({
        name: CATEGORY_LABELS[key],
        value: Math.round(value * 100) / 100,
        key,
        icon: CATEGORY_ICONS[key],
        color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS],
      }))
    : [];

  const weekData = weekFootprints.map(fp => ({
    day: formatShortDay(fp.date),
    date: fp.date,
    transport: fp.byCategory.transport,
    energy: fp.byCategory.energy,
    diet: fp.byCategory.diet,
    waste: fp.byCategory.waste,
    total: fp.totalKgCO2e,
  }));

  const hasData = categoryData.length > 0 && categoryData.some(d => d.value > 0);

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-eco-muted uppercase tracking-wider">Today's Breakdown</h3>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1" role="group" aria-label="Chart view options">
          {([
            { id: 'pie' as const, icon: PieIcon, label: 'Pie chart' },
            { id: 'bar' as const, icon: BarChart2, label: 'Bar chart' },
            { id: 'table' as const, icon: Table, label: 'Data table' },
          ]).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setViewMode(opt.id)}
              aria-pressed={viewMode === opt.id}
              aria-label={`View as ${opt.label}`}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === opt.id ? 'bg-eco-primary/20 text-eco-primary' : 'text-eco-muted hover:text-eco-text'
              }`}
            >
              <opt.icon size={14} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-8 text-eco-muted text-sm">
          <PieIcon size={32} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
          Log today's activities to see your breakdown
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          {viewMode === 'pie' && (
            <div aria-label="Category pie chart" role="img">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map(entry => (
                      <Cell key={entry.key} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categoryData.map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} aria-hidden="true" />
                    <span className="text-xs text-eco-muted">{item.icon} {item.name}</span>
                    <span className="text-xs font-semibold text-eco-text ml-auto">{item.value} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar Chart */}
          {viewMode === 'bar' && (
            <div aria-label="Category bar chart" role="img">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} barSize={32} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#8892B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8892B0', fontSize: 11 }} axisLine={false} tickLine={false} unit=" kg" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map(entry => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table — always accessible to screen readers */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Carbon footprint category breakdown">
                <caption className="sr-only">Today's carbon footprint by category in kg CO₂e</caption>
                <thead>
                  <tr className="text-eco-muted text-xs uppercase">
                    <th scope="col" className="text-left py-2 pr-4">Category</th>
                    <th scope="col" className="text-right py-2">kg CO₂e</th>
                    <th scope="col" className="text-right py-2">% of total</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map(item => {
                    const total = categoryData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <tr key={item.key} className="border-t border-white/5">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} aria-hidden="true" />
                            {item.icon} {item.name}
                          </div>
                        </td>
                        <td className="text-right font-mono font-semibold">{item.value}</td>
                        <td className="text-right text-eco-muted">{pct}%</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-white/20 font-bold">
                    <td className="py-2 pr-4">Total</td>
                    <td className="text-right font-mono">{todayFootprint!.totalKgCO2e}</td>
                    <td className="text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Screen-reader accessible hidden table (always present) */}
          <div className="sr-only" aria-live="polite">
            <table>
              <caption>Today's carbon footprint by category</caption>
              <tbody>
                {categoryData.map(item => (
                  <tr key={item.key}>
                    <th scope="row">{item.name}</th>
                    <td>{item.value} kg CO₂e</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Total</th>
                  <td>{todayFootprint!.totalKgCO2e} kg CO₂e</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Weekly trend */}
      {weekData.length >= 2 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-eco-muted uppercase tracking-wider mb-3">This Week's Trend</h3>
          <div aria-label="Weekly CO₂e trend line chart" role="img">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#8892B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8892B0', fontSize: 11 }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#00D4A0"
                  strokeWidth={2}
                  dot={{ fill: '#00D4A0', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Total CO₂e"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* SR table for weekly data */}
          <div className="sr-only">
            <table>
              <caption>Weekly CO₂e trend</caption>
              <tbody>
                {weekData.map(d => (
                  <tr key={d.date}>
                    <th scope="row">{formatDate(d.date)}</th>
                    <td>{d.total} kg CO₂e</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stacked weekly bar chart */}
      {weekData.length >= 2 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-eco-muted uppercase tracking-wider mb-3">Weekly Category Stack</h3>
          <div aria-label="Weekly stacked bar chart by category" role="img">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weekData} barSize={24} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fill: '#8892B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8892B0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#8892B0' }} />
                <Bar dataKey="transport" stackId="a" fill={CATEGORY_COLORS.transport} name="Transport" />
                <Bar dataKey="energy" stackId="a" fill={CATEGORY_COLORS.energy} name="Energy" />
                <Bar dataKey="diet" stackId="a" fill={CATEGORY_COLORS.diet} name="Diet" />
                <Bar dataKey="waste" stackId="a" fill={CATEGORY_COLORS.waste} name="Waste" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
