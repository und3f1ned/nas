import { useEffect } from 'react';
import { useWizardStore } from '../../store/wizard-store';
import { OptionCard } from '../ui/OptionCard';
import { HEAVY_DOCKER_SERVICES } from '../../utils/constants';

const DEFAULTS = { containerRange: '1-5' as const, heavyServices: [] as string[] };

export function StepDocker() {
  const { answers, setDocker } = useWizardStore();
  const data = answers.docker || DEFAULTS;

  useEffect(() => {
    if (!answers.docker) setDocker(DEFAULTS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (partial: Partial<typeof data>) => {
    setDocker({ ...data, ...partial });
  };

  const rangeOptions = [
    { value: '1-5' as const, icon: '📦', label: '1–5' },
    { value: '5-15' as const, icon: '📦📦', label: '5–15' },
    { value: '15+' as const, icon: '📦📦📦', label: '15+' },
  ];

  const toggleService = (id: string) => {
    const services = data.heavyServices.includes(id)
      ? data.heavyServices.filter((s) => s !== id)
      : [...data.heavyServices, id];
    update({ heavyServices: services });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">🐳 Docker / контейнеры</h3>
        <p className="text-sm text-text-secondary">
          Укажите планируемую нагрузку на Docker
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Количество контейнеров</label>
          <div className="grid grid-cols-3 gap-2">
            {rangeOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.containerRange === opt.value}
                onClick={() => update({ containerRange: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Тяжёлые сервисы</label>
          <div className="grid grid-cols-2 gap-2">
            {HEAVY_DOCKER_SERVICES.map((svc) => (
              <OptionCard
                key={svc.id}
                icon={data.heavyServices.includes(svc.id) ? '✅' : '⬜'}
                label={svc.label}
                selected={data.heavyServices.includes(svc.id)}
                onClick={() => toggleService(svc.id)}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
