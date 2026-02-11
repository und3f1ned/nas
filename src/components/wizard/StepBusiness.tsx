import { useWizardStore } from '../../store/wizard-store';
import { Slider } from '../ui/Slider';

export function StepBusiness() {
  const { answers, setBusiness } = useWizardStore();
  const data = answers.business || {
    users: 10,
    synologyDrive: true,
    activeDirectory: false,
  };

  const update = (partial: Partial<typeof data>) => {
    setBusiness({ ...data, ...partial });
  };

  const userOptions = [
    { value: 3, label: '1–5' },
    { value: 10, label: '5–15' },
    { value: 30, label: '15–50' },
    { value: 75, label: '50+' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">🏢 Бизнес</h3>
        <p className="text-sm text-text-secondary">
          Synology Drive, офисные сервисы, совместная работа
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <Slider
          label="Количество пользователей"
          value={data.users}
          onChange={(v) => update({ users: v })}
          min={0}
          max={0}
          options={userOptions}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update({ synologyDrive: !data.synologyDrive })}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                data.synologyDrive ? 'bg-accent' : 'bg-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  data.synologyDrive ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <span className="text-sm text-text-primary">Synology Drive</span>
              <p className="text-xs text-text-muted">Синхронизация файлов как Dropbox/Google Drive</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update({ activeDirectory: !data.activeDirectory })}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                data.activeDirectory ? 'bg-accent' : 'bg-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  data.activeDirectory ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <span className="text-sm text-text-primary">Active Directory / LDAP</span>
              <p className="text-xs text-text-muted">Централизованное управление учётными записями</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
