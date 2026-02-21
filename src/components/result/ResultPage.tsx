import { useMemo } from 'react';
import { useWizardStore } from '../../store/wizard-store';
import { ConfigCard } from './ConfigCard';
import { StorageBreakdown } from './StorageBreakdown';
import { PriceTable } from './PriceTable';
import { InsightsSection } from './InsightsSection';
import { SynologyComparison } from './SynologyComparison';
import { PdfExport } from './PdfExport';
import { Button } from '../ui/Button';
import { generateSynologyComparison } from '../../engine/synology-comparison';

export function ResultPage() {
  const { result, answers, setShowResult, reset } = useWizardStore();

  const synologyComparison = useMemo(() => {
    if (!result) return null;
    return generateSynologyComparison(result, answers);
  }, [result, answers]);

  if (!result) {
    return (
      <div className="text-center py-12 text-text-muted">
        Нет данных для отображения. Пройдите опросник.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfigCard config={result} />
      <StorageBreakdown breakdown={result.storageBreakdown} />
      <PriceTable estimate={result.priceEstimate} />
      {synologyComparison && <SynologyComparison comparison={synologyComparison} />}
      <InsightsSection insights={result.insights} />

      <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-border no-print">
        <PdfExport config={result} />
        <Button
          variant="ghost"
          onClick={() => setShowResult(false)}
        >
          Изменить параметры
        </Button>
        <Button
          variant="ghost"
          onClick={reset}
        >
          Начать заново
        </Button>
      </div>
    </div>
  );
}
