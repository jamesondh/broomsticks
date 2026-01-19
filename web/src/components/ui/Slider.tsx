import type { CSSProperties, InputHTMLAttributes } from "react";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "var(--color-text-secondary)",
  fontSize: "var(--font-size-md)",
};

const sliderStyle: CSSProperties = {
  width: "100%",
  height: "6px",
  borderRadius: 0,
  appearance: "none",
  backgroundColor: "var(--color-border)",
  cursor: "pointer",
};

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  showValue = true,
  valueFormatter,
  style,
  ...props
}: SliderProps) {
  const displayValue = valueFormatter ? valueFormatter(value) : String(value);

  return (
    <div style={{ ...containerStyle, ...style }}>
      <div style={labelRowStyle}>
        <span>{label}</span>
        {showValue && <span style={{ color: "var(--color-btn-primary)", fontWeight: "bold" }}>{displayValue}</span>}
      </div>
      <input
        {...props}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderStyle}
      />
    </div>
  );
}
