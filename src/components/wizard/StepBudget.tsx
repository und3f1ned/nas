import { useWizardStore } from '../../store/wizard-store';
import { OptionCard } from '../ui/OptionCard';
import type { BudgetRange } from '../../types/wizard';

export function StepBudget() {
  const { answers, setBudget } = useWizardStore();
  const data = answers.budget;

  const update = (partial: Partial<typeof data>) => {
    setBudget({ ...data, ...partial });
  };

  const budgetOptions: { value: BudgetRange; icon: string; label: string; desc: string }[] = [
    { value: '15-30', icon: '💰', label: '15–30 т.₽', desc: 'Базовый' },
    { value: '30-60', icon: '💰💰', label: '30–60 т.₽', desc: 'Средний' },
    { value: '60-120', icon: '💰💰💰', label: '60–120 т.₽', desc: 'Продвинутый' },
    { value: '120+', icon: '💎', label: '120+ т.₽', desc: 'Максимальный' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Бюджет</h2>
        <p className="text-sm text-text-secondary">
          Укажите желаемый диапазон бюджета на сборку
        </p>
      </div>

      <div className="bg-bg-card rounded-xl p-5 space-y-6 border border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update({ includeDisks: !data.includeDisks })}
            className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
              data.includeDisks ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                data.includeDisks ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm text-text-secondary">
            Включить диски в бюджет
          </span>
        </div>

        <div>
          <label className="text-sm text-text-secondary mb-2 block">Диапазон бюджета</label>
          <div className="grid grid-cols-2 gap-2">
            {budgetOptions.map((opt) => (
              <OptionCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.desc}
                selected={data.range === opt.value}
                onClick={() => update({ range: opt.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update({ usedEquipment: !data.usedEquipment })}
            className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
              data.usedEquipment ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                data.usedEquipment ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <div>
            <span className="text-sm text-text-secondary">
              Рассмотреть б/у серверное оборудование
            </span>
            <p className="text-xs text-text-muted">
              Dell/HP серверы, Xeon платформы — дешевле при большой производительности
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
