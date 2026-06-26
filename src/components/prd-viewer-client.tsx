"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import {
  ArrowLeft,
  Copy,
  Download,
  Pencil,
  Save,
  X,
  Send,
  Loader2,
  MessageSquare,
  Check,
  Sparkles,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface PrdViewerClientProps {
  prd: {
    id: string;
    title: string;
    idea: string;
    markdown: string;
    tags: string | null;
    updatedAt: string;
  };
  initialMessages: Array<{ role: string; content: string; ts: number }>;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export function PrdViewerClient({
  prd,
  initialMessages,
}: PrdViewerClientProps) {
  const [markdown, setMarkdown] = useState(prd.markdown);
  const [title, setTitle] = useState(prd.title);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>(
    initialMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      ts: m.ts,
    }))
  );
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/prd/${prd.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, title }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal simpan.");
      }
      toast.success("PRD disimpan.");
      setEditMode(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("PRD disalin ke clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    a.download = `prd-${slug || "untitled"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PRD di-download sebagai .md");
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMsg = {
      role: "user",
      content: chatInput.trim(),
      ts: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`/api/prd/${prd.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: userMsg.content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal revisi.");
      }
      const data = await res.json();
      setMarkdown(data.markdown);
      const lastAssistant = data.messages
        ?.filter((m: any) => m.role === "assistant")
        .pop();
      setMessages((m) => [
        ...m,
        {
          role: "assistant" as const,
          content:
            lastAssistant?.content ||
            "PRD sudah direvisi sesuai instruksi kamu.",
          ts: Date.now(),
        },
      ]);
      toast.success("PRD direvisi.");
    } catch (err: any) {
      toast.error(err.message);
      setMessages((m) => m.filter((x) => x !== userMsg));
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg"
          >
            <Link href="/dashboard" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-accent/40 text-[10px] text-accent"
              >
                PRD Document
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Update{" "}
                {formatDistanceToNow(new Date(prd.updatedAt), {
                  addSuffix: true,
                  locale: idLocale,
                })}
              </span>
            </div>
            {editMode ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-display text-xl font-bold tracking-tight"
              />
            ) : (
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h1>
            )}
            {prd.tags && (
              <div className="mt-2 flex flex-wrap gap-1">
                {prd.tags.split(",").map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-[10px] font-normal"
                  >
                    {t.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9 gap-1.5 rounded-lg"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-accent" /> Disalin
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-9 gap-1.5 rounded-lg"
          >
            <Download className="h-3.5 w-3.5" /> .md
          </Button>
          {editMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMarkdown(prd.markdown);
                  setTitle(prd.title);
                  setEditMode(false);
                }}
                className="h-9 gap-1.5 rounded-lg"
              >
                <X className="h-3.5 w-3.5" /> Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="cta-glow h-9 gap-1.5 rounded-lg"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Simpan
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setEditMode(true)}
              className="h-9 gap-1.5 rounded-lg"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Original idea (collapsible) */}
      <details className="mb-6 overflow-hidden rounded-xl border border-border/60 bg-secondary/30">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/60">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Ide awal produk
          </span>
        </summary>
        <div className="border-t border-border/40 px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
            {prd.idea}
          </p>
        </div>
      </details>

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* PRD content */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent" />
          {editMode ? (
            <div className="space-y-3 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Konten Markdown
                </label>
                <Textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={32}
                  className="resize-y rounded-lg border-border/60 bg-background p-3 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="prose-prd p-6 sm:p-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[[rehypeSanitize, {
                  ...defaultSchema,
                  // Allow mermaid code blocks (className "language-mermaid")
                  attributes: {
                    ...defaultSchema.attributes,
                    code: [...(defaultSchema.attributes?.code || []), ["className"]],
                  },
                }]]}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          )}
        </Card>

        {/* Chat sidebar */}
        <Card className="flex h-[600px] flex-col overflow-hidden border-border/60 lg:sticky lg:top-20 lg:h-[calc(100vh-180px)]">
          <div className="h-1 w-full bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />
          <div className="border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Revisi via Chat
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Minta AI ubah PRD natural language
                </p>
              </div>
            </div>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/60 bg-secondary/20 p-4">
                <Sparkles className="mb-2 h-4 w-4 text-accent" />
                <p className="text-xs font-medium text-foreground">
                  Minta AI revisi PRD
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Contoh instruksi:
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <li className="rounded bg-background/60 px-2 py-1">
                    "Tambah fitur export PDF"
                  </li>
                  <li className="rounded bg-background/60 px-2 py-1">
                    "Ubah database jadi PostgreSQL"
                  </li>
                  <li className="rounded bg-background/60 px-2 py-1">
                    "Sederhanakan section 3"
                  </li>
                </ul>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    m.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-border/60 bg-secondary/40 text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  <span className="text-muted-foreground">
                    AI sedang merevisi PRD...
                  </span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleChatSubmit}
            className="space-y-2 border-t border-border/40 p-3"
          >
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Instruksi revisi... (Cmd/Ctrl+Enter untuk kirim)"
              rows={2}
              disabled={chatLoading}
              className="resize-none rounded-lg border-border/60 bg-background text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleChatSubmit(e as any);
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="cta-glow h-9 w-full gap-1.5 rounded-lg"
              disabled={chatLoading || !chatInput.trim()}
            >
              {chatLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Revisi PRD
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
