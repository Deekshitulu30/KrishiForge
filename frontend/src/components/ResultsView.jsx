import { useEffect, useState, useRef } from 'react';
import {
  ShieldAlert, CloudRain, Sparkles, Download, CheckCircle2,
  AlertTriangle, Cpu, DollarSign, Calendar, Loader2, Star, Zap,
  Thermometer, Droplets, Wind, Bug, Syringe, Leaf, TrendingUp
} from 'lucide-react';
import { fetchPlotWeather, generatePlanStreaming } from '../api';

export default function ResultsView({ activePlot, cvResult, soilInputs, onOpenFeedback }) {
  const [weatherData, setWeatherData] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planDone, setPlanDone] = useState(false);
  const [error, setError] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    if (!activePlot) return;

    setLoadingWeather(true);
    fetchPlotWeather(activePlot.id)
      .then((wData) => setWeatherData(wData.weather))
      .catch((err) => setError(err.message || 'Failed to fetch weather data'))
      .finally(() => setLoadingWeather(false));

    if (cvResult?.submission_id) {
      setLoadingPlan(true);
      setStreamBuffer('');
      setPlanData(null);
      setPlanDone(false);

      esRef.current = generatePlanStreaming(
        cvResult.submission_id,
        (token) => setStreamBuffer((prev) => prev + token),
        (savedPlanId) => {
          setPlanId(savedPlanId);
          setLoadingPlan(false);
          setPlanDone(true);
          setStreamBuffer((full) => {
            try {
              const parsed = JSON.parse(full);
              setPlanData(parsed);
            } catch {
              setError('Ollama returned invalid JSON. Check backend logs.');
            }
            return full;
          });
        },
        (errMsg) => {
          setError(errMsg);
          setLoadingPlan(false);
        }
      );
    }

    return () => {
      if (esRef.current) esRef.current.close();
    };
  }, [activePlot, cvResult]);

  const primaryDiagnosis = cvResult?.primary_diagnosis || 'Pending';
  const confidence = cvResult?.confidence || 0.0;
  const predictions = cvResult?.predictions || [];

  const handleDownloadPDF = () => {
    if (!planId) return;
    window.open(`http://127.0.0.1:8000/plan/${planId}/pdf`, '_blank');
  };

  const streamPercent = planDone ? 100 : streamBuffer
    ? Math.min(95, Math.round((streamBuffer.split('}').length / Math.max(streamBuffer.split('{').length, 1)) * 90))
    : 0;

  const getSeverityColor = (severity) => {
    const s = (severity || '').toLowerCase();
    if (s.includes('high') || s.includes('critical')) return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    if (s.includes('moderate') || s.includes('medium')) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  const getConfidenceColor = () => {
    if (confidence >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (confidence >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-6">
      <div className="text-center mb-4 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4F700]/10 border border-[#D4F700]/20 text-[#D4F700] text-[11px] font-mono tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" /> INTEGRATED DIAGNOSTIC REPORT
        </div>
        <h2 className="text-4xl md:text-5xl font-heading text-white leading-none mb-3">
          REGENERATIVE <span className="text-gradient">FARMING PLAN</span>
        </h2>
        <p className="text-sm text-slate-500">
          {activePlot?.crop_name} · {activePlot?.soil_type} · {activePlot?.area_acres} Acres
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-slideDown flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 justify-center animate-fadeIn">
        <button
          onClick={handleDownloadPDF}
          disabled={!planId}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4F700] to-[#b8d700] text-black text-xs font-semibold flex items-center gap-2 transition-all hover:brightness-110 shadow-lg glow-yellow disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          <Download className="w-4 h-4" /> Download PDF Report
        </button>
        <button
          onClick={onOpenFeedback}
          className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
        >
          <Star className="w-4 h-4 text-[#00F0FF]" /> Rate This Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-gradient p-5 space-y-4 animate-slideUp">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#D4F700]" /> Vision Diagnosis
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getConfidenceColor()}`}>
              {confidence}%
            </span>
          </div>
          <div className="flex items-start gap-4">
            {cvResult?.photo_path && (
              <img
                src={`http://127.0.0.1:8000/${cvResult.photo_path}`}
                alt="Leaf scan"
                className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow-md"
              />
            )}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="text-base font-bold text-white tracking-wide truncate">
                {primaryDiagnosis.replace(/_/g, ' ')}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block font-mono tracking-wider">TOP PREDICTIONS</span>
                {predictions.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                    <span className="text-slate-400 truncate mr-2">{p.label.replace(/_/g, ' ')}</span>
                    <span className="text-[#00F0FF] font-mono shrink-0">{p.confidence_percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-gradient p-5 space-y-4 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-[#00F0FF]" /> Weather & Risks
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Live</span>
          </div>
          {loadingWeather ? (
            <div className="flex items-center justify-center py-6 text-slate-500 gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#00F0FF]" /> Loading...
            </div>
          ) : weatherData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Temp', value: `${weatherData.current?.temperature_celsius}°C`, icon: Thermometer, color: 'text-rose-400' },
                  { label: 'Humidity', value: `${weatherData.current?.relative_humidity_percent}%`, icon: Droplets, color: 'text-[#00F0FF]' },
                  { label: '7d Rain', value: `${weatherData.forecast_7day?.total_precipitation_mm}mm`, icon: CloudRain, color: 'text-[#D4F700]' },
                ].map((item, i) => (
                  <div key={i} className="bg-black/30 p-3 rounded-xl border border-white/[0.04] text-center">
                    <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
                    <span className="text-[10px] text-slate-500 block font-mono">{item.label}</span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 block font-mono tracking-wider">RISK FLAGS</span>
                {weatherData.risk_flags?.length > 0 ? (
                  weatherData.risk_flags.map((r, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border text-[11px] flex items-start gap-2.5 ${getSeverityColor(r.severity)}`}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold font-mono">{r.risk_type}</span>
                        <span className="opacity-70"> — {r.reason}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All parameters within safe agronomic ranges.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">Weather data unavailable</p>
          )}
        </div>
      </div>

      <div className="card-gradient p-6 md:p-8 space-y-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
          <div>
            <h3 className="text-2xl font-heading text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4F700]" /> AI-GENERATED PLAN
            </h3>
            <p className="text-xs text-slate-500">
              Personalized for {activePlot?.crop_name} on {activePlot?.soil_type}
            </p>
          </div>
          {loadingPlan && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-[11px] text-[#D4F700] font-mono">
                <Zap className="w-3.5 h-3.5 animate-pulse" /> Generating...
              </div>
              <div className="w-32 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#D4F700] to-[#00F0FF] transition-all duration-300" style={{ width: `${streamPercent}%` }} />
              </div>
            </div>
          )}
        </div>

        {loadingPlan && streamBuffer && (
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.04] max-h-32 overflow-y-auto">
            <span className="text-[9px] text-slate-600 block font-mono mb-1 tracking-wider">LIVE STREAM</span>
            <pre className="text-[11px] text-[#00F0FF]/70 whitespace-pre-wrap break-all leading-relaxed font-mono">
              {streamBuffer.slice(-600)}
            </pre>
          </div>
        )}

        {planData ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#D4F700] font-mono tracking-wider uppercase">
                  <Bug className="w-3.5 h-3.5" /> Diagnosis
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{planData.diagnosis_summary}</p>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04] space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#00F0FF] font-mono tracking-wider uppercase">
                  <Wind className="w-3.5 h-3.5" /> Weather Impact
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{planData.weather_risk_summary}</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-3">
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Emergency Actions (24–48h)
              </h4>
              <ul className="space-y-1.5">
                {(Array.isArray(planData.immediate_actions) ? planData.immediate_actions : [planData.immediate_actions]).map((act, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60 mt-1.5 shrink-0" />
                    {act}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-black/30 border border-white/[0.04] space-y-3">
              <h4 className="text-xs font-bold text-[#00F0FF] flex items-center gap-2 uppercase tracking-wider">
                <Droplets className="w-3.5 h-3.5" /> Soil & Moisture Management
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{planData.soil_moisture_plan}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#D4F700] flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" /> 4-Week Regenerative Timeline
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planData.weekly_timeline?.map((wk, i) => (
                  <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/[0.04] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#D4F700] px-2 py-0.5 rounded-md bg-[#D4F700]/10">
                        W{wk.week || i + 1}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {(wk.actions || []).map((a, j) => (
                        <li key={j} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#D4F700]/40 mt-1.5 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04] space-y-2">
                <h4 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Syringe className="w-3.5 h-3.5" /> Bio-Inputs
                </h4>
                <ul className="space-y-1">
                  {(Array.isArray(planData.bio_inputs) ? planData.bio_inputs : [planData.bio_inputs]).map((b, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <Leaf className="w-3 h-3 text-emerald-400/60 mt-0.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04] space-y-2">
                <h4 className="text-[11px] font-bold text-[#00F0FF] flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5" /> Budget Estimate
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">{planData.budget_estimate}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-500 italic leading-relaxed">
              <span className="font-semibold text-slate-400 not-italic">Limitations: </span>
              {planData.confidence_notes}
            </div>
          </div>
        ) : !loadingPlan ? (
          <div className="text-center py-12 text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4F700] mx-auto" />
            <p className="text-sm">Connecting to Llama 3 (Ollama)...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}