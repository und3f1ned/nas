import { useWizardStore } from '../../store/wizard-store';
import { StepFileStorage } from './StepFileStorage';
import { StepMedia } from './StepMedia';
import { StepSurveillance } from './StepSurveillance';
import { StepDocker } from './StepDocker';
import { StepVMs } from './StepVMs';
import { StepBackup } from './StepBackup';
import { StepBusiness } from './StepBusiness';
import type { UseCase } from '../../types/wizard';

const DETAIL_COMPONENTS: Record<UseCase, React.FC> = {
  file_storage: StepFileStorage,
  media: StepMedia,
  surveillance: StepSurveillance,
  docker: StepDocker,
  vm: StepVMs,
  backup: StepBackup,
  business: StepBusiness,
};

export function StepDetails() {
  const { answers, currentDetailIndex } = useWizardStore();
  const useCases = answers.useCases;

  if (useCases.length === 0) {
    return (
      <div className="text-center text-text-muted py-12">
        Вернитесь назад и выберите хотя бы один сценарий использования
      </div>
    );
  }

  const currentUseCase = useCases[currentDetailIndex] || useCases[0];
  const Component = DETAIL_COMPONENTS[currentUseCase];

  return (
    <div className="space-y-4">
      {useCases.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {useCases.map((uc, idx) => (
            <span
              key={uc}
              className={`px-3 py-1 rounded-full text-xs ${
                idx === currentDetailIndex
                  ? 'bg-accent text-white'
                  : idx < currentDetailIndex
                  ? 'bg-success/20 text-success'
                  : 'bg-bg-card text-text-muted'
              }`}
            >
              {idx + 1}/{useCases.length}
            </span>
          ))}
        </div>
      )}
      <Component />
    </div>
  );
}
