import { useWizardStore } from '../../store/wizard-store';
import { Slider } from '../ui/Slider';
import { OptionCard } from '../ui/OptionCard';
import { FPS_OPTIONS, STORAGE_DAYS_OPTIONS } from '../../utils/constants';
import { calcSurveillanceStorageTB } from '../../engine/surveillance-calculator';
import { formatTB } from '../../utils/formatters';
import type { Resolution, Codec } from '../../types/wizard';

export function StepSurveillance() {
  const { answers, setSurveillance } = useWizardStore();
  const data = answers.surveillance || {
    cameras: 4,
    resolution: '1080p' as Resolution,
    fps: 15,
    codec: 'h265' as Codec,
    storageDays: 30,
    motionOnly: false,
  };

  const update = (partial: Partial<typeof data>) => {
    setSurveillance({ ...data, ...partial });
  };

  const storageTB = calcSurveillanceStorageTB({
    cameras: data.cameras,
    resolution: data.resolution,
    fps: data.fps,
    codec: data.codec,
    days: data.storageDays,
    motionOnly: data.motionOnly,
  });

  const resOptions: { value: Resolution; icon: string; label: string }[] = [
    { value: '1080p', icon: '📺', label: '1080p' },
    { value: '2k', icon: '📹', label: '2K (QHD)' },
    { value: '4k', icon: '🎥', label: '4K (UHD)' },
  ];

  const codecOptions: { value: Codec; icon: string; label: string; desc: string }[] = [
    { value: 'h264', icon: '📦', label: 'H.264', desc: 'Совместим со всем' },
    { value: 'h265', icon: '📦', label: 'H.265', desc: '×2 эффективнее' },
    { value: 'h265plus', icon: '📦', label: 'H.265+', desc: '×3 эффективнее' },
  ];

  const fpsOptions = FPS_OPTIONS.map((v) => ({ value: v, label: `${v} FPS` }));
  const daysOptions = STORAGE_DAYS_OPTIONS.map((v) => ({ value: v, label: `${v} дн.` }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">📹 Видеонаблюдение</h3>
        <p className="text-sm text-text-secondary">
          Настройте параметры IP-камер для Surveillance Station
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <Slider
          label="Количество камер"
          value={data.cameras}
          onChange={(v) => update({ cameras: v })}
          min={1}
          max={64}
          step={1}
        />

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Разрешение камер</label>
          <div className="grid grid-cols-3 gap-2">
            {resOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.resolution === opt.value}
                onClick={() => update({ resolution: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Кодек</label>
          <div className="grid grid-cols-3 gap-2">
            {codecOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.desc}
                selected={data.codec === opt.value}
                onClick={() => update({ codec: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <Slider
          label="FPS записи"
          value={data.fps}
          onChange={(v) => update({ fps: v })}
          min={0}
          max={0}
          options={fpsOptions}
        />

        <Slider
          label="Глубина хранения"
          value={data.storageDays}
          onChange={(v) => update({ storageDays: v })}
          min={0}
          max={0}
          options={daysOptions}
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update({ motionOnly: !data.motionOnly })}
            className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
              data.motionOnly ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                data.motionOnly ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-text-secondary">
            Только по движению (экономия ~60% места)
          </span>
        </div>

        <div className="bg-bg-input rounded-lg p-4 space-y-2">
          <div className="text-sm font-medium text-text-primary">
            Расчёт: ~{formatTB(storageTB)} для {data.cameras} камер на {data.storageDays} дней
          </div>
          <div className="text-xs text-text-muted">
            {data.cameras} камер × {data.resolution} × {data.fps} FPS × {data.codec.toUpperCase()} × {data.storageDays} дн.
            {data.motionOnly ? ' × запись по движению' : ' × постоянная запись'}
          </div>
        </div>

        <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-xs text-success">
          💡 На Xpenology — безлимитные лицензии Surveillance Station. На оригинальном Synology каждая камера сверх 2-х стоит ~3 500 ₽ (~$50).
        </div>
      </div>
    </div>
  );
}
