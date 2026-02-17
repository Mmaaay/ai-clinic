"use client";

import { useRouter, usePathname } from "next/navigation";
import { SidebarItem } from "./sidebar-item";
import { TooltipProvider } from "@/components/ui/tooltip";

const sidebarItems = [
  {
    id: "add-patient",
    label: "Add Patient",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" x2="19" y1="8" y2="14" />
        <line x1="22" x2="16" y1="11" y2="11" />
      </svg>
    ),
    mobileIcon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" x2="19" y1="8" y2="14" />
        <line x1="22" x2="16" y1="11" y2="11" />
      </svg>
    ),
    enabled: true,
    href: "/patients/add",
  },
  {
    id: "patients",
    label: "Patients",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    mobileIcon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    enabled: true,
    href: "/",
  },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleItemClick = (id: string) => {
    if (id === "add-patient") {
      router.push("/patients/add");
    } else if (id === "patients") {
      router.push("/");
    }
  };

  const isItemActive = (id: string, href: string) => {
    if (id === "add-patient") {
      return pathname === href;
    }

    if (id === "patients") {
      return pathname === "/" || pathname.endsWith("/patients/");
    }

    return false;
  };

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <TooltipProvider delayDuration={150}>
        <div className="fixed left-0 top-0 z-50 hidden md:flex h-full flex-col items-center px-2 py-4 transition-all duration-200">
          <div className="mt-4 flex h-[50%] w-full flex-col justify-around gap-2">
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                enabled={item.enabled}
                isActive={isItemActive(item.id, item.href)}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* Mobile bottom navigation - visible only on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-border/70 bg-background/95 backdrop-blur-md px-2 py-1.5 safe-area-bottom">
        {sidebarItems.map((item) => {
          const active = isItemActive(item.id, item.href);
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={active ? "text-primary" : "text-muted-foreground"}
              >
                {item.mobileIcon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
