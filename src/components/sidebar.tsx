"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Settings,
  Sun,
  Moon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import type { Notebook } from "@/types";

interface SidebarProps {
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const fetchNotebooks = async () => {
    try {
      const res = await fetch("/api/notebooks");
      if (res.ok) {
        const data = await res.json();
        setNotebooks(data);
      }
    } catch (err) {
      console.error("Failed to fetch notebooks:", err);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, [pathname]);

  const createNotebook = async () => {
    const title = prompt("New notebook name:");
    if (!title?.trim()) return;

    try {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (res.ok) {
        fetchNotebooks();
        const nb = await res.json();
        router.push(`/notebook/${nb.id}`);
      }
    } catch (err) {
      console.error("Failed to create notebook:", err);
    }
  };

  const deleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this notebook and all its contents?")) return;

    try {
      await fetch(`/api/notebooks/${id}`, { method: "DELETE" });
      fetchNotebooks();
      if (pathname === `/notebook/${id}`) {
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to delete notebook:", err);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex items-center gap-2 p-4">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold">NotebookLM</h1>
      </div>

      <Separator />

      <div className="p-3">
        <Button
          onClick={createNotebook}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          New Notebook
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {notebooks.map((nb) => {
            const isActive = pathname === `/notebook/${nb.id}`;
            return (
              <Link
                key={nb.id}
                href={`/notebook/${nb.id}`}
                className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <span className="truncate">{nb.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => deleteNotebook(nb.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Link>
            );
          })}

          {notebooks.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No notebooks yet.
              <br />
              Create one to get started.
            </p>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="flex items-center justify-between p-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
