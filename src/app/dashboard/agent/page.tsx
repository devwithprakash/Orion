"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Send,
  Check,
  RefreshCw,
  Plus,
  AlertTriangle,
  Zap,
  Mail,
  Calendar,
  HelpCircle,
  X,
  ChevronRight,
  Sparkles,
  FileText,
} from "lucide-react";
import { OrionLogo } from "@/components/landing/orion-logo";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "done" | "running" | "pending" | "failed" | "skipped";

type Step = {
  type: string;
  label: string;
  status: StepStatus;
  summary?: string;
  error?: string;
};

type Usage = { used: number; remaining: number; limit: number };

type AgentMessage =
  | { role: "user"; text: string }
  | {
      role: "agent";
      understood?: string;
      clarificationNeeded?: string;
      steps?: Step[];
      usage?: Usage;
      error?: string;
      loading?: boolean;
      isConversational?: boolean;
    };

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { icon: React.ReactNode; label: string }> = {
  send_email: { icon: <Mail className="size-3" />, label: "Send Email" },
  create_calendar_event: {
    icon: <Calendar className="size-3" />,
    label: "Create Event",
  },
  summarize_emails: {
    icon: <FileText className="size-3" />,
    label: "Summarize Emails",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === "done")
    return (
      <span className="size-5 rounded-full bg-emerald-500/20 text-emerald-500 grid place-items-center shrink-0">
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  if (status === "running")
    return (
      <span className="size-5 rounded-full bg-amber-500/20 text-amber-500 grid place-items-center shrink-0">
        <RefreshCw className="size-3 animate-spin" />
      </span>
    );
  if (status === "failed")
    return (
      <span className="size-5 rounded-full bg-destructive/20 text-destructive grid place-items-center shrink-0">
        <X className="size-3" strokeWidth={3} />
      </span>
    );
  if (status === "skipped")
    return (
      <span className="size-5 rounded-full bg-muted text-muted-foreground grid place-items-center shrink-0">
        <ChevronRight className="size-3" />
      </span>
    );
  return (
    <span className="size-5 rounded-full bg-secondary text-muted-foreground grid place-items-center shrink-0">
      <span className="size-1.5 rounded-full bg-current" />
    </span>
  );
}

function UsagePill({ usage }: { usage: Usage }) {
  const pct = (usage.used / usage.limit) * 100;
  const color =
    usage.remaining === 0
      ? "text-destructive"
      : usage.remaining <= 1
        ? "text-amber-500"
        : "text-emerald-500";

  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
      <Zap className={`size-3 ${color}`} />
      <span>
        <span className={color}>{usage.remaining}</span> / {usage.limit} AI
        actions left today
      </span>
      <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            usage.remaining === 0
              ? "bg-destructive"
              : usage.remaining <= 1
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AgentBubble({ msg }: { msg: AgentMessage & { role: "agent" } }) {
  if (msg.loading) {
    return (
      <div className="flex items-start gap-3">
        <OrionLogo className="size-7 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 h-8">
            <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
            <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (msg.error) {
    return (
      <div className="flex items-start gap-3">
        <OrionLogo className="size-7 shrink-0 mt-0.5 opacity-60" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            {msg.error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <OrionLogo className="size-7 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-3">
        {/* Understood banner / Response */}
        {msg.understood && (
          <div className="flex items-start gap-2 text-[13px] text-foreground leading-relaxed">
            {!msg.isConversational && <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />}
            <span className={msg.isConversational ? "text-sm" : ""}>{msg.understood}</span>
          </div>
        )}

        {/* Clarification needed */}
        {msg.clarificationNeeded && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-600 dark:text-amber-400">
            <HelpCircle className="size-4 shrink-0 mt-0.5" />
            {msg.clarificationNeeded}
          </div>
        )}

        {/* Steps */}
        {msg.steps && msg.steps.length > 0 && (
          <div className="border border-border bg-card/50 rounded-xl overflow-hidden divide-y divide-border">
            {msg.steps.map((step, i) => {
              const meta = ACTION_META[step.type] ?? {
                icon: null,
                label: step.type,
              };
              return (
                <div key={i} className="flex items-start gap-3 px-3.5 py-2.5">
                  <StepStatusIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {meta.icon}
                      <span
                        className={
                          step.status === "pending" || step.status === "skipped"
                            ? "text-muted-foreground"
                            : ""
                        }
                      >
                        {meta.label}
                      </span>
                    </div>
                    {step.summary && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {step.summary}
                      </p>
                    )}
                    {step.error && (
                      <p className="text-[11px] text-destructive mt-0.5">
                        {step.error}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Usage */}
        {msg.usage && !msg.isConversational && <UsagePill usage={msg.usage} />}
      </div>
    </div>
  );
}

// ─── Connection Guard Banner ──────────────────────────────────────────────────

function ConnectionBanner({
  gmail,
  googlecalendar,
}: {
  gmail: boolean;
  googlecalendar: boolean;
}) {
  if (gmail && googlecalendar) return null;
  return (
    <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400">
      <AlertTriangle className="size-4 shrink-0" />
      <span className="flex-1">
        {!gmail && !googlecalendar
          ? "Gmail and Google Calendar are not connected."
          : !gmail
            ? "Gmail is not connected."
            : "Google Calendar is not connected."}{" "}
        The agent can only run actions for connected services.
      </span>
      <Link
        href="/dashboard/settings"
        className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-amber-500/40 hover:bg-amber-500/10 transition-colors"
      >
        Settings →
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const GREETING: AgentMessage = {
  role: "agent",
  understood:
    "Hi! I'm Orion — your AI assistant for Gmail and Google Calendar. Tell me what to do and I'll handle it.",
};

export default function AgentPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([GREETING]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("orion-agent-chat");
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    setLoaded(true);
  }, []);

  // Save chat to session storage
  useEffect(() => {
    if (loaded) {
      sessionStorage.setItem("orion-agent-chat", JSON.stringify(messages));
    }
  }, [messages, loaded]);

  // Fetch connection status
  const { data: conn } = useQuery({
    queryKey: ["connection-status"],
    queryFn: async () => {
      const res = await fetch("/api/connection/status");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ gmail: boolean; googlecalendar: boolean }>;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch initial usage
  const { data: usageData, refetch: refetchUsage } = useQuery({
    queryKey: ["agent-usage"],
    queryFn: async () => {
      const res = await fetch("/api/agent/usage");
      if (!res.ok) return null;
      return res.json() as Promise<Usage>;
    },
    staleTime: 0,
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    // Add user message + loading agent bubble
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "agent", loading: true },
    ]);

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [
          ...m.slice(0, -1),
          {
            role: "agent",
            error: data.message ?? "Something went wrong. Please try again.",
          },
        ]);
        return;
      }

      const steps: Step[] = (data.actions ?? []).map((a: any) => ({
        type: a.type,
        label: a.type,
        status:
          a.status === "success"
            ? "done"
            : a.status === "skipped"
              ? "skipped"
              : "failed",
        summary: a.summary,
        error: a.error,
      }));

      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: "agent",
          understood: data.understood,
          clarificationNeeded: data.clarificationNeeded,
          steps: steps.length > 0 ? steps : undefined,
          usage: data.usage,
          isConversational: data.isConversational,
        },
      ]);

      refetchUsage();
    } catch {
      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: "agent",
          error: "Network error. Please check your connection.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function newChat() {
    setMessages([GREETING]);
    setInput("");
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {usageData && <UsagePill usage={usageData} />}
        </div>
        <button
          onClick={newChat}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          <Plus className="size-3.5" /> New chat
        </button>
      </div>

      {/* Connection banner */}
      {conn && (
        <ConnectionBanner
          gmail={conn.gmail}
          googlecalendar={conn.googlecalendar}
        />
      )}

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                  {m.text}
                </div>
              </div>
            ) : (
              <AgentBubble key={i} msg={m} />
            ),
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={submit}
            className="flex items-end gap-2 p-2 border border-border rounded-2xl bg-card focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Orion to send emails, create events…"
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground resize-none outline-none px-3 py-2 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="size-9 grid place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>

          <p className="mt-3 text-center text-[11px] text-muted-foreground px-4 leading-relaxed">
            Ask Orion to manage emails, schedule meetings, summarize your inbox, or automate work tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
