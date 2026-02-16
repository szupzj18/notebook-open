"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { SourcePanel } from "@/components/source-panel";
import { ChatPanel } from "@/components/chat-panel";
import { Loader2 } from "lucide-react";
import type { Document, Message } from "@/types";

interface NotebookDetail {
  id: string;
  title: string;
  description: string | null;
  documents: Document[];
  messages: Message[];
}

export default function NotebookPage() {
  const params = useParams();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<NotebookDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotebook = useCallback(async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebookId}`);
      if (res.ok) {
        const data = await res.json();
        setNotebook(data);
      }
    } catch (err) {
      console.error("Failed to fetch notebook:", err);
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    fetchNotebook();
  }, [fetchNotebook]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Notebook not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0">
        <SourcePanel
          notebookId={notebook.id}
          documents={notebook.documents}
          onDocumentsChange={fetchNotebook}
        />
      </div>
      <div className="flex-1">
        <ChatPanel
          notebookId={notebook.id}
          notebookTitle={notebook.title}
          initialMessages={notebook.messages}
          documentCount={notebook.documents.filter((d) => d.status === "ready").length}
        />
      </div>
    </div>
  );
}
