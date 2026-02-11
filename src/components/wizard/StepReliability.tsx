import { useWizardStore } from '../../store/wizard-store';
import { OptionCard } from '../ui/OptionCard';
import { shouldRecommendSSDCache, shouldRecommendUPS } from '../../engine/component-selector';
import type { RaidType, DataCriticality } from '../../types/wizard';

export function StepReliability() {
  const { answers, setReliability } = useWizardStore();
  const data = answers.reliability;

  const update = (partial: Partial<typeof data>) => {
    setReliability({ ...data, ...partial });
  };

  const raidOptions: { value: RaidType; label: string; desc: string }[] = [
    { value: 'auto', label: 'Автоподбор', desc: 'Рекомендация по вашим задачам' },
    { value: 'shr', label: 'SHR', desc: 'Гибкий, для большинства' },
    { value: 'shr-2', label: 'SHR-2', desc: 'Двойная защита (≥4 дисков)' },
    { value: 'raid1', label: 'RAID 1', desc: 'Зеркало для 2 дисков' },
  ];

  const critOptions: { value: DataCriticality; icon: string; label: string; desc: string }[] = [
    { value: 'low', icon: '🟢', label: 'Низкая', desc: 'Можно восстановить' },
    { value: 'medium', icon: '🟡', label: 'Средняя', desc: 'Нежелательна потеря' },
    { value: 'high', icon: '🟠', label: 'Высокая', desc: 'Критичные данные' },
    { value: 'mission_critical', icon: '🔴', label: 'Максимальная', desc: 'Потеря недопустима' },
  ];

  const recommendSSD = shouldRecommendSSDCache(answers);
  const recommendUPS = shouldRecommendUPS(answers);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Надёжность и защита данных</h2>
        <p className="text-sm text-text-secondary">
          Уровень RAID, кэширование и бесперебойное питание
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Уровень RAID</label>
          <div className="grid grid-cols-2 gap-2">
            {raidOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.value === 'auto' ? '🤖' : '💽'}
                label={opt.label}
                description={opt.desc}
                selected={data.raidType === opt.value}
                onClick={() => update({ raidType: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Критичность данных</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {critOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.desc}
                selected={data.criticality === opt.value}
                onClick={() => update({ criticality: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update({ ssdCache: !data.ssdCache })}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                data.ssdCache ? 'bg-accent' : 'bg-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  data.ssdCache ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <span className="text-sm text-text-primary">SSD-кэш (NVMe)</span>
              {recommendSSD && !data.ssdCache && (
                <p className="text-xs text-accent-light">Рекомендуется для ваших задач</p>
              )}
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
    </div>
  );
}
