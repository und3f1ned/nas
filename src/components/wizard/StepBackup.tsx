import { useEffect } from 'react';
import { useWizardStore } from '../../store/wizard-store';
import { OptionCard } from '../ui/OptionCard';

const DEFAULTS = {
  deviceRange: '1-3' as const,
  deviceTypes: [] as string[],
  cloudBackup: null as string | null,
};

export function StepBackup() {
  const { answers, setBackup } = useWizardStore();
  const data = answers.backup || DEFAULTS;

  useEffect(() => {
    if (!answers.backup) setBackup(DEFAULTS);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (partial: Partial<typeof data>) => {
    setBackup({ ...data, ...partial });
  };

  const rangeOptions = [
    { value: '1-3' as const, icon: '💻', label: '1–3' },
    { value: '3-10' as const, icon: '💻💻', label: '3–10' },
    { value: '10+' as const, icon: '💻💻💻', label: '10+' },
  ];

  const typeOptions = [
    { id: 'timemachine', label: 'Mac (Time Machine)', icon: '🍎' },
    { id: 'activebackup', label: 'Windows (Active Backup)', icon: '🪟' },
    { id: 'rsync', label: 'Linux (rsync)', icon: '🐧' },
    { id: 'mixed', label: 'Смешанный', icon: '🔀' },
  ];

  const cloudOptions = [
    { id: 'backblaze', label: 'Backblaze B2', icon: '☁️' },
    { id: 'wasabi', label: 'Wasabi', icon: '☁️' },
    { id: 'yandex', label: 'Яндекс.Облако', icon: '☁️' },
    { id: 'none', label: 'Не нужен', icon: '❌' },
  ];

  const toggleType = (id: string) => {
    const types = data.deviceTypes.includes(id)
      ? data.deviceTypes.filter((t) => t !== id)
      : [...data.deviceTypes, id];
    update({ deviceTypes: types });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">💾 Бэкап</h3>
        <p className="text-sm text-text-secondary">
          Настройте параметры резервного копирования
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Количество устройств</label>
          <div className="grid grid-cols-3 gap-2">
            {rangeOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                selected={data.deviceRange === opt.value}
                onClick={() => update({ deviceRange: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Тип устройств</label>
          <div className="grid grid-cols-2 gap-2">
            {typeOptions.map((opt) => (
              <OptionCard
                key={opt.id}
                icon={opt.icon}
                label={opt.label}
                selected={data.deviceTypes.includes(opt.id)}
                onClick={() => toggleType(opt.id)}
                compact
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Облачный бэкап</label>
          <div className="grid grid-cols-2 gap-2">
            {cloudOptions.map((opt) => (
              <OptionCard
                key={opt.id}
                icon={opt.icon}
                label={opt.label}
                selected={data.cloudBackup === opt.id || (opt.id === 'none' && !data.cloudBackup)}
                onClick={() => update({ cloudBackup: opt.id === 'none' ? null : opt.id })}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
