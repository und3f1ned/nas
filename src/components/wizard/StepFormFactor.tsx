import { useWizardStore } from '../../store/wizard-store';
import { OptionCard } from '../ui/OptionCard';
import { shouldRecommendUPS } from '../../engine/component-selector';
import type { Placement, NoiseLevel, BayCount } from '../../types/wizard';

export function StepFormFactor() {
  const { answers, setFormFactor } = useWizardStore();
  const data = answers.formFactor;
  const recommendUPS = shouldRecommendUPS(answers);

  const update = (partial: Partial<typeof data>) => {
    setFormFactor({ ...data, ...partial });
  };

  const placementOptions: { value: Placement; icon: string; label: string }[] = [
    { value: 'home', icon: '🏠', label: 'Квартира / дом' },
    { value: 'server_room', icon: '🏢', label: 'Серверная' },
    { value: 'rack', icon: '🗄️', label: 'Стойка 19"' },
  ];

  const noiseOptions: { value: NoiseLevel; icon: string; label: string }[] = [
    { value: 'quiet', icon: '🤫', label: 'Тихий (важно)' },
    { value: 'normal', icon: '🔊', label: 'Не критично' },
  ];

  const bayOptions: { value: BayCount; label: string }[] = [
    { value: 'auto', label: 'Подберите' },
    { value: 2, label: '2 слота' },
    { value: 4, label: '4 слота' },
    { value: 6, label: '6 слотов' },
    { value: 8, label: '8 слотов' },
    { value: 12, label: '12 слотов' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Форм-фактор и размещение</h2>
        <p className="text-sm text-text-secondary">
          Где будет стоять NAS, корпус и питание
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Размещение</label>
          <div className="grid grid-cols-3 gap-2">
            {placementOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.placement === opt.value}
                onClick={() => update({ placement: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Уровень шума</label>
          <div className="grid grid-cols-2 gap-2">
            {noiseOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.noiseLevel === opt.value}
                onClick={() => update({ noiseLevel: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Количество HDD-слотов</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {bayOptions.map((opt) => (
              <OptionCard
                key={String(opt.value)}
                icon={opt.value === 'auto' ? '🤖' : '💽'}
                label={opt.label}
                selected={data.bayCount === opt.value}
                onClick={() => update({ bayCount: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update({ needUps: !data.needUps })}
            className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
              data.needUps ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                data.needUps ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <div>
            <span className="text-sm text-text-primary">ИБП (UPS)</span>
            {recommendUPS && !data.needUps && (
              <p className="text-xs text-accent-light">Рекомендуется для бизнеса / видеонаблюдения</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
