import { useEffect, useState } from 'react';
import { Sprout, Check, Circle } from 'lucide-react';
import { fetchHealth } from '../api';

const STEPS = [
  { key: 'setup', label: 'Farm Setup', number: 1 },
  { key: 'submit', label: 'Crop Diagnosis', number: 2 },
  { key: 'results', label: 'Regenerative Plan', number: 3 },
];

export default function Header({ currentStep, setStep, activePlot }) {
  const [health, setHealth] = useState({ status: 'checking' });

  useEffect(() => {
    async function checkBackend() {
      try {
        await fetchHealth();
        setHealth({ status: 'connected' });
      } catch {
        setHealth({ status: 'offline' });
      }
    }
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <header className="sticky top-0 z-50 bg-[#090C0E]/90 backdrop-blur-2xl border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#D4F700]/20 to-[#00F0FF]/10 border border-[#D4F700]/20">
              <Sprout className="w-5 h-5 text-[#D4F700]" />
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4F700] animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-xl tracking-wider text-white font-heading leading-none">
              KRISHI<span className="text-gradient">FORGE</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">REGENERATIVE FARMING AI</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-0">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.key;
            const isPast = currentIdx > idx;
            const isClickable = isPast || (step.key === 'submit' && activePlot) || (step.key === 'results' && activePlot);

            return (
              <div key={step.key} className="flex items-center">
                {idx > 0 && (
                  <div className={`w-8 h-px transition-colors duration-300 ${isPast ? 'bg-[#D4F700]/40' : 'bg-white/[0.06]'}`} />
                )}
                <button
                  onClick={() => isClickable && setStep(step.key)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium ${
                    isActive
                      ? 'bg-[#D4F700]/10 text-[#D4F700] border border-[#D4F700]/20'
                      : isPast
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isPast ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Circle className={`w-3.5 h-3.5 ${isActive ? 'fill-[#D4F700]/30 text-[#D4F700]' : ''}`} />
                  )}
                  <span className="hidden lg:inline">{step.label}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {activePlot && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
              <span className="text-slate-400">{activePlot.crop_name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-[#00F0FF]/80">{activePlot.soil_type.split(' ')[0]}</span>
            </div>
          )}

          <div className={`flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors ${
            health.status === 'connected'
              ? 'bg-emerald-500/5 border-emerald-500/15'
              : 'bg-rose-500/5 border-rose-500/15'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              health.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`} />
            <span className={health.status === 'connected' ? 'text-emerald-400/80' : 'text-rose-400/80'}>
              {health.status === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="md:hidden px-6 pb-3">
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.key;
            const isPast = currentIdx > idx;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4F700] to-[#00F0FF]'
                    : isPast
                    ? 'bg-[#D4F700]/30'
                    : 'bg-white/[0.06]'
                }`} />
                {idx < STEPS.length - 1 && <div className="w-1" />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          {STEPS.map((step) => (
            <span key={step.key} className={`text-[10px] font-mono transition-colors ${
              currentStep === step.key ? 'text-[#D4F700]' : 'text-slate-600'
            }`}>
              {step.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}