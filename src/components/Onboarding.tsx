import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { UserProfile } from '../types';
import { Leaf, Car, Utensils, Zap, ChevronRight, ChevronLeft, User } from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome to EcoPulse', icon: Leaf },
  { id: 'personal', title: 'About You', icon: User },
  { id: 'commute', title: 'Your Commute', icon: Car },
  { id: 'lifestyle', title: 'Diet & Energy', icon: Utensils },
  { id: 'goal', title: 'Set Your Goal', icon: Zap },
];

type CommuteType = UserProfile['primaryCommute'];
type DietType = UserProfile['dietType'];

export default function Onboarding() {
  const { saveProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    region: 'IN',
    householdSize: 3,
    primaryCommute: 'car' as CommuteType,
    dietType: 'average' as DietType,
    electricityFactorOverride: undefined as number | undefined,
    weeklyGoalPercent: 10,
  });

  const updateForm = (key: string, value: string | number | undefined) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const profile: UserProfile = {
      ...form,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
  };

  const commuteOptions: { value: CommuteType; label: string; icon: string; desc: string }[] = [
    { value: 'car', label: 'Car / Bike', icon: '🚗', desc: 'Petrol, diesel, or motorbike' },
    { value: 'publicTransport', label: 'Public Transit', icon: '🚇', desc: 'Metro, bus, or train' },
    { value: 'walkCycle', label: 'Walk / Cycle', icon: '🚲', desc: 'Zero-emission commute' },
    { value: 'bike', label: 'Motorbike', icon: '🏍️', desc: 'Two-wheeler' },
  ];

  const dietOptions: { value: DietType; label: string; icon: string; co2: string }[] = [
    { value: 'heavyMeat', label: 'Heavy Meat', icon: '🥩', co2: '3.3 kg CO₂e/day' },
    { value: 'average', label: 'Mixed / Average', icon: '🍽️', co2: '2.5 kg CO₂e/day' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥦', co2: '1.7 kg CO₂e/day' },
    { value: 'vegan', label: 'Vegan', icon: '🌱', co2: '1.5 kg CO₂e/day' },
  ];

  const renderStep = () => {
    switch (step) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-eco-primary/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-eco-primary/30" />
              <span className="text-5xl relative z-10">🌍</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold gradient-text mb-3">Track Your Carbon Footprint</h2>
              <p className="text-eco-muted text-lg leading-relaxed max-w-md mx-auto">
                In under 30 seconds a day, discover which habits matter most and get one powerful, personalized action from EcoBuddy — your AI climate companion.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { icon: '⚡', label: '30-second daily log' },
                { icon: '🤖', label: 'AI-powered tips' },
                { icon: '🔒', label: '100% private, on-device' },
              ].map(item => (
                <div key={item.label} className="glass-card p-3 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs text-eco-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1: // Personal
        return (
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-eco-muted mb-2">
                Your name (optional)
              </label>
              <input
                id="name"
                type="text"
                className="input-eco"
                placeholder="e.g., Riya"
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
                aria-describedby="name-hint"
              />
              <p id="name-hint" className="text-xs text-eco-muted mt-1">Used to personalize EcoBuddy messages</p>
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-eco-muted mb-2">
                Country / Region
              </label>
              <select
                id="region"
                className="select-eco"
                value={form.region}
                onChange={e => updateForm('region', e.target.value)}
              >
                <option value="IN">🇮🇳 India (default)</option>
                <option value="US">🇺🇸 United States</option>
                <option value="UK">🇬🇧 United Kingdom</option>
                <option value="EU">🇪🇺 Europe</option>
                <option value="OTHER">🌍 Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="household" className="block text-sm font-medium text-eco-muted mb-2">
                Household size: <span className="text-eco-primary font-bold">{form.householdSize} {form.householdSize === 1 ? 'person' : 'people'}</span>
              </label>
              <input
                id="household"
                type="range"
                min={1} max={10} step={1}
                className="slider-eco"
                value={form.householdSize}
                onChange={e => updateForm('householdSize', parseInt(e.target.value))}
                aria-describedby="household-hint"
              />
              <div className="flex justify-between text-xs text-eco-muted mt-1">
                <span>Just me</span>
                <span>Large family (10)</span>
              </div>
              <p id="household-hint" className="sr-only">Slide to set household size from 1 to 10</p>
            </div>
          </div>
        );

      case 2: // Commute
        return (
          <div className="space-y-4">
            <p className="text-eco-muted text-sm">What's your primary way of getting around?</p>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Primary commute mode">
              {commuteOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={form.primaryCommute === opt.value}
                  onClick={() => updateForm('primaryCommute', opt.value)}
                  className={`glass-card p-4 text-left transition-all duration-200 border-2 ${
                    form.primaryCommute === opt.value
                      ? 'border-eco-primary bg-eco-primary/10'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-eco-muted mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3: // Lifestyle
        return (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-eco-muted mb-3">Typical diet type</p>
              <div className="space-y-2" role="radiogroup" aria-label="Diet type">
                {dietOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={form.dietType === opt.value}
                    onClick={() => updateForm('dietType', opt.value)}
                    className={`w-full glass-card p-3 flex items-center gap-3 transition-all duration-200 border-2 ${
                      form.dietType === opt.value
                        ? 'border-eco-primary bg-eco-primary/10'
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{opt.label}</div>
                    </div>
                    <div className="text-xs text-eco-muted">{opt.co2}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="elec-factor" className="block text-sm font-medium text-eco-muted mb-2">
                Electricity grid factor (optional)
              </label>
              <input
                id="elec-factor"
                type="number"
                className="input-eco"
                placeholder="Default: 0.82 kg CO₂e/kWh (India)"
                min={0} max={3} step={0.01}
                value={form.electricityFactorOverride ?? ''}
                onChange={e => updateForm('electricityFactorOverride', e.target.value ? parseFloat(e.target.value) : undefined)}
                aria-describedby="elec-hint"
              />
              <p id="elec-hint" className="text-xs text-eco-muted mt-1">Leave blank to use India CEA average (0.82 kg CO₂e/kWh)</p>
            </div>
          </div>
        );

      case 4: // Goal
        return (
          <div className="space-y-6 text-center">
            <div>
              <p className="text-eco-muted mb-4">Set a weekly emission reduction goal to unlock progress tracking and badges.</p>
              <div className="glass-card p-6 space-y-4">
                <div className="text-5xl font-black gradient-text">
                  {form.weeklyGoalPercent}%
                </div>
                <p className="text-eco-muted text-sm">Weekly reduction target</p>
                <input
                  type="range"
                  min={5} max={50} step={5}
                  className="slider-eco"
                  value={form.weeklyGoalPercent}
                  onChange={e => updateForm('weeklyGoalPercent', parseInt(e.target.value))}
                  aria-label={`Weekly reduction goal: ${form.weeklyGoalPercent}%`}
                />
                <div className="flex justify-between text-xs text-eco-muted">
                  <span>5% (gradual)</span>
                  <span>50% (ambitious)</span>
                </div>
              </div>
            </div>
            <div className="glass-card p-4 text-left space-y-2">
              <p className="text-xs font-medium text-eco-muted uppercase tracking-wider">You'll earn badges for</p>
              {['3-day logging streak', 'Meat-free day', 'Zero waste day', 'Weekly goal met'].map(b => (
                <div key={b} className="flex items-center gap-2 text-sm">
                  <span className="text-eco-primary">✓</span>
                  <span className="text-eco-text">{b}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-eco flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-eco-primary/10 -top-32 -left-32" style={{ animationDelay: '0s' }} aria-hidden="true" />
      <div className="orb w-64 h-64 bg-eco-accent/10 bottom-0 right-0" style={{ animationDelay: '3s' }} aria-hidden="true" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-eco-muted font-medium">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs text-eco-muted">{STEPS[step].title}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((step + 1) / STEPS.length) * 100}%`,
                background: 'linear-gradient(90deg, #00D4A0, #00B4D8)',
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-8 animate-slide-up">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-eco-text mb-1">{STEPS[step].title}</h1>
          </div>

          <div className="min-h-[280px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="btn-ghost"
                aria-label="Go to previous step"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="btn-eco"
                aria-label={`Continue to ${STEPS[step + 1].title}`}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-eco"
                aria-label="Complete setup and start tracking"
              >
                Start Tracking 🌱
              </button>
            )}
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Setup progress">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}: ${s.title}`}
              onClick={() => i < step && setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-eco-primary' : i < step ? 'w-2 bg-eco-primary/50' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
