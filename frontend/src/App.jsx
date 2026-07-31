import { useState } from 'react';
import Header from './components/Header';
import PlotSetup from './components/PlotSetup';
import SubmissionFlow from './components/SubmissionFlow';
import ResultsView from './components/ResultsView';
import FeedbackModal from './components/FeedbackModal';

export default function App() {
  const [step, setStep] = useState('setup');
  const [activePlot, setActivePlot] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [soilInputs, setSoilInputs] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handlePlotCreated = (plot) => {
    setActivePlot(plot);
    setStep('submit');
  };

  const handleAnalysisComplete = (data) => {
    setActivePlot(data.plot);
    setCvResult(data.cvResult);
    setSoilInputs(data.soilInputs);
    setStep('results');
  };

  return (
    <div className="min-h-screen bg-[#090C0E] text-slate-100 font-sans flex flex-col selection:bg-[#D4F700]/30 selection:text-black">
      <div className="fixed inset-0 bg-grid pointer-events-none opacity-40" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-[#D4F700]/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-[#00F0FF]/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header currentStep={step} setStep={setStep} activePlot={activePlot} />

        <main className="flex-1 py-8">
          {step === 'setup' && (
            <div className="animate-fadeIn" key="setup">
              <PlotSetup onPlotCreated={handlePlotCreated} />
            </div>
          )}
          {step === 'submit' && (
            <div className="animate-slideUp" key="submit">
              <SubmissionFlow
                activePlot={activePlot}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          )}
          {step === 'results' && (
            <div className="animate-fadeIn" key="results">
              <ResultsView
                activePlot={activePlot}
                cvResult={cvResult}
                soilInputs={soilInputs}
                onOpenFeedback={() => setShowFeedbackModal(true)}
              />
            </div>
          )}
        </main>

        <footer className="relative border-t border-white/[0.03] bg-black/30 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span>KrishiForge AI v1.0</span>
            <span className="hidden sm:block">Regenerative Farming Intelligence Platform</span>
            <span>FastAPI · ViT · Ollama · ChromaDB</span>
          </div>
        </footer>
      </div>

      {showFeedbackModal && (
        <FeedbackModal
          planId={cvResult?.submission_id}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}