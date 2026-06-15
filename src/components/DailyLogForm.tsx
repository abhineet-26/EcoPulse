import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import type { DailyLog, TransportMode, FuelType, DietType } from '../types';
import { Car, Zap, Utensils, Trash2, CheckCircle, Plus, Minus, X } from 'lucide-react';

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; icon: string; factor: number }[] = [
  { mode: 'petrolCar', label: 'Petrol Car', icon: '🚗', factor: 0.17 },
  { mode: 'dieselCar', label: 'Diesel Car', icon: '🚙', factor: 0.18 },
  { mode: 'motorbike', label: 'Motorbike', icon: '🏍️', factor: 0.07 },
  { mode: 'autoRickshaw', label: 'Auto-rickshaw', icon: '🛺', factor: 0.06 },
  { mode: 'bus', label: 'Bus', icon: '🚌', factor: 0.05 },
  { mode: 'metro', label: 'Metro / Train', icon: '🚇', factor: 0.03 },
  { mode: 'bicycle', label: 'Bicycle', icon: '🚲', factor: 0 },
  { mode: 'walking', label: 'Walking', icon: '🚶', factor: 0 },
  { mode: 'domesticFlight', label: 'Flight', icon: '✈️', factor: 0.25 },
];

const DIET_OPTIONS: { value: DietType; label: string; icon: string }[] = [
  { value: 'heavyMeat', label: 'Heavy Meat', icon: '🥩' },
  { value: 'average', label: 'Mixed / Average', icon: '🍽️' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥦' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
];

interface TransportEntry { mode: TransportMode; km: number; }

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyLogForm({ onClose }: { onClose?: () => void }) {
  const { saveLog, getTodayLog, profile } = useApp();
  const existing = getTodayLog();

  const [transport, setTransport] = useState<TransportEntry[]>(
    existing?.transport ?? []
  );
  const [electricityKwh, setElectricityKwh] = useState(existing?.electricityKwh ?? 0);
  const [fuelType, setFuelType] = useState<FuelType>(existing?.fuel.type ?? 'none');
  const [fuelAmount, setFuelAmount] = useState(existing?.fuel.amount ?? 0);
  const [dietType, setDietType] = useState<DietType>(existing?.dietType ?? profile?.dietType ?? 'average');
  const [wasteKg, setWasteKg] = useState(existing?.wasteKg ?? 0);
  const [composted, setComposted] = useState(existing?.composted ?? false);
  const [waterLiters, setWaterLiters] = useState(existing?.waterLiters ?? 150);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'transport' | 'energy' | 'diet' | 'waste'>('transport');

  const addTransportEntry = (mode: TransportMode) => {
    if (transport.find(t => t.mode === mode)) return;
    setTransport(prev => [...prev, { mode, km: 10 }]);
  };

  const updateKm = (mode: TransportMode, km: number) => {
    setTransport(prev => prev.map(t => t.mode === mode ? { ...t, km: Math.max(0, km) } : t));
  };

  const removeTransport = (mode: TransportMode) => {
    setTransport(prev => prev.filter(t => t.mode !== mode));
  };

  const handleSave = useCallback(() => {
    const log: DailyLog = {
      date: getToday(),
      transport,
      electricityKwh: Math.max(0, electricityKwh),
      fuel: { type: fuelType, amount: Math.max(0, fuelAmount) },
      dietType,
      wasteKg: Math.max(0, wasteKg),
      composted,
      waterLiters: Math.max(0, waterLiters),
    };
    saveLog(log);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose?.();
    }, 1500);
  }, [transport, electricityKwh, fuelType, fuelAmount, dietType, wasteKg, composted, waterLiters, saveLog, onClose]);

  const sections = [
    { id: 'transport' as const, label: 'Transport', icon: Car, color: 'text-blue-400' },
    { id: 'energy' as const, label: 'Energy', icon: Zap, color: 'text-yellow-400' },
    { id: 'diet' as const, label: 'Food & Diet', icon: Utensils, color: 'text-green-400' },
    { id: 'waste' as const, label: 'Waste & Water', icon: Trash2, color: 'text-orange-400' },
  ];

  if (saved) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold gradient-text">Log Saved!</h3>
        <p className="text-eco-muted mt-2">EcoBuddy is analyzing your footprint...</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-eco-text">Today's Log</h2>
          <p className="text-eco-muted text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close log form">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto" role="tablist">
        {sections.map(s => (
          <button
            key={s.id}
            role="tab"
            aria-selected={activeSection === s.id}
            aria-controls={`panel-${s.id}`}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all min-w-[70px] ${
              activeSection === s.id
                ? 'border-b-2 border-eco-primary text-eco-primary bg-eco-primary/5'
                : 'text-eco-muted hover:text-eco-text'
            }`}
          >
            <s.icon size={16} className={activeSection === s.id ? 'text-eco-primary' : s.color} aria-hidden="true" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Section panels */}
      <div className="p-6 min-h-[300px]">
        {/* Transport Panel */}
        <div id="panel-transport" role="tabpanel" hidden={activeSection !== 'transport'}>
          <div className="space-y-4">
            <p className="text-sm text-eco-muted">Tap a mode to add it, then set the distance.</p>
            {/* Mode selector */}
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map(opt => {
                const isAdded = transport.some(t => t.mode === opt.mode);
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => addTransportEntry(opt.mode)}
                    disabled={isAdded}
                    aria-label={`Add ${opt.label}`}
                    aria-pressed={isAdded}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isAdded
                        ? 'bg-eco-primary/20 text-eco-primary border border-eco-primary/30 opacity-60'
                        : 'bg-white/5 text-eco-muted border border-white/10 hover:border-eco-primary/30 hover:text-eco-text'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Added entries */}
            {transport.length === 0 ? (
              <div className="text-center py-8 text-eco-muted text-sm">
                <Car size={32} className="mx-auto mb-2 opacity-30" aria-hidden="true" />
                No transport logged — great for a low-carbon day!
              </div>
            ) : (
              <div className="space-y-3">
                {transport.map(entry => {
                  const opt = TRANSPORT_OPTIONS.find(o => o.mode === entry.mode)!;
                  return (
                    <div key={entry.mode} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <span className="text-xl">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{opt.label}</div>
                        <div className="text-xs text-eco-muted">{(entry.km * opt.factor).toFixed(2)} kg CO₂e</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateKm(entry.mode, entry.km - 5)}
                          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                          aria-label={`Decrease ${opt.label} km`}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          className="w-16 text-center bg-white/10 rounded-lg px-2 py-1 text-sm font-mono"
                          value={entry.km}
                          onChange={e => updateKm(entry.mode, parseFloat(e.target.value) || 0)}
                          min={0}
                          aria-label={`${opt.label} distance in km`}
                        />
                        <button
                          type="button"
                          onClick={() => updateKm(entry.mode, entry.km + 5)}
                          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                          aria-label={`Increase ${opt.label} km`}
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTransport(entry.mode)}
                          className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                          aria-label={`Remove ${opt.label}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Energy Panel */}
        <div id="panel-energy" role="tabpanel" hidden={activeSection !== 'energy'}>
          <div className="space-y-5">
            <div>
              <label htmlFor="electricity" className="block text-sm font-medium mb-2">
                ⚡ Electricity used today
                <span className="text-eco-primary font-bold ml-2">{electricityKwh} kWh</span>
              </label>
              <input
                id="electricity"
                type="range"
                min={0} max={50} step={0.5}
                className="slider-eco"
                value={electricityKwh}
                onChange={e => setElectricityKwh(parseFloat(e.target.value))}
                aria-describedby="electricity-hint"
              />
              <div className="flex justify-between text-xs text-eco-muted mt-1">
                <span>0 kWh</span><span>50 kWh</span>
              </div>
              <p id="electricity-hint" className="text-xs text-eco-muted mt-2">
                Tip: Average Indian household uses 3–5 kWh/day
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">🔥 Cooking fuel</label>
              <div className="flex gap-2 mb-3" role="radiogroup" aria-label="Fuel type">
                {(['none', 'lpg', 'png'] as FuelType[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={fuelType === f}
                    onClick={() => setFuelType(f)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      fuelType === f ? 'bg-eco-primary/20 text-eco-primary border border-eco-primary/30' : 'bg-white/5 text-eco-muted border border-white/10'
                    }`}
                  >
                    {f === 'none' ? 'None' : f === 'lpg' ? 'LPG 🟠' : 'PNG 🔵'}
                  </button>
                ))}
              </div>
              {fuelType !== 'none' && (
                <div>
                  <label htmlFor="fuel-amount" className="block text-sm font-medium text-eco-muted mb-2">
                    Amount: <span className="text-eco-primary font-bold">{fuelAmount} {fuelType === 'lpg' ? 'kg' : 'm³'}</span>
                  </label>
                  <input
                    id="fuel-amount"
                    type="range"
                    min={0} max={fuelType === 'lpg' ? 15 : 10} step={0.1}
                    className="slider-eco"
                    value={fuelAmount}
                    onChange={e => setFuelAmount(parseFloat(e.target.value))}
                    aria-label={`Fuel amount in ${fuelType === 'lpg' ? 'kg' : 'm³'}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diet Panel */}
        <div id="panel-diet" role="tabpanel" hidden={activeSection !== 'diet'}>
          <div className="space-y-3" role="radiogroup" aria-label="Diet type for today">
            {DIET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={dietType === opt.value}
                onClick={() => setDietType(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  dietType === opt.value
                    ? 'border-eco-primary bg-eco-primary/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{opt.label}</div>
                </div>
                {dietType === opt.value && <CheckCircle size={18} className="text-eco-primary" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        {/* Waste Panel */}
        <div id="panel-waste" role="tabpanel" hidden={activeSection !== 'waste'}>
          <div className="space-y-5">
            <div>
              <label htmlFor="waste" className="block text-sm font-medium mb-2">
                🗑️ Waste generated today
                <span className="text-eco-primary font-bold ml-2">{wasteKg} kg</span>
              </label>
              <input
                id="waste"
                type="range"
                min={0} max={10} step={0.1}
                className="slider-eco"
                value={wasteKg}
                onChange={e => setWasteKg(parseFloat(e.target.value))}
                aria-describedby="waste-hint"
              />
              <div className="flex justify-between text-xs text-eco-muted mt-1">
                <span>0 kg (zero waste!)</span><span>10 kg</span>
              </div>
              <p id="waste-hint" className="text-xs text-eco-muted mt-1">Average Indian generates ~0.4 kg/day</p>
            </div>

            <div>
              <button
                type="button"
                role="switch"
                aria-checked={composted}
                onClick={() => setComposted(c => !c)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  composted ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌿</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">Composted organic waste</div>
                    <div className="text-xs text-eco-muted">Saves ~0.4 kg CO₂e per kg vs. landfill</div>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors ${composted ? 'bg-eco-primary' : 'bg-white/20'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${composted ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>

            <div>
              <label htmlFor="water" className="block text-sm font-medium mb-2">
                💧 Water used today
                <span className="text-eco-primary font-bold ml-2">{waterLiters} L</span>
              </label>
              <input
                id="water"
                type="range"
                min={0} max={500} step={10}
                className="slider-eco"
                value={waterLiters}
                onChange={e => setWaterLiters(parseInt(e.target.value))}
                aria-describedby="water-hint"
              />
              <p id="water-hint" className="text-xs text-eco-muted mt-1">Average Indian uses ~135 L/day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="p-6 border-t border-white/10">
        <button
          type="button"
          onClick={handleSave}
          className="btn-eco w-full justify-center text-base py-4"
          aria-label="Save today's carbon footprint log"
        >
          <CheckCircle size={18} />
          Save Today's Log
        </button>
      </div>
    </div>
  );
}
