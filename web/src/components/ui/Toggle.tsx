import "./ui.css";

interface ToggleProps {
  /** Current value */
  checked: boolean;
  /** Label text */
  label?: string;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Reusable toggle switch component.
 */
export function Toggle({
  checked,
  label,
  onChange,
  disabled = false,
}: ToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <label className={`toggle-container ${disabled ? "disabled" : ""}`}>
      {label && <span className="toggle-label">{label}</span>}
      <div className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <span className="toggle-slider" />
      </div>
    </label>
  );
}
