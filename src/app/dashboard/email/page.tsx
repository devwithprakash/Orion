"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";
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
  StarOff,
  ChevronDown,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { ConnectGoogleCard } from "@/components/dashboard/connect-google-card";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useCommand, dispatchCommand } from "@/lib/events";

// ─── Types ────────────────────────────────────────────────────────────────────

type Folder = "inbox" | "starred" | "sent" | "drafts" | "trash";

type EmailThread = {
  id: string;
  from: string;
  fromEmail: string;
  subject: string | null;
  snippet: string;
  date: string;
  unread: boolean;
  starred: boolean;
  inInbox: boolean;
  messageCount: number;
  labelIds: string[];
};

type ThreadMessage = {
  id: string;
  threadId: string;
  isUnread: boolean;
  snippet: string;
  internalDate: string;
  headers: {
    from: string;
    to: string;
    cc: string;
    subject: string;
    date: string;
  };
  body: { html: string | null; text: string | null };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name || name === "Unknown") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-violet-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-teal-500",
  ];
  if (!name || name === "Unknown") return "bg-muted";
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatEmailDate(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear)
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─── Folders config ───────────────────────────────────────────────────────────

const FOLDERS: { key: Folder; label: string; icon: typeof Inbox }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "trash", label: "Trash", icon: Trash2 },
];

// ─── Skeleton Components ──────────────────────────────────────────────────────

function EmailRowSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-border animate-pulse">
      <div className="size-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 bg-muted rounded w-28" />
          <div className="h-2.5 bg-muted rounded w-12" />
        </div>
        <div className="h-3 bg-muted rounded w-48" />
        <div className="h-2.5 bg-muted rounded w-full max-w-xs" />
      </div>
    </div>
  );
}

function ReaderSkeleton() {
  return (
    <div className="flex-1 overflow-auto p-6 md:p-8 animate-pulse">
      <div className="h-7 bg-muted rounded w-2/3 mb-6" />
      <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
        <div className="size-10 rounded-full bg-muted shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-muted rounded w-32" />
          <div className="h-2.5 bg-muted rounded w-48" />
        </div>
      </div>
      <div className="space-y-3 max-w-3xl">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-3 bg-muted rounded ${i % 3 === 0 ? "w-4/5" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── HTML Email Renderer ──────────────────────────────────────────────────────

function HtmlEmailBody({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px; line-height: 1.6; color: #1a1a2e;
    background: transparent; word-break: break-word; overflow-wrap: break-word;
  }
  img { max-width: 100%; height: auto; }
  a { color: #6366f1; }
  table { max-width: 100%; }
  pre, code { overflow-x: auto; max-width: 100%; }
</style>
</head>
<body>${html}</body>
</html>`);
    doc.close();

    const resize = () => {
      if (iframe.contentDocument?.body) {
        iframe.style.height =
          iframe.contentDocument.body.scrollHeight + 32 + "px";
      }
    };
    iframe.onload = resize;
    setTimeout(resize, 100);
    setTimeout(resize, 500);
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="w-full border-0 min-h-[200px]"
      title="Email content"
      style={{ height: "600px" }}
    />
  );
}

// ─── Main Email Page ──────────────────────────────────────────────────────────

export default function EmailPage() {
  const [activeFolder, setActiveFolder] = useState<Folder>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conn, isLoading: isConnLoading } = useConnectionStatus();
  const connected = conn?.gmail;

  // ── Infinite query for thread list ───────────────────────────────────────
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isFetching,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["gmail-threads", activeFolder, search],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/gmail/threads", window.location.origin);
      url.searchParams.set("limit", "25");
      url.searchParams.set("folder", activeFolder);
      if (search) url.searchParams.set("q", search);
      if (pageParam) url.searchParams.set("pageToken", pageParam as string);
      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw Object.assign(new Error(err.message || "Failed to fetch"), {
          status: res.status,
        });
      }
      return res.json() as Promise<{
        threads: EmailThread[];
        nextPageToken: string | null;
        count: number;
      }>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    enabled: !!connected,
    staleTime: 1000 * 30,
    retry: (failureCount, err: any) => {
      // Don't retry auth errors
      if (err?.status === 401 || err?.status === 403) return false;
      return failureCount < 2;
    },
  });

  const threads: EmailThread[] = data?.pages.flatMap((p) => p.threads) ?? [];

  // ── Intersection observer for infinite scroll ─────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Full thread detail (for reader) ──────────────────────────────────────
  const { data: threadDetail, isLoading: threadLoading } = useQuery({
    queryKey: ["gmail-thread", selectedId],
    queryFn: async () => {
      const res = await fetch(`/api/gmail/thread/${selectedId}`);
      if (!res.ok) throw new Error("Failed to fetch email");
      return res.json() as Promise<{
        id: string;
        messages: ThreadMessage[];
        messageCount: number;
      }>;
    },
    enabled: !!selectedId && !!connected,
    staleTime: 1000 * 60 * 5,
  });

  // ── Optimistically mark as read ──────────────────────────────────────────
  useEffect(() => {
    if (selectedId) {
      queryClient.setQueriesData(
        { queryKey: ["gmail-threads"] },
        (old: any) => {
          if (!old) return old;
          let changed = false;
          const newPages = old.pages.map((page: any) => ({
            ...page,
            threads: page.threads.map((t: EmailThread) => {
              if (t.id === selectedId && t.unread) {
                changed = true;
                return { ...t, unread: false, labelIds: t.labelIds.filter((l) => l !== "UNREAD") };
              }
              return t;
            }),
          }));
          return changed ? { ...old, pages: newPages } : old;
        }
      );
    }
  }, [selectedId, queryClient]);

  // ── Star / unstar mutation ────────────────────────────────────────────────
  const starMutation = useMutation({
    mutationFn: async ({
      threadId,
      starred,
    }: {
      threadId: string;
      starred: boolean;
    }) => {
      const res = await fetch(`/api/gmail/threads/${threadId}/star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred }),
      });
      if (!res.ok) throw new Error("Failed to update star");
      return res.json();
    },
    onMutate: async ({ threadId, starred }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["gmail-threads"] });
      queryClient.setQueriesData(
        { queryKey: ["gmail-threads"] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              threads: page.threads.map((t: EmailThread) =>
                t.id === threadId ? { ...t, starred } : t
              ),
            })),
          };
        }
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-threads"] });
      toast.error("Failed to update star");
    },
  });

  // ── Trash mutation ────────────────────────────────────────────────────────
  const trashMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await fetch(`/api/gmail/threads/${threadId}/trash`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to move to trash");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-threads"] });
      setSelectedId(null);
      setShowReader(false);
      toast.success("Moved to trash");
    },
    onError: () => toast.error("Failed to move to trash"),
  });

  // ── Restore from trash mutation ───────────────────────────────────────────
  const restoreMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await fetch(`/api/gmail/threads/${threadId}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-threads"] });
      setSelectedId(null);
      setShowReader(false);
      toast.success("Restored to inbox");
    },
    onError: () => toast.error("Failed to restore"),
  });

  const selectedMeta = threads.find((t) => t.id === selectedId);
  const latestMessage =
    threadDetail?.messages?.[threadDetail.messages.length - 1];

  // ── Navigate between emails with J/K ─────────────────────────────────────
  const navigateEmail = useCallback(
    (direction: "next" | "prev") => {
      if (threads.length === 0) return;
      const currentIndex = threads.findIndex((t) => t.id === selectedId);
      let nextIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      nextIndex = Math.max(0, Math.min(nextIndex, threads.length - 1));
      if (nextIndex !== currentIndex) {
        setSelectedId(threads[nextIndex].id);
        setShowReader(true);
      }
    },
    [threads, selectedId]
  );

  // ── Global Command Listeners ──────────────────────────────────────────────
  useCommand("email:compose", () => setCompose(true));
  useCommand("email:search", () => searchRef.current?.focus());
  useCommand("email:next", () => navigateEmail("next"));
  useCommand("email:prev", () => navigateEmail("prev"));
  useCommand("email:refresh", () => refetch());
  useCommand("email:folder", (f: Folder) => {
    setActiveFolder(f);
    setShowReader(false);
    setSelectedId(null);
  });
  
  // Local Escape listener for closing dialogs/reader
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCompose(false);
        setShowReader(false);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Local shortcut listeners for actions requiring current selected email
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return;

      if ((e.key === "s" || e.key === "S") && selectedId && selectedMeta) {
        e.preventDefault();
        starMutation.mutate({ threadId: selectedId, starred: !selectedMeta.starred });
      } else if (e.key === "#" && selectedId) {
        e.preventDefault();
        trashMutation.mutate(selectedId);
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        setActiveFolder("inbox");
        setShowReader(false);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, selectedMeta, starMutation, trashMutation]);

  // ── Search with debounce ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchDraft), 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  // ── Reset selection on folder change ─────────────────────────────────────
  useEffect(() => {
    setSelectedId(null);
    setShowReader(false);
  }, [activeFolder]);

  // ── Connection loading state ───────────────────────────────────────────────
  if (isConnLoading) {
    return (
      <div className="h-full flex p-6 w-full">
        <div className="w-[340px] border-r border-border h-full animate-pulse flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 border-b border-border bg-secondary/10" />
          ))}
        </div>
        <div className="flex-1 p-8 animate-pulse space-y-4">
          <div className="h-10 bg-secondary/20 rounded-lg w-1/3" />
          <div className="h-[400px] bg-secondary/10 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (!connected) {
    return <ConnectGoogleCard service="gmail" />;
  }

  // Permission / auth error from Google
  if (isError && (error as any)?.status === 403) {
    return <ConnectGoogleCard service="gmail" forceNotConnected />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top nav ────────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          {/* Folder tabs */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {FOLDERS.map((folder) => (
              <button
                key={folder.key}
                id={`folder-${folder.key}`}
                onClick={() => setActiveFolder(folder.key)}
                className={`h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeFolder === folder.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <folder.icon className="size-3.5" />
                {folder.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="refresh-inbox"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh (R)"
              className="size-8 grid place-items-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <RefreshCw
                className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
            <button
              id="compose-email"
              onClick={() => setCompose(true)}
              title="Compose (C)"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <Pencil className="size-3.5" />
              Compose
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              id="email-search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search mail… (/)"
              className="w-full h-9 rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
            {searchDraft && (
              <button
                onClick={() => {
                  setSearchDraft("");
                  setSearch("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: list + reader ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Email List ────────────────────────────────────────────────── */}
        <section
          className={`${
            showReader ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-border overflow-hidden`}
        >
          {isLoading ? (
            <div className="flex-1 overflow-auto divide-y divide-border">
              {Array.from({ length: 10 }).map((_, i) => (
                <EmailRowSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              message="Could not load emails."
              onRetry={() => refetch()}
            />
          ) : threads.length === 0 ? (
            <EmptyState folder={activeFolder} hasSearch={!!search} />
          ) : (
            <div className="flex-1 overflow-auto" id="email-list">
              {threads.map((thread, idx) => (
                <EmailRow
                  key={thread.id}
                  thread={thread}
                  selected={selectedId === thread.id}
                  index={idx}
                  onSelect={() => {
                    setSelectedId(thread.id);
                    setShowReader(true);
                  }}
                  onStar={() =>
                    starMutation.mutate({
                      threadId: thread.id,
                      starred: !thread.starred,
                    })
                  }
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-2">
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                    <RefreshCw className="size-3.5 animate-spin" />
                    Loading more…
                  </div>
                )}
                {!hasNextPage && threads.length > 0 && (
                  <p className="text-center text-[10px] text-muted-foreground py-3 font-mono uppercase tracking-widest">
                    All caught up
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Email Reader ──────────────────────────────────────────────── */}
        <section
          className={`${
            showReader ? "flex" : "hidden"
          } md:flex flex-col flex-1 overflow-hidden bg-background`}
        >
          {selectedMeta ? (
            <>
              {/* Reader toolbar */}
              <div className="flex items-center gap-1 border-b border-border px-3 py-2 bg-background/80 backdrop-blur-sm">
                <button
                  onClick={() => setShowReader(false)}
                  className="md:hidden size-8 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  className="size-8 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground transition-colors"
                  title="Reply"
                  onClick={() => setCompose(true)}
                >
                  <Reply className="size-4" />
                </button>
                <button
                  className="size-8 rounded-lg hover:bg-secondary grid place-items-center transition-colors"
                  title={selectedMeta.starred ? "Unstar (S)" : "Star (S)"}
                  onClick={() =>
                    starMutation.mutate({
                      threadId: selectedId!,
                      starred: !selectedMeta.starred,
                    })
                  }
                >
                  {selectedMeta.starred ? (
                    <StarOff className="size-4 text-amber-500" />
                  ) : (
                    <Star className="size-4 text-muted-foreground" />
                  )}
                </button>

                {activeFolder === "trash" ? (
                  <button
                    className="size-8 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground transition-colors"
                    title="Restore"
                    onClick={() => restoreMutation.mutate(selectedId!)}
                  >
                    <RotateCcw className="size-4" />
                  </button>
                ) : (
                  <button
                    className="size-8 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground transition-colors"
                    title="Move to Trash (#)"
                    onClick={() => trashMutation.mutate(selectedId!)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <button className="ml-auto size-8 rounded-lg hover:bg-secondary grid place-items-center text-muted-foreground transition-colors">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>

              {/* Reader content */}
              {threadLoading ? (
                <ReaderSkeleton />
              ) : (
                <div className="flex-1 overflow-auto">
                  <div className="max-w-3xl mx-auto px-6 md:px-8 py-8">
                    {/* Subject */}
                    <h1 className="text-2xl font-medium tracking-tight mb-6 leading-tight">
                      {selectedMeta.subject || (
                        <span className="italic text-muted-foreground">
                          (No subject)
                        </span>
                      )}
                    </h1>

                    {/* Sender info */}
                    <div className="flex items-start gap-3 pb-6 mb-6 border-b border-border">
                      <div
                        className={`size-10 rounded-full grid place-items-center text-white text-sm font-semibold shrink-0 ${getAvatarColor(selectedMeta.from)}`}
                      >
                        {getInitials(selectedMeta.from)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">
                            {selectedMeta.from}
                          </span>
                          {selectedMeta.unread && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                              Unread
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{selectedMeta.fromEmail}</span>
                          <span>·</span>
                          <span>
                            {formatDistanceToNow(new Date(selectedMeta.date), {
                              addSuffix: true,
                            })}
                          </span>
                          {latestMessage?.headers.to && (
                            <>
                              <span>·</span>
                              <span>
                                to{" "}
                                <span className="text-foreground">
                                  {latestMessage.headers.to}
                                </span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email body */}
                    {threadDetail?.messages && threadDetail.messages.length > 0 ? (
                      <div className="space-y-8">
                        {threadDetail.messages.map((msg, idx) => (
                          <MessageBody
                            key={msg.id}
                            message={msg}
                            isLast={idx === threadDetail.messages.length - 1}
                            defaultExpanded={
                              idx === threadDetail.messages.length - 1
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        {selectedMeta.snippet || "No content available."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyReaderState />
          )}
        </section>
      </div>

      {compose && (
        <Composer
          replyTo={selectedMeta}
          onClose={() => setCompose(false)}
          onSent={() => {
            queryClient.invalidateQueries({ queryKey: ["gmail-threads"] });
          }}
        />
      )}

      {/* Keyboard shortcut hint */}
      <KeyboardShortcutsHint />
    </div>
  );
}

// ─── Empty / Error States ─────────────────────────────────────────────────────

function EmptyState({
  folder,
  hasSearch,
}: {
  folder: Folder;
  hasSearch: boolean;
}) {
  const iconMap: Record<Folder, typeof Inbox> = {
    inbox: Inbox,
    starred: Star,
    sent: Send,
    drafts: FileText,
    trash: Trash2,
  };
  const Icon = iconMap[folder];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="size-12 rounded-full bg-secondary grid place-items-center">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">
          {hasSearch ? "No results found" : `No emails in ${folder}`}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {hasSearch
            ? "Try a different search term"
            : folder === "inbox"
              ? "Your inbox is empty — great job!"
              : `Nothing here yet`}
        </p>
      </div>
    </div>
  );
}

function EmptyReaderState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
      <div className="size-14 rounded-2xl bg-secondary grid place-items-center">
        <Inbox className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Select an email to read</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose from your inbox on the left
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-3">
          Press <kbd className="font-mono bg-secondary px-1 py-0.5 rounded text-[10px]">C</kbd> to compose ·{" "}
          <kbd className="font-mono bg-secondary px-1 py-0.5 rounded text-[10px]">/</kbd> to search
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="size-12 rounded-full bg-rose-500/10 grid place-items-center">
        <AlertCircle className="size-5 text-rose-500" />
      </div>
      <div>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onRetry}
          className="mt-2 text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// ─── Email Row ─────────────────────────────────────────────────────────────────

function EmailRow({
  thread,
  selected,
  index,
  onSelect,
  onStar,
}: {
  thread: EmailThread;
  selected: boolean;
  index: number;
  onSelect: () => void;
  onStar: () => void;
}) {
  const initials = getInitials(thread.from);
  const avatarColor = getAvatarColor(thread.from);

  return (
    <button
      id={`email-row-${index}`}
      onClick={onSelect}
      className={`group w-full p-4 text-left transition-all border-b border-border/50 ${
        selected
          ? "bg-primary/8 border-l-2 border-l-primary"
          : "hover:bg-secondary/60 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="shrink-0 relative">
          <div
            className={`size-9 rounded-full grid place-items-center text-white text-xs font-semibold ${avatarColor}`}
          >
            {initials}
          </div>
          {thread.unread && (
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={`text-sm truncate ${
                thread.unread
                  ? "font-semibold text-foreground"
                  : "text-foreground/80"
              }`}
            >
              {thread.from}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Star toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStar();
                }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded"
                title={thread.starred ? "Unstar" : "Star (S)"}
              >
                {thread.starred ? (
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                ) : (
                  <Star className="size-3 text-muted-foreground" />
                )}
              </button>
              {thread.starred && (
                <Star className="size-3 fill-amber-400 text-amber-400 group-hover:hidden" />
              )}
              <span
                className={`text-[10px] font-mono whitespace-nowrap ${
                  thread.unread
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {formatEmailDate(thread.date)}
              </span>
            </div>
          </div>

          <div
            className={`text-xs mb-0.5 truncate ${
              thread.unread
                ? "font-medium text-foreground"
                : "text-foreground/70"
            }`}
          >
            {thread.subject || (
              <span className="italic text-muted-foreground">(No subject)</span>
            )}
            {thread.messageCount > 1 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">
                {thread.messageCount}
              </span>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground truncate leading-relaxed">
            {thread.snippet}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Message Body (collapsible in thread) ─────────────────────────────────────

function MessageBody({
  message,
  isLast,
  defaultExpanded,
}: {
  message: ThreadMessage;
  isLast: boolean;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasHtml = !!message.body.html;
  const hasText = !!message.body.text;

  return (
    <div
      className={`rounded-xl border ${
        expanded
          ? "border-border"
          : "border-transparent hover:border-border/50"
      } overflow-hidden transition-all`}
    >
      {!isLast && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/50 transition-colors"
        >
          <span className="text-xs text-muted-foreground">
            {message.headers.from}
          </span>
          <div className="flex items-center gap-2">
            {!expanded && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {message.snippet}
              </span>
            )}
            <ChevronDown
              className={`size-3.5 text-muted-foreground transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
      )}

      {expanded && (
        <div className="px-0 py-0">
          {hasHtml ? (
            <HtmlEmailBody html={message.body.html!} />
          ) : hasText ? (
            <div className="px-4 py-4">
              <pre className="text-sm leading-7 text-foreground/90 whitespace-pre-wrap font-sans break-words">
                {message.body.text}
              </pre>
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-muted-foreground italic">
              {message.snippet || "No content available."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Keyboard Shortcuts Hint ──────────────────────────────────────────────────

function KeyboardShortcutsHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          setVisible((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!visible) return null;

  const shortcuts = [
    { key: "C", desc: "Compose" },
    { key: "J", desc: "Next email" },
    { key: "K", desc: "Previous email" },
    { key: "/", desc: "Search" },
    { key: "S", desc: "Star / Unstar" },
    { key: "#", desc: "Move to Trash" },
    { key: "U", desc: "Back to Inbox" },
    { key: "Esc", desc: "Close / Back" },
    { key: "?", desc: "Toggle shortcuts" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
          <button onClick={() => setVisible(false)}>
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="font-mono bg-secondary px-2 py-0.5 rounded text-foreground text-[10px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-4">Press ? to dismiss</p>
      </div>
    </div>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function Composer({
  replyTo,
  onClose,
  onSent,
}: {
  replyTo?: EmailThread | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [to, setTo] = useState(replyTo?.fromEmail ?? "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(
    replyTo?.subject
      ? replyTo.subject.startsWith("Re:")
        ? replyTo.subject
        : `Re: ${replyTo.subject}`
      : ""
  );
  const [body, setBody] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, cc, bcc, subject, message: body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to send");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Message sent");
      onSent();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  function send(e: FormEvent) {
    e.preventDefault();
    if (!to.trim()) {
      toast.error("Recipient is required");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }
    sendMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex sm:items-end sm:justify-end sm:p-5">
      <div className="bg-card w-full sm:max-w-lg sm:rounded-2xl border border-border shadow-elevated flex flex-col h-full sm:h-auto sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">
            {replyTo ? "Reply" : "New message"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={send} className="flex-1 flex flex-col overflow-hidden">
          <ComposeField
            label="To"
            value={to}
            onChange={setTo}
            placeholder="recipient@example.com"
            right={
              !showCcBcc && (
                <button
                  type="button"
                  onClick={() => setShowCcBcc(true)}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  Cc / Bcc
                </button>
              )
            }
          />
          {showCcBcc && (
            <>
              <ComposeField label="Cc" value={cc} onChange={setCc} />
              <ComposeField label="Bcc" value={bcc} onChange={setBcc} />
            </>
          )}
          <ComposeField label="Subject" value={subject} onChange={setSubject} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            className="flex-1 min-h-[180px] px-4 py-3 text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between gap-2 p-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:shadow-glow transition-all disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {sendMutation.isPending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ComposeField({
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
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-10 shrink-0">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-10 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {right}
    </div>
  );
}
