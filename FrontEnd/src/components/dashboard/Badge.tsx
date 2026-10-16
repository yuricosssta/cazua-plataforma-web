// src/components/dashboard/Badge.tsx
import type { LucideIcon } from "lucide-react";

interface BadgeProps {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
  size?: "sm" | "md";
}

export function Badge({ icon: Icon, label, color, bg, size = "sm" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wider ${size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"} ${bg} ${color}`}
    >
      <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {label}
    </span>
  );
}