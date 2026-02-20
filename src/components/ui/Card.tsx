"use client";

import { forwardRef, type HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ as: Component = "div", className = "", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`
          rounded-xl border border-slate-200/80 bg-white p-6
          shadow-md
          dark:border-white/10 dark:bg-white/5
          ${className}
        `}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";
