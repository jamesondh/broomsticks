import "./ui.css";

interface SliderProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step?: number;
  /** Label text */
  label?: string;
  /** Show current value */
  showValue?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Change handler */
  onChange: (value: number) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Reusable slider component.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => String(v),
  onChange,
  disabled = false,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="slider-container">
      {label && (
        <label className="slider-label">
          {label}
          {showValue && (
            <span className="slider-value">{formatValue(value)}</span>
          )}
        </label>
      )}
      <input
        type="range"
        className="slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
