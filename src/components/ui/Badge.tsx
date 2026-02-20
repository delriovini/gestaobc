"use client";

import { type HTMLAttributes } from "react";

export type RoleBadge = "CEO" | "GESTOR" | "STAFF";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  role: RoleBadge;
}

const roleStyles: Record<RoleBadge, string> = {
  CEO: "bg-blue-600/20 text-blue-300 border-blue-500/30",
  GESTOR: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  STAFF: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

export function Badge({ role, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md border px-2.5 py-0.5
        text-xs font-medium uppercase tracking-wider
        ${roleStyles[role]}
        ${className}
      `}
      {...props}
    >
      {role}
    </span>
  );
}
