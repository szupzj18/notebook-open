"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppSettings, LLMProvider, EmbeddingProvider } from "@/types";

const LLM_MODELS: Record<LLMProvider, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  ollama: ["llama3.2", "llama3.1", "mistral", "gemma2", "qwen2.5", "deepseek-r1"],
};

const EMBEDDING_MODELS: Record<EmbeddingProvider, string[]> = {
  openai: ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"],
  ollama: ["nomic-embed-text", "all-minilm", "mxbai-embed-large"],
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>({
    llmProvider: "openai",
    llmModel: "gpt-4o-mini",
    embeddingProvider: "openai",
    embeddingModel: "text-embedding-3-small",
    openaiApiKey: "",
    anthropicApiKey: "",
    ollamaBaseUrl: "http://localhost:11434",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => setSettings(data))
        .catch(console.error);
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("Failed to save settings.");
      }
    } catch {
      setMessage("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">LLM Configuration</h3>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={settings.llmProvider}
                onValueChange={(v: LLMProvider) =>
                  setSettings({
                    ...settings,
                    llmProvider: v,
                    llmModel: LLM_MODELS[v][0],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={settings.llmModel}
                onValueChange={(v) =>
                  setSettings({ ...settings, llmModel: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_MODELS[settings.llmProvider].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Embedding Configuration</h3>

            <div className="space-y-2">
              <Label>Embedding Provider</Label>
              <Select
                value={settings.embeddingProvider}
                onValueChange={(v: EmbeddingProvider) =>
                  setSettings({
                    ...settings,
                    embeddingProvider: v,
                    embeddingModel: EMBEDDING_MODELS[v][0],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Embedding Model</Label>
              <Select
                value={settings.embeddingModel}
                onValueChange={(v) =>
                  setSettings({ ...settings, embeddingModel: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMBEDDING_MODELS[settings.embeddingProvider].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">API Keys</h3>

            {(settings.llmProvider === "openai" ||
              settings.embeddingProvider === "openai") && (
              <div className="space-y-2">
                <Label>OpenAI API Key</Label>
                <Input
                  type="password"
                  value={settings.openaiApiKey || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, openaiApiKey: e.target.value })
                  }
                  placeholder="sk-..."
                />
              </div>
            )}

            {settings.llmProvider === "anthropic" && (
              <div className="space-y-2">
                <Label>Anthropic API Key</Label>
                <Input
                  type="password"
                  value={settings.anthropicApiKey || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      anthropicApiKey: e.target.value,
                    })
                  }
                  placeholder="sk-ant-..."
                />
              </div>
            )}

            {(settings.llmProvider === "ollama" ||
              settings.embeddingProvider === "ollama") && (
              <div className="space-y-2">
                <Label>Ollama Base URL</Label>
                <Input
                  value={settings.ollamaBaseUrl || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, ollamaBaseUrl: e.target.value })
                  }
                  placeholder="http://localhost:11434"
                />
              </div>
            )}
          </div>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
