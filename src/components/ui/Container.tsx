"use client";

import { forwardRef, type HTMLAttributes } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "main" | "section";
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ as: Component = "div", className = "", children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-8 lg:py-10 ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Container.displayName = "Container";
