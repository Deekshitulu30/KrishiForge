import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Droplets, Calendar, FileText, ArrowRight, ImageIcon, X } from 'lucide-react';
import { analyzeImage } from '../api';

export default function SubmissionFlow({ activePlot, onAnalysisComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(40);
  const [lastIrrigationDate, setLastIrrigationDate] = useState('2026-07-25');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const acceptFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP)');
      return;
    }
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleFileChange = (e) => acceptFile(e.target.files[0]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const clearImage = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload a leaf or crop photo for disease diagnosis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cvResult = await analyzeImage(selectedFile);
      onAnalysisComplete({
        plot: activePlot,
        cvResult,
        soilInputs: {
          soilMoisturePercent: parseFloat(soilMoisture),
          lastIrrigationDate,
          notes,
        },
      });
    } catch (err) {
      setError(err.message || 'CV Analysis failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const moistureColor = soilMoisture < 30 ? '#F43F5E' : soilMoisture < 60 ? '#D4F700' : '#00F0FF';

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="text-center mb-8 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-[11px] font-mono tracking-wider mb-4">
          <Camera className="w-3.5 h-3.5" /> STEP 2 — CROP DIAGNOSIS
        </div>
        <h2 className="text-4xl md:text-5xl font-heading text-white leading-none mb-3">
          FIELD <span className="text-gradient">OBSERVATION</span>
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Upload a clear photo of the symptomatic leaf, then enter soil moisture and irrigation data.
        </p>
      </div>

      {activePlot && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 animate-slideDown">
          <SproutIcon />
          Diagnosing <span className="text-white font-medium">{activePlot.crop_name}</span> on{' '}
          <span className="text-[#00F0FF]">{activePlot.soil_type}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">{activePlot.area_acres} acres</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-slideDown flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 animate-slideUp">
        <div className="card-gradient p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <Camera className="w-4 h-4 text-[#D4F700]" />
            <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Crop / Leaf Photo</span>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
              isDragOver
                ? 'border-[#D4F700] bg-[#D4F700]/5 scale-[1.01]'
                : 'border-white/[0.08] bg-black/20 hover:border-[#D4F700]/40 hover:bg-[#D4F700]/[0.02]'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Uploaded leaf"
                    className="max-h-48 rounded-xl border border-white/10 shadow-lg object-cover transition-all group-hover:brightness-110"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-500/90 text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-[#D4F700]/10 text-[#D4F700] font-mono">
                    ✓ Uploaded
                  </span>
                  <span className="text-slate-500">
                    {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <span className="text-[10px] text-slate-600">Click or drag to replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 pointer-events-none">
                <div className={`p-4 rounded-2xl transition-all ${
                  isDragOver
                    ? 'bg-[#D4F700]/20 scale-110'
                    : 'bg-[#D4F700]/5'
                }`}>
                  {isDragOver ? (
                    <Camera className="w-10 h-10 text-[#D4F700]" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-[#D4F700]/60" />
                  )}
                </div>
                {isDragOver ? (
                  <p className="text-sm font-semibold text-[#D4F700]">Release to analyze</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-300">Drop leaf photo here or click to browse</p>
                    <p className="text-[11px] text-slate-500">JPEG, PNG, WebP — PlantVillage disease diagnosis</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card-gradient p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <Droplets className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Sensor & Irrigation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium text-slate-400">Soil Moisture</label>
                <span className="text-sm font-mono font-bold" style={{ color: moistureColor }}>
                  {soilMoisture}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(e.target.value)}
                className="w-full"
                style={{ accentColor: moistureColor }}
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Dry</span>
                <span>Optimal</span>
                <span>Saturated</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#D4F700]" /> Last Irrigation
              </label>
              <input
                type="date"
                value={lastIrrigationDate}
                onChange={(e) => setLastIrrigationDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>

        <div className="card-gradient p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">Field Notes</span>
          </div>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Yellowing spots observed on lower foliage after heavy rain..."
            className="input-field w-full resize-none"
          />
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
              Running Swin Transformer Inference...
            </span>
          ) : (
            <>
              Analyze & Fetch Weather Risks
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function SproutIcon() {
  return (
    <svg className="w-4 h-4 text-[#D4F700] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v8m0 0a4 4 0 00-4 4v2a4 4 0 008 0v-2a4 4 0 00-4-4zm0 0V2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 15.5a7.5 7.5 0 0113 0" />
    </svg>
  );
}