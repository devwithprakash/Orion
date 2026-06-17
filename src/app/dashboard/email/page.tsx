"use client";

import { useState, type FormEvent } from "react";
import {
  Inbox,
  Star,
  Send,
  FileText,
  Trash2,
  Search,
  Reply,
  Archive,
  MoreHorizontal,
  X,
  ArrowLeft,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { ConnectGoogleCard } from "@/components/dashboard/connect-google-card";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const folders = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "trash", label: "Trash", icon: Trash2 },
];

type GmailThread = {
  id: string;
  entity_id: string;
  entity_type: string;
  data: {
    id: string;
    snippet: string;
    historyId: string;
    createdAt: string;
  };
};

export default function EmailPage() {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [showReader, setShowReader] = useState(false);

  const { data: conn } = useConnectionStatus();
  const connected = conn?.gmail;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["gmail-threads"],
    queryFn: async () => {
      const res = await fetch("/api/gmail/threads");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
    enabled: connected,
  });

  const threads = data?.threads || [];
  console.log(threads);

  // Transform the raw Gmail API thread into our UI format
  // We're doing a simplified mapping here assuming standard payload format
  const formattedEmails = (threads as any[]).map((thread) => ({
    id: thread.data.id,
    from: thread.from || "Unknown Sender",
    email: thread.fromEmail || "",
    avatar: (thread.from || "??").slice(0, 2).toUpperCase(),
    subject: thread.subject || thread.data.snippet || "(No Subject)",
    preview: thread.data.snippet || "",
    body: [thread.data.snippet || ""],
    time: new Date(thread.date || thread.data.createdAt).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    ),
    unread: false,
    starred: false,
  }));

  const selected = formattedEmails.find((e: any) => e.id === selectedId);

  console.log("selected", selected)

  if (connected === false) {
    return <ConnectGoogleCard service="gmail" />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* email navigation links */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {folders.map((folder) => (
              <button
                key={folder.key}
                onClick={() => setActiveFolder(folder.key)}
                className={`h-9 px-4 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  activeFolder === folder.key
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {folder.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="shrink-0 size-9 grid place-items-center rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setCompose(true)}
              className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Pencil className="size-4" />
              Compose
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search emails..."
              className="w-full h-10 rounded-lg border border-border bg-card pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Email List */}
        <section
          className={`${
            showReader ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-[360px] shrink-0 border-r border-border overflow-hidden`}
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading emails...
            </div>
          ) : formattedEmails.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No emails found.
            </div>
          ) : (
            <div className="flex-1 overflow-auto divide-y divide-border">
              {formattedEmails.map((email: any) => (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelectedId(email.id);
                    setShowReader(true);
                  }}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedId === email.id
                      ? "bg-accent-soft/40"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`truncate text-xs ${
                        email.unread
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {email.from}
                    </span>

                    {email.starred && (
                      <Star className="size-3 fill-primary text-primary" />
                    )}

                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                      {email.time}
                    </span>
                  </div>

                  <div
                    className={`line-clamp-1 text-sm mb-1 ${
                      email.unread ? "font-semibold" : ""
                    }`}
                  >
                    {email.subject}
                  </div>

                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {email.preview}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Reader */}
        <section
          className={`${
            showReader ? "flex" : "hidden"
          } md:flex flex-col flex-1 overflow-hidden`}
        >
          {selected ? (
            <>
              {/* Reader Toolbar */}
              <div className="flex items-center gap-1 border-b border-border p-3">
                <button
                  onClick={() => setShowReader(false)}
                  className="md:hidden size-9 rounded-lg hover:bg-secondary grid place-items-center"
                >
                  <ArrowLeft className="size-4" />
                </button>

                <button className="size-9 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground">
                  <Reply className="size-4" />
                </button>

                <button className="size-9 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground">
                  <Archive className="size-4" />
                </button>

                <button className="size-9 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground">
                  <Trash2 className="size-4" />
                </button>

                <button className="ml-auto size-9 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>

              {/* Reader Content */}
              <div className="flex-1 overflow-auto p-6 md:p-8">
                <h1 className="mb-6 text-2xl font-medium tracking-tight">
                  {selected.subject}
                </h1>

                <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
                  <div className="size-10 rounded-full bg-primary/20 text-primary font-semibold grid place-items-center">
                    {selected.avatar}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {selected.from}
                    </div>

                    <div className="truncate text-xs text-muted-foreground">
                      {selected.email} · {selected.time}
                    </div>
                  </div>
                </div>

                <div className="max-w-3xl space-y-4 text-[15px] leading-7 text-foreground/90 whitespace-pre-wrap">
                  {selected.body.map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
              Select an email
            </div>
          )}
        </section>
      </div>

      {compose && <Composer onClose={() => setCompose(false)} />}
    </div>
  );
}

function Composer({ onClose }: { onClose: () => void }) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);

  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, cc, bcc, subject, message: body }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Message sent");
      queryClient.invalidateQueries({ queryKey: ["gmail-threads"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function send(e: FormEvent) {
    e.preventDefault();
    if (!to || !subject || !body) {
      toast.error("Missing required fields");
      return;
    }
    sendMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 grid sm:place-items-end sm:p-6">
      <div className="bg-card w-full sm:max-w-xl sm:rounded-2xl border border-border shadow-elevated flex flex-col h-full sm:h-auto sm:max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">New message</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="size-8 grid place-items-center rounded hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <form onSubmit={send} className="flex-1 flex flex-col overflow-hidden">
          <Field
            label="To"
            value={to}
            onChange={setTo}
            placeholder="recipient@example.com"
            right={
              !showCcBcc && (
                <button
                  type="button"
                  onClick={() => setShowCcBcc(true)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cc / Bcc
                </button>
              )
            }
          />
          {showCcBcc && (
            <>
              <Field label="Cc" value={cc} onChange={setCc} />
              <Field label="Bcc" value={bcc} onChange={setBcc} />
            </>
          )}
          <Field label="Subject" value={subject} onChange={setSubject} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            className="flex-1 min-h-[200px] px-4 py-3 text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between gap-2 p-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:shadow-glow transition-all disabled:opacity-50"
            >
              <Send className="size-3.5" />{" "}
              {sendMutation.isPending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  right,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 border-b border-border">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground w-12 shrink-0">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-11 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {right}
    </div>
  );
}
