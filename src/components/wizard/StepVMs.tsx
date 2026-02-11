import { useWizardStore } from '../../store/wizard-store';
import { Slider } from '../ui/Slider';
import { OptionCard } from '../ui/OptionCard';

export function StepVMs() {
  const { answers, setVM } = useWizardStore();
  const data = answers.vm || { count: 2, purpose: 'dev' as const };

  const update = (partial: Partial<typeof data>) => {
    setVM({ ...data, ...partial });
  };

  const purposeOptions = [
    { value: 'dev' as const, icon: '🧪', label: 'Тест / разработка', desc: 'Легче требования' },
    { value: 'production' as const, icon: '🏭', label: 'Продакшн', desc: 'Максимум ресурсов' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">🖥️ Виртуальные машины</h3>
        <p className="text-sm text-text-secondary">
          Virtual Machine Manager — виртуализация на NAS
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <Slider
          label="Количество VM"
          value={data.count}
          onChange={(v) => update({ count: v })}
          min={1}
          max={10}
          step={1}
        />

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Назначение</label>
          <div className="grid grid-cols-2 gap-2">
            {purposeOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.desc}
                selected={data.purpose === opt.value}
                onClick={() => update({ purpose: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
          ⚠️ VM требуют значительных ресурсов: ~4 ГБ RAM и выделенные ядра CPU на каждую VM.
          NVMe-кэш настоятельно рекомендуется.
        </div>
      </div>
    </div>
  );
}
