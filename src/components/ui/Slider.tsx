interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  options?: { value: number; label: string }[];
  unit?: string;
  showValue?: boolean;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  options,
  unit = '',
  showValue = true,
}: SliderProps) {
  if (options) {
    const index = options.findIndex((o) => o.value === value);
    const currentIdx = index >= 0 ? index : 0;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-text-secondary">{label}</label>
          {showValue && (
            <span className="text-sm font-mono text-accent-light">
              {options[currentIdx].label}
            </span>
          )}
        </div>
        <input
          type="range"
          min={0}
          max={options.length - 1}
          step={1}
          value={currentIdx}
          onChange={(e) => onChange(options[Number(e.target.value)].value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>{options[0].label}</span>
          <span>{options[options.length - 1].label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-text-secondary">{label}</label>
        {showValue && (
          <span className="text-sm font-mono text-accent-light">
            {value}{unit}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
