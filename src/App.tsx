import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWizardStore } from './store/wizard-store';
import { WizardContainer } from './components/wizard/WizardContainer';
import { ResultPage } from './components/result/ResultPage';
import { decodeAnswers, encodeAnswers } from './utils/share';
import { generateConfig } from './engine/configurator';
import './index.css';

function App() {
  const showResult = useWizardStore((s) => s.showResult);
  const answers = useWizardStore((s) => s.answers);

  // Restore config from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('config');
    if (!encoded) return;

    const decoded = decodeAnswers(encoded);
    if (!decoded || !decoded.useCases?.length) return;

    try {
      const result = generateConfig(decoded);
      const store = useWizardStore.getState();
      store.setUseCases(decoded.useCases);
      if (decoded.fileStorage) store.setFileStorage(decoded.fileStorage);
      if (decoded.media) store.setMedia(decoded.media);
      if (decoded.surveillance) store.setSurveillance(decoded.surveillance);
      if (decoded.docker) store.setDocker(decoded.docker);
      if (decoded.vm) store.setVM(decoded.vm);
      if (decoded.backup) store.setBackup(decoded.backup);
      if (decoded.business) store.setBusiness(decoded.business);
      store.setNetwork(decoded.network);
      store.setReliability(decoded.reliability);
      store.setFormFactor(decoded.formFactor);
      store.setBudget(decoded.budget);
      store.setResult(result);
    } catch {
      // Invalid config in URL — ignore, show wizard
    }
  }, []);

  // Sync URL with result page state
  useEffect(() => {
    if (showResult) {
      const encoded = encodeAnswers(answers);
      window.history.replaceState({}, '', `?config=${encoded}`);
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showResult, answers]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">NAS Конфигуратор</h1>
              <p className="text-xs text-text-muted">Xpenology / DSM</p>
            </div>
          </div>
          {showResult && (
            <button
              type="button"
              onClick={() => useWizardStore.getState().setShowResult(false)}
              className="text-sm text-text-secondary hover:text-accent transition-colors cursor-pointer"
            >
              ← Вернуться к опросу
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {showResult ? <ResultPage key="result" /> : <WizardContainer key="wizard" />}
        </AnimatePresence>
      </main>

      <footer className="border-t border-border mt-auto py-4">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-text-muted">
          NAS Конфигуратор на базе Xpenology (DSM 7.2) — подбор оптимальной конфигурации
        </div>
      </footer>
    </div>
  );
}

export default App;
