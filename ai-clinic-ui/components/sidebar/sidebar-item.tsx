"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  enabled: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  icon,
  label,
  enabled,
  isActive = false,
  onClick,
}: SidebarItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={enabled ? onClick : undefined}
          disabled={!enabled}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-left text-black transition-colors duration-200",
            "hover:bg-black/80 hover:text-white",
            enabled ? "cursor-pointer" : "cursor-not-allowed text-gray-400",
            isActive && "bg-black text-white",
          )}
        >
          <span className="text-current transition-colors duration-200">
            {icon}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        <span>{label}</span>
      </TooltipContent>
    </Tooltip>
  );
}
