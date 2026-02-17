// app/patient/[id]/(main)/_components/tab-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility, or use template literals
import { ExportModal } from "./export-modal";
import { Button } from "./ui/button";

const tabs = [
  {
    id: "overview",
    label: "Overview",
    type: "path",
    path: "",
    color: "#3b82f6",
  }, // path is empty for default page
  {
    id: "background",
    label: "Background",
    type: "path",
    path: "/background",
    color: "#ec4899",
  },
  {
    id: "surgery",
    label: "Surgery",
    type: "path",
    path: "/surgery",
    color: "#8b5cf6",
  },
  {
    id: "follow-up",
    label: "Follow-Up",
    type: "path",
    path: "/follow-up",
    color: "#10b981",
  },
  {
    id: "imaging",
    label: "Imaging",
    type: "path",
    path: "/imaging",
    color: "#f59e0b",
  },
  { id: "labs", label: "Labs", type: "path", path: "/labs", color: "#ef4444" },
  {
    id: "notes",
    label: "Notes",
    type: "path",
    path: "/notes",
    color: "#6366f1",
  },
  {
    id: "visits",
    label: "Visits",
    type: "path",
    path: "/visits",
    color: "#14b8a6",
  },
  {
    id: "export",
    label: "Export",
    type: "action",
    path: "#",
    color: "#6b7280",
  },
] as const;

export function PatientTabNav({ patientId }: { patientId: string }) {
  const pathname = usePathname();

  return (
    <div className="mb-4 sm:mb-6 space-y-2">
      <div className="flex items-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">← Back</Link>
        </Button>
      </div>
      <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide">
        <div className="flex gap-1 bg-muted/50 p-1.5 sm:p-2 rounded-xl min-w-max">
          {tabs.map((tab) => {
            // Construct full path
            const href =
              tab.type === "path" ? `/patients/${patientId}${tab.path}` : "#";

            // Check active state
            const isActive =
              tab.type === "path" && tab.path === ""
                ? pathname === `/patients/${patientId}`
                : pathname.includes(tab.path);

            if (tab.type === "path") {
              return (
                <Link
                  key={tab.id}
                  href={href}
                  prefetch={false}
                  className={cn(
                    "relative px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "text-white shadow-lg transform -translate-y-0.5 z-10"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-white/50",
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: tab.color,
                          boxShadow: `0 4px 14px ${tab.color}40`,
                        }
                      : {
                          borderBottom: `3px solid ${tab.color}30`,
                        }
                  }
                >
                  {/* Bookmark notch effect */}
                  {isActive && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                      style={{
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: `6px solid ${tab.color}`,
                      }}
                    />
                  )}
                  {tab.label}
                </Link>
              );
            } else {
              return (
                <div key={tab.id} className="relative">
                  <ExportModal patientId={patientId} />
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
