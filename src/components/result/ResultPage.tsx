import { motion } from 'framer-motion';
import { useWizardStore } from '../../store/wizard-store';
import { ConfigCard } from './ConfigCard';
import { StorageBreakdown } from './StorageBreakdown';
import { PriceTable } from './PriceTable';
import { SynologyComparison } from './SynologyComparison';
import { InsightsSection } from './InsightsSection';
import { ServicesList } from './ServicesList';
import { PdfExport } from './PdfExport';
import { Button } from '../ui/Button';
import { getShareUrl } from '../../utils/share';

export function ResultPage() {
  const { result, answers, setShowResult, reset } = useWizardStore();

  if (!result) {
    return (
      <div className="text-center py-12 text-text-muted">
        Нет данных для отображения. Пройдите опросник.
      </div>
    );
  }

  const handleShare = async () => {
    const url = getShareUrl(answers);
    try {
      await navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена!');
    } catch {
      prompt('Скопируйте ссылку:', url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <ConfigCard config={result} />
      <StorageBreakdown breakdown={result.storageBreakdown} />
      <PriceTable estimate={result.priceEstimate} />
      <SynologyComparison comparison={result.synologyComparison} />
      <InsightsSection insights={result.insights} />
      <ServicesList />

      <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-border">
        <PdfExport config={result} />
        <Button variant="secondary" onClick={handleShare}>
          Поделиться ссылкой
        </Button>
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
    </motion.div>
  );
}
