"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Notebook } from "@/types";

export default function DashboardPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  useEffect(() => {
    fetch("/api/notebooks")
      .then((r) => r.json())
      .then(setNotebooks)
      .catch(console.error);
  }, []);

  const createNotebook = async () => {
    const title = prompt("New notebook name:");
    if (!title?.trim()) return;

    const res = await fetch("/api/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });

    if (res.ok) {
      const nb = await res.json();
      window.location.href = `/notebook/${nb.id}`;
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-8 py-6">
        <h1 className="text-2xl font-bold">Welcome to NotebookLM</h1>
        <p className="mt-1 text-muted-foreground">
          Your AI-powered research assistant. Upload documents, ask questions,
          and gain insights.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card
            className="flex cursor-pointer flex-col items-center justify-center border-dashed transition-colors hover:border-primary/50 hover:bg-accent/50"
            onClick={createNotebook}
          >
            <CardContent className="flex flex-col items-center py-8">
              <div className="mb-3 rounded-full bg-primary/10 p-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">New Notebook</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a new research project
              </p>
            </CardContent>
          </Card>

          {notebooks.map((nb) => (
            <Link key={nb.id} href={`/notebook/${nb.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {nb.title}
                      </CardTitle>
                      {nb.description && (
                        <CardDescription className="mt-1 line-clamp-2 text-xs">
                          {nb.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(nb.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Notebook
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {notebooks.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-muted p-6">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium">No notebooks yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create your first notebook to start uploading documents and
              chatting with your AI research assistant.
            </p>
            <Button onClick={createNotebook} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create Notebook
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
