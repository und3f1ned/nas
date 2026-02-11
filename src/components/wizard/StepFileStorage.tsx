import { useWizardStore } from '../../store/wizard-store';
import { Slider } from '../ui/Slider';
import { STORAGE_SIZES_TB, GROWTH_PERCENTS } from '../../utils/constants';

export function StepFileStorage() {
  const { answers, setFileStorage } = useWizardStore();
  const data = answers.fileStorage || { currentDataTB: 2, growthPercent: 50 };

  const storageOptions = STORAGE_SIZES_TB.map((v) => ({
    value: v,
    label: v < 1 ? `${v * 1024} ГБ` : `${v} ТБ`,
  }));

  const growthOptions = GROWTH_PERCENTS.map((v) => ({
    value: v,
    label: `${v}%`,
  }));

  const update = (partial: Partial<typeof data>) => {
    setFileStorage({ ...data, ...partial });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">📁 Файловое хранилище</h3>
        <p className="text-sm text-text-secondary">
          Укажите текущий объём данных и ожидаемый рост
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <Slider
          label="Текущий объём данных"
          value={data.currentDataTB}
          onChange={(v) => update({ currentDataTB: v })}
          min={0}
          max={0}
          options={storageOptions}
        />

        <Slider
          label="Ожидаемый рост за 3 года"
          value={data.growthPercent}
          onChange={(v) => update({ growthPercent: v })}
          min={0}
          max={0}
          options={growthOptions}
        />

        <div className="bg-bg-input rounded-lg p-3 text-xs text-text-muted">
          Итого через 3 года: ~{(data.currentDataTB * (1 + data.growthPercent / 100)).toFixed(1)} ТБ
        </div>
      </div>
    </div>
  );
}
