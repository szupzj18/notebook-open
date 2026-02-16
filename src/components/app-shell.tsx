"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { SettingsDialog } from "@/components/settings-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        <main className="flex-1 overflow-hidden">{children}</main>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </TooltipProvider>
  );
}
