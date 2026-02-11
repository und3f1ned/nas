import { useWizardStore } from '../../store/wizard-store';
import { OptionCard } from '../ui/OptionCard';
import type { NetworkSpeed, RemoteAccess } from '../../types/wizard';

export function StepNetwork() {
  const { answers, setNetwork } = useWizardStore();
  const data = answers.network;

  const update = (partial: Partial<typeof data>) => {
    setNetwork({ ...data, ...partial });
  };

  const speedOptions: { value: NetworkSpeed; icon: string; label: string; desc: string }[] = [
    { value: '100mbps', icon: '🐌', label: '100 Мбит', desc: 'Устаревшая' },
    { value: '1gbe', icon: '🔵', label: '1 Гбит', desc: 'Стандарт' },
    { value: '2.5gbe', icon: '🟢', label: '2.5 Гбит', desc: 'Современная' },
    { value: '10gbe', icon: '⚡', label: '10 Гбит', desc: 'Профессиональная' },
  ];

  const remoteOptions: { value: RemoteAccess; icon: string; label: string; desc: string }[] = [
    { value: 'tailscale', icon: '🔒', label: 'Tailscale', desc: 'Просто и безопасно' },
    { value: 'vpn', icon: '🛡️', label: 'VPN', desc: 'OpenVPN / WireGuard' },
    { value: 'quickconnect', icon: '🌐', label: 'QuickConnect', desc: 'Через серверы Synology' },
    { value: 'none', icon: '❌', label: 'Не нужен', desc: 'Только локальная сеть' },
  ];

  const heavyUseCase = answers.useCases.some((uc) =>
    ['media', 'vm', 'business'].includes(uc)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Сетевое подключение</h2>
        <p className="text-sm text-text-secondary">
          Укажите текущую скорость сети и параметры удалённого доступа
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Текущая скорость сети</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {speedOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.desc}
                selected={data.currentSpeed === opt.value}
                onClick={() => update({ currentSpeed: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        {heavyUseCase && data.currentSpeed === '1gbe' && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
            💡 Для медиасервера, VM или офиса рекомендуется 2.5 Гбит или 10 Гбит сеть.
            Многие платы для NAS уже имеют встроенный 10GbE порт.
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update({ needUpgrade: !data.needUpgrade })}
            className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
              data.needUpgrade ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                data.needUpgrade ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-text-secondary">
            Нужен 10GbE на плате (при наличии совместимой материнки)
          </span>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Удалённый доступ</label>
          <div className="grid grid-cols-2 gap-2">
            {remoteOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.desc}
                selected={data.remoteAccess === opt.value}
                onClick={() => update({ remoteAccess: opt.value })}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
