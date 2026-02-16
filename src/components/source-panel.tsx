"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText,
  Upload,
  Trash2,
  FileIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Document } from "@/types";

interface SourcePanelProps {
  notebookId: string;
  documents: Document[];
  onDocumentsChange: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  if (fileType.includes("word") || fileType.includes("docx"))
    return <FileText className="h-4 w-4 text-blue-500" />;
  if (fileType.includes("markdown")) return <FileText className="h-4 w-4 text-purple-500" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "processing":
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "ready":
      return (
        <Badge variant="secondary" className="gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Ready
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
  }
}

export function SourcePanel({
  notebookId,
  documents,
  onDocumentsChange,
}: SourcePanelProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("notebookId", notebookId);

          await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });
        }
        onDocumentsChange();
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    },
    [notebookId, onDocumentsChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "text/csv": [".csv"],
    },
  });

  const deleteDocument = async (docId: string) => {
    if (!confirm("Remove this document?")) return;
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      onDocumentsChange();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center gap-2 border-b p-4">
        <FileText className="h-5 w-5" />
        <h2 className="font-semibold">Sources</h2>
        <Badge variant="secondary" className="ml-auto text-xs">
          {documents.length}
        </Badge>
      </div>

      <div className="p-3">
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing...</p>
            </>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drop files here</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, DOCX, TXT, MD, CSV
              </p>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 pb-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <div className="mt-0.5">{getFileIcon(doc.fileType)}</div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{doc.filename}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  {getStatusBadge(doc.status)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={() => deleteDocument(doc.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {documents.length === 0 && !uploading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sources yet. Upload documents to get started.
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
