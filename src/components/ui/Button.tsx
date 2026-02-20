"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantStyles: Record<
  ButtonVariant,
  string
> = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 " +
    "hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-blue-500 " +
    "active:from-cyan-600 active:to-blue-700 active:shadow-cyan-500/30 " +
    "focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
  secondary:
    "border border-white/10 bg-white/5 text-slate-200 " +
    "hover:bg-white/10 hover:text-white hover:border-white/15 " +
    "active:bg-white/15 active:border-white/20 " +
    "focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-900",
  ghost:
    "text-slate-300 " +
    "hover:bg-white/5 hover:text-white " +
    "active:bg-white/10 " +
    "focus:ring-2 focus:ring-white/10 focus:ring-offset-2 focus:ring-offset-slate-900",
  danger:
    "border border-red-500/30 bg-red-500/10 text-red-300 " +
    "hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/40 " +
    "active:bg-red-500/25 " +
    "focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-slate-900",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      loading = false,
      disabled,
      type = "button",
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5
          text-sm font-medium transition-all duration-150
          outline-none disabled:cursor-not-allowed disabled:opacity-60
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
