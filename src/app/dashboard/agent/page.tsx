"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Check, RefreshCw, Plus } from "lucide-react";
import { OrionLogo } from "@/components/landing/orion-logo";

type Step = { label: string; status: "done" | "running" | "pending" };
type Msg = { role: "user" | "agent"; text: string; steps?: Step[] };

const initial: Msg[] = [
  {
    role: "agent",
    text: "Hi Ada — I can manage your inbox and calendar. Ask me anything, or pick a suggestion below to get started.",
  },
];

const suggestions = [
  "Summarize my unread emails",
  "Find 30 min with Alex next week",
  "Draft a reply to Sarah's last email",
  "Move Friday meetings to Monday",
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text },
      {
        role: "agent",
        text: "Working on it…",
        steps: [
          { label: "Parsing your request", status: "done" },
          { label: "Querying Gmail", status: "running" },
          { label: "Updating Calendar", status: "pending" },
        ],
      },
    ]);
  }

  function newChat() {
    setMessages(initial);
    setInput("");
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 py-2.5 border-b border-border flex items-center justify-end">
        <button
          onClick={newChat}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary"
        >
          <Plus className="size-3.5" /> New chat
        </button>
      </div>

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
              <div key={i} className="flex items-start gap-3">
                <OrionLogo className="size-7 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-3">
                  <p className="text-[15px] leading-relaxed text-foreground">
                    {m.text}
                  </p>
                  {m.steps && (
                    <div className="border border-border bg-card rounded-xl divide-y divide-border overflow-hidden">
                      {m.steps.map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center gap-3 px-3.5 py-2 text-sm"
                        >
                          <span
                            className={`size-4 rounded-full grid place-items-center shrink-0 ${
                              s.status === "done"
                                ? "bg-primary/20 text-primary"
                                : s.status === "running"
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {s.status === "done" ? (
                              <Check className="size-2.5" strokeWidth={3} />
                            ) : s.status === "running" ? (
                              <RefreshCw className="size-2.5 animate-spin" />
                            ) : (
                              <span className="size-1 rounded-full bg-current" />
                            )}
                          </span>
                          <span
                            className={
                              s.status === "pending"
                                ? "text-muted-foreground"
                                : ""
                            }
                          >
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="max-w-2xl mx-auto">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={submit}
            className="flex items-end gap-2 p-2 border border-border rounded-2xl bg-card focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Orion to do something…"
              rows={1}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground resize-none outline-none px-3 py-2 max-h-32"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="submit"
              className="size-9 grid place-items-center rounded-lg bg-primary text-primary-foreground hover:shadow-glow transition-all shrink-0"
            >
              <Send className="size-4" />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Orion can manage Gmail and Calendar. Review actions before
            approving.
          </div>
        </div>
      </div>
    </div>
  );
}
