import { useWizardStore } from '../../store/wizard-store';
import { Slider } from '../ui/Slider';
import { OptionCard } from '../ui/OptionCard';
import { STORAGE_SIZES_TB } from '../../utils/constants';
import type { TranscodingLevel } from '../../types/wizard';

export function StepMedia() {
  const { answers, setMedia } = useWizardStore();
  const data = answers.media || {
    libraryTB: 4,
    transcoding: 'none' as TranscodingLevel,
    streams: 1,
    engine: 'plex' as const,
  };

  const update = (partial: Partial<typeof data>) => {
    setMedia({ ...data, ...partial });
  };

  const libOptions = STORAGE_SIZES_TB.map((v) => ({
    value: v,
    label: v < 1 ? `${v * 1024} ГБ` : `${v} ТБ`,
  }));

  const transcodingOptions: { value: TranscodingLevel; icon: string; label: string }[] = [
    { value: 'none', icon: '⏸️', label: 'Не нужен' },
    { value: '1080p', icon: '📺', label: '1080p' },
    { value: '4k', icon: '🎬', label: '4K' },
  ];

  const engineOptions: { value: typeof data.engine; icon: string; label: string }[] = [
    { value: 'plex', icon: '🟡', label: 'Plex' },
    { value: 'jellyfin', icon: '🟣', label: 'Jellyfin' },
    { value: 'emby', icon: '🟢', label: 'Emby' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">🎬 Медиасервер</h3>
        <p className="text-sm text-text-secondary">
          Настройте параметры медиасервера для стриминга
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <Slider
          label="Размер медиатеки"
          value={data.libraryTB}
          onChange={(v) => update({ libraryTB: v })}
          min={0}
          max={0}
          options={libOptions}
        />

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Транскодинг</label>
          <div className="grid grid-cols-3 gap-2">
            {transcodingOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.transcoding === opt.value}
                onClick={() => update({ transcoding: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <Slider
          label="Одновременных потоков"
          value={data.streams}
          onChange={(v) => update({ streams: v })}
          min={1}
          max={8}
          step={1}
        />

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Движок</label>
          <div className="grid grid-cols-3 gap-2">
            {engineOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.engine === opt.value}
                onClick={() => update({ engine: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        {data.transcoding !== 'none' && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-xs text-accent-light">
            💡 Для аппаратного транскодинга требуется Intel CPU с Quick Sync (iGPU). Будет подобрана плата с поддержкой.
          </div>
        )}
      </div>
    </div>
  );
}
