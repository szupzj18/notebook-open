"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/message-bubble";
import type { Message } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  notebookId: string;
  notebookTitle: string;
  initialMessages: Message[];
  documentCount: number;
}

export function ChatPanel({
  notebookId,
  notebookTitle,
  initialMessages,
  documentCount,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }))
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isStreaming) return;

      setError(null);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userMessage.trim(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notebookId,
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const msg =
          err instanceof Error ? err.message : "An error occurred";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, notebookId]
  );

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        sendMessage(input);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">AI Chat</h2>
        {documentCount > 0 && (
          <span className="text-xs text-muted-foreground">
            ({documentCount} source{documentCount !== 1 ? "s" : ""} loaded)
          </span>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="space-y-6 px-6 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">
                Chat with &quot;{notebookTitle}&quot;
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {documentCount > 0
                  ? "Ask questions about your uploaded documents. I'll answer based on the content and cite my sources."
                  : "Upload some documents first, then ask me questions about them."}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </p>
                <MessageBubble
                  content={message.content}
                  role={message.role}
                />
              </div>
            </div>
          ))}

          {isStreaming &&
            messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              Error: {error}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              documentCount > 0
                ? "Ask about your documents..."
                : "Upload documents first to start chatting..."
            }
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={stopStreaming}
              className="h-[44px] w-[44px] shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-[44px] w-[44px] shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
