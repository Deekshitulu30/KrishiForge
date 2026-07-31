import { useState } from 'react';
import { MapPin, User, Compass, Layers, Maximize2, ArrowRight, Sprout, Ruler } from 'lucide-react';
import { createFarmer, createFarmPlot } from '../api';

const LOCATION_PRESETS = [
  { name: 'Telangana / Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Punjab / Ludhiana', lat: 30.9010, lon: 75.8573 },
  { name: 'Maharashtra / Nashik', lat: 20.0059, lon: 73.7898 },
  { name: 'Karnataka / Mandya', lat: 12.5218, lon: 76.8951 },
];

const SOIL_TYPES = [
  'Black Cotton Soil',
  'Red Clay Loam',
  'Sandy Loam',
  'Alluvial Soil',
  'Laterite Soil',
  'Silt Loam',
];

const CROPS = [
  'Tomato',
  'Potato',
  'Corn / Maize',
  'Pepper Bell',
  'Grape',
  'Apple',
  'Squash',
  'Strawberry',
];

const SOIL_EMOJIS = {
  'Black Cotton Soil': '🖤',
  'Red Clay Loam': '🟤',
  'Sandy Loam': '🏜️',
  'Alluvial Soil': '🌾',
  'Laterite Soil': '⛰️',
  'Silt Loam': '🌊',
};

export default function PlotSetup({ onPlotCreated }) {
  const [farmerName, setFarmerName] = useState('');
  const [phone, setPhone] = useState('');
  const [cropName, setCropName] = useState('Tomato');
  const [soilType, setSoilType] = useState('Black Cotton Soil');
  const [areaAcres, setAreaAcres] = useState(2.0);
  const [latitude, setLatitude] = useState(17.3850);
  const [longitude, setLongitude] = useState(78.4867);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const farmer = await createFarmer(farmerName || 'Ramesh Kumar', phone || '9876543210');
      const plot = await createFarmPlot({
        farmer_id: farmer.id,
        crop_name: cropName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        soil_type: soilType,
        area_acres: parseFloat(areaAcres),
      });
      onPlotCreated(plot);
    } catch (err) {
      setError(err.message || 'Failed to initialize farm plot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="text-center mb-8 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4F700]/10 border border-[#D4F700]/20 text-[#D4F700] text-[11px] font-mono tracking-wider mb-4">
          <Compass className="w-3.5 h-3.5" /> STEP 1 — FARM SETUP
        </div>
        <h2 className="text-4xl md:text-5xl font-heading text-white leading-none mb-3">
          CONFIGURE <span className="text-gradient">YOUR PLOT</span>
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Set up your farm location, crop type, and soil parameters. All agronomic intelligence is calibrated to these exact inputs.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-slideDown flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 animate-slideUp">
        <div className="card-gradient p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <User className="w-4 h-4 text-[#D4F700]" />
            <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Farmer Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        <div className="card-gradient p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <Sprout className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Crop & Soil Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#D4F700]" /> Primary Crop
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="select-field w-full"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Soil Type</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="select-field w-full"
              >
                {SOIL_TYPES.map((s) => (
                  <option key={s} value={s}>{SOIL_EMOJIS[s]} {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Ruler className="w-3 h-3 text-[#00F0FF]" /> Area (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={areaAcres}
                onChange={(e) => setAreaAcres(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        <div className="card-gradient p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <MapPin className="w-4 h-4 text-[#D4F700]" />
            <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Location Coordinates</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {LOCATION_PRESETS.map((p) => (
              <button
                type="button"
                key={p.name}
                onClick={() => { setLatitude(p.lat); setLongitude(p.lon); }}
                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${
                  latitude === p.lat && longitude === p.lon
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF] font-medium'
                    : 'bg-black/30 border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/20'
                }`}
              >
                📍 {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">LATITUDE</label>
              <input
                type="number"
                step="0.0001"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-1">LONGITUDE</label>
              <input
                type="number"
                step="0.0001"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4F700] to-[#b8d700] text-black font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg glow-yellow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Farm Plot...
            </span>
          ) : (
            <>
              Initialize Farm & Begin Diagnosis
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}