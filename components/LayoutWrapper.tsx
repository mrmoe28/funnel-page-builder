"use client";

import { useEffect, useState } from "react";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Listen for sidebar state changes
    const handleSidebarToggle = ((e: CustomEvent) => {
      setIsCollapsed(e.detail.isCollapsed);
    }) as EventListener;

    window.addEventListener("sidebarToggle", handleSidebarToggle);

    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
    };
  }, []);

  return (
    <main
      className={`min-h-screen px-4 md:pr-6 py-8 transition-all duration-300 ${
        isCollapsed ? "md:pl-6" : "md:pl-80"
      }`}
    >
      <div className="container mx-auto max-w-[1600px]">{children}</div>
    </main>
  );
}