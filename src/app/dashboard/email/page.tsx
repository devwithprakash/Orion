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
} from "lucide-react";
import { ConnectGmailCard } from "@/components/dashboard/connect-google-card";

const folders = [
  { key: "inbox", label: "Inbox", icon: Inbox, count: 14 },
  { key: "starred", label: "Starred", icon: Star, count: 4 },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText, count: 2 },
  { key: "trash", label: "Trash", icon: Trash2 },
];

type Email = {
  id: number;
  from: string;
  email: string;
  avatar: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread: boolean;
  starred: boolean;
};

const emails: Email[] = [
  {
    id: 1,
    from: "Sarah Jenkins",
    email: "sarah@studio.dev",
    avatar: "SJ",
    subject: "Finalizing the design specs for Orion Dashboard",
    preview:
      "Hey team, I've updated the Figma components for dark mode transition…",
    time: "10:24 AM",
    unread: true,
    starred: true,
    body: [
      "Hey team,",
      "I've updated the Figma components for the dark mode transition and added the missing tokens for the agent surface. The spacing scale now matches the new 4pt grid.",
      "A few things I'd love your sign-off on before we push to production: the accent-soft token in dark mode, border opacity, and the new shadow-glow on primary CTAs.",
      "Let me know by EOD and I'll merge.",
      "— Sarah",
    ],
  },
  {
    id: 2,
    from: "Alex Chen",
    email: "alex@northwind.co",
    avatar: "AC",
    subject: "Re: Q3 deck review",
    preview: "Two things — can we tighten the narrative on slide 7?…",
    time: "9:02 AM",
    unread: true,
    starred: false,
    body: [
      "Two things —",
      "Can we tighten the narrative on slide 7? Also the metrics on 12 look stale. Other than that this is a great revision.",
      "— A",
    ],
  },
  {
    id: 3,
    from: "Google Calendar",
    email: "no-reply@google.com",
    avatar: "GC",
    subject: "Event update: Weekly Sync moved to Thursday",
    preview: "The event 'Weekly Sync' has been moved to Thursday at 3:00 PM.",
    time: "Yest",
    unread: true,
    starred: false,
    body: [
      "The event 'Weekly Sync' has been moved to Thursday at 3:00 PM by the organizer.",
    ],
  },
  {
    id: 4,
    from: "Linear",
    email: "updates@linear.app",
    avatar: "LN",
    subject: "12 issues completed this week",
    preview:
      "Your team shipped 12 issues. Top contributor: Jordan with 5 issues…",
    time: "Mon",
    unread: false,
    starred: false,
    body: [
      "Your team shipped 12 issues this week.",
      "Top contributor: Jordan with 5 issues completed across ORI-401, 402, 403, 410, and 412.",
    ],
  },
  {
    id: 5,
    from: "Stripe",
    email: "billing@stripe.com",
    avatar: "ST",
    subject: "Receipt for your subscription",
    preview: "Thanks for using Stripe. Here's your receipt for $99.00.",
    time: "Mon",
    unread: false,
    starred: false,
    body: [
      "Thanks for using Stripe. Here's your receipt for $99.00 — Orion Pro, monthly.",
    ],
  },
  {
    id: 6,
    from: "friend@corsair.dev",
    email: "friend@corsair.dev",
    avatar: "FR",
    subject: "Looking forward to Thursday",
    preview: "Just got your invite — see you at 9.",
    time: "Sun",
    unread: false,
    starred: true,
    body: [
      "Just got your invite — see you at 9. I'll prep the integration notes beforehand.",
    ],
  },
];

export default function EmailPage() {
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selected, setSelected] = useState<Email | null>(emails[0]);
  const [compose, setCompose] = useState(false);
  const [showReader, setShowReader] = useState(false);

  const connected = false;

  const handleGmailConnect = async()=>{
    try {
      const data = await axios
    } catch (error) {
      
    }
  }

  if (!connected) {
    return <ConnectGmailCard />;
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

                {folder.count && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {folder.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCompose(true)}
            className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Pencil className="size-4" />
            Compose
          </button>
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
          <div className="flex-1 overflow-auto divide-y divide-border">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => {
                  setSelected(email);
                  setShowReader(true);
                }}
                className={`w-full p-4 text-left transition-colors ${
                  selected?.id === email.id
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

                <div className="max-w-3xl space-y-4 text-[15px] leading-7 text-foreground/90">
                  {selected.body.map((paragraph, index) => (
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

  function send(e: FormEvent) {
    e.preventDefault();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 grid sm:place-items-end sm:p-6">
      <div className="bg-card w-full sm:max-w-xl sm:rounded-2xl border border-border shadow-elevated flex flex-col h-full sm:h-auto sm:max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">New message</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded hover:bg-secondary text-muted-foreground"
            >
              Save draft
            </button>
            <button
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
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:shadow-glow transition-all"
            >
              <Send className="size-3.5" /> Send
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
