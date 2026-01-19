import { type ButtonHTMLAttributes } from "react";
import "./ui.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: "primary" | "secondary" | "ghost";
  /** Button size */
  size?: "small" | "medium" | "large";
}

/**
 * Reusable button component.
 */
export function Button({
  variant = "primary",
  size = "medium",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `btn btn-${variant} btn-${size} ${className}`.trim();

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
