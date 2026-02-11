import { useWizardStore } from '../../store/wizard-store';
import { OptionCard } from '../ui/OptionCard';
import { USE_CASE_INFO } from '../../utils/constants';
import type { UseCase } from '../../types/wizard';

const USE_CASES: UseCase[] = ['file_storage', 'media', 'surveillance', 'docker', 'vm', 'backup', 'business'];

export function StepUseCases() {
  const { answers, setUseCases } = useWizardStore();
  const selected = answers.useCases;

  const toggle = (uc: UseCase) => {
    if (selected.includes(uc)) {
      setUseCases(selected.filter((s) => s !== uc));
    } else {
      setUseCases([...selected, uc]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Для чего вам NAS?</h2>
        <p className="text-sm text-text-secondary">
          Выберите все подходящие сценарии использования. Это определит базовые требования к железу.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {USE_CASES.map((uc) => {
          const info = USE_CASE_INFO[uc];
          return (
            <OptionCard
              key={uc}
              icon={info.icon}
              label={info.label}
              description={info.description}
              selected={selected.includes(uc)}
              onClick={() => toggle(uc)}
            />
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-sm text-warning text-center">
          Выберите хотя бы один сценарий использования
        </p>
      )}
    </div>
  );
}
