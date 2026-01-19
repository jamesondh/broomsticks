import type { CSSProperties, ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
}

const baseStyle: CSSProperties = {
  border: "none",
  borderRadius: 0,
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: "bold",
};

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-btn-primary)",
    color: "var(--color-text-inverse)",
  },
  secondary: {
    backgroundColor: "var(--color-btn-secondary)",
    color: "var(--color-text-inverse)",
  },
  danger: {
    backgroundColor: "var(--color-btn-danger)",
    color: "var(--color-text-inverse)",
  },
};

const sizeStyles: Record<string, CSSProperties> = {
  small: {
    padding: "6px 12px",
    fontSize: "var(--font-size-sm)",
  },
  medium: {
    padding: "10px 20px",
    fontSize: "var(--font-size-md)",
  },
  large: {
    padding: "14px 28px",
    fontSize: "var(--font-size-lg)",
  },
};

const disabledStyle: CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

export function Button({
  variant = "primary",
  size = "medium",
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(disabled ? disabledStyle : {}),
        ...style,
      }}
    />
  );
}
