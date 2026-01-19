import type { CSSProperties, ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
}

const baseStyle: CSSProperties = {
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: "bold",
  transition: "background-color 0.15s, opacity 0.15s",
};

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: "#4a90d9",
    color: "#ffffff",
  },
  secondary: {
    backgroundColor: "#555",
    color: "#ffffff",
  },
  danger: {
    backgroundColor: "#d94a4a",
    color: "#ffffff",
  },
};

const sizeStyles: Record<string, CSSProperties> = {
  small: {
    padding: "6px 12px",
    fontSize: "12px",
  },
  medium: {
    padding: "10px 20px",
    fontSize: "14px",
  },
  large: {
    padding: "14px 28px",
    fontSize: "18px",
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
