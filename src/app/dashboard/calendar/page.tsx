"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Clock,
  Calendar as CalIcon,
  RefreshCw,
  MapPin,
  Users,
  ChevronDown,
} from "lucide-react";
import { ConnectGoogleCard } from "@/components/dashboard/connect-google-card";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow, format, isToday, isTomorrow, isThisWeek } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type Evt = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  notes?: string;
  location?: string;
  attendees?: string;
  color?: string;
};

type ViewMode = "month" | "week";

// ─── Color palette for events ─────────────────────────────────────────────────

const EVENT_COLORS = [
  { id: "violet", bg: "bg-violet-500/20", text: "text-violet-700 dark:text-violet-300", border: "border-violet-500/40", dot: "bg-violet-500" },
  { id: "blue",   bg: "bg-blue-500/20",   text: "text-blue-700 dark:text-blue-300",     border: "border-blue-500/40",   dot: "bg-blue-500" },
  { id: "emerald",bg: "bg-emerald-500/20",text: "text-emerald-700 dark:text-emerald-300",border:"border-emerald-500/40",dot: "bg-emerald-500" },
  { id: "amber",  bg: "bg-amber-500/20",  text: "text-amber-700 dark:text-amber-300",   border: "border-amber-500/40",  dot: "bg-amber-500" },
  { id: "rose",   bg: "bg-rose-500/20",   text: "text-rose-700 dark:text-rose-300",     border: "border-rose-500/40",   dot: "bg-rose-500" },
];

function getEventColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }
function isoDateOffset(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d);
}
function addMonths(d: Date, n: number) {
  const x = new Date(d); x.setMonth(x.getMonth() + n); return x;
}
function addWeeks(d: Date, n: number) {
  const x = new Date(d); x.setDate(x.getDate() + n * 7); return x;
}
function buildMonth(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first); start.setDate(1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
}
function buildWeek(cursor: Date) {
  const day = cursor.getDay();
  const monday = new Date(cursor);
  monday.setDate(cursor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });
}
function formatUpcomingDate(iso: string) {
  const d = new Date(iso + "T00:00");
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, "EEEE");
  return format(d, "MMM d");
}
function parseRawEvent(e: any): Evt {
  let dateStr = "", startStr = "00:00", endStr = "23:59";
  if (e.start?.dateTime) {
    const d = new Date(e.start.dateTime);
    dateStr = e.start.dateTime.slice(0, 10);
    startStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } else if (e.start?.date) {
    dateStr = e.start.date;
  }
  if (e.end?.dateTime) {
    const d = new Date(e.end.dateTime);
    endStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
  return {
    id: e.id,
    title: e.summary || "No Title",
    date: dateStr,
    start: startStr,
    end: endStr,
    notes: e.description || "",
    location: e.location || "",
    attendees: e.attendees?.map((a: any) => a.email).join(", ") || "",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="flex-1 animate-pulse">
      <div className="grid grid-cols-7 border-b border-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-secondary/40 border-r border-border last:border-r-0" />
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[88px] border-r border-b border-border last:border-r-0 p-2 space-y-1.5"
          >
            <div className="h-3 w-5 bg-muted rounded" />
            {i % 5 === 0 && <div className="h-4 bg-muted/60 rounded w-full" />}
            {i % 8 === 0 && <div className="h-4 bg-muted/40 rounded w-3/4" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hours for week view ──────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [editing, setEditing] = useState<Evt | null>(null);
  const [creating, setCreating] = useState<{ date: string; hour?: number } | null>(null);

  const { data: conn, isLoading: isConnLoading } = useConnectionStatus();
  const connected = conn?.googlecalendar;
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    refetchInterval: 60000,
    enabled: !!connected,
  });

  const rawEvents = data?.events || [];

  const events: Evt[] = useMemo(
    () => rawEvents.filter((e: any) => e.start?.dateTime || e.start?.date).map(parseRawEvent),
    [rawEvents],
  );

  const upcoming = useMemo(() => {
    const today = isoDate(new Date());
    return events
      .filter((e) => e.date >= today)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .slice(0, 8);
  }, [events]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (e: Evt) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/calendar/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e, timeZone }),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Event created"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (e: Evt) => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/calendar/events/${e.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...e, timeZone }),
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Event updated"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Event deleted"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLoading2 = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (isConnLoading) {
    return (
      <div className="h-full flex flex-col p-6">
        <CalendarSkeleton />
      </div>
    );
  }

  if (!connected || isError) {
    return <ConnectGoogleCard service="googlecalendar" forceNotConnected={isError} />;
  }

  const monthDays = buildMonth(cursor);
  const weekDays = buildWeek(cursor);
  const todayIso = isoDate(new Date());

  const headerLabel =
    view === "month"
      ? cursor.toLocaleString("default", { month: "long", year: "numeric" })
      : (() => {
          const week = buildWeek(cursor);
          const first = week[0]; const last = week[6];
          if (first.getMonth() === last.getMonth())
            return `${format(first, "MMM d")} – ${format(last, "d, yyyy")}`;
          return `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
        })();

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
      {/* ── Main calendar area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap bg-background/80 backdrop-blur-sm">
          {/* Nav arrows + today */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => view === "month" ? setCursor(addMonths(cursor, -1)) : setCursor(addWeeks(cursor, -1))}
              className="size-8 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => view === "month" ? setCursor(addMonths(cursor, 1)) : setCursor(addWeeks(cursor, 1))}
              className="size-8 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <h2 className="text-sm font-semibold min-w-[160px]">{headerLabel}</h2>

          <button
            onClick={() => setCursor(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            Today
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              {(["month", "week"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 h-8 text-xs font-medium transition-colors capitalize ${
                    view === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="size-8 grid place-items-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setCreating({ date: todayIso })}
              className="flex items-center gap-1.5 px-3 h-8 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:shadow-glow transition-all"
            >
              <Plus className="size-3.5" /> New event
            </button>
          </div>
        </div>

        {isLoading ? (
          <CalendarSkeleton />
        ) : view === "month" ? (
          <MonthView
            days={monthDays}
            events={events}
            cursor={cursor}
            todayIso={todayIso}
            onDayClick={(iso) => setCreating({ date: iso })}
            onEventClick={(e) => setEditing(e)}
          />
        ) : (
          <WeekView
            days={weekDays}
            events={events}
            todayIso={todayIso}
            onSlotClick={(iso, h) => setCreating({ date: iso, hour: h })}
            onEventClick={(e) => setEditing(e)}
          />
        )}
      </div>

      {/* ── Upcoming sidebar ───────────────────────────────────────────── */}
      <aside className="lg:w-72 lg:shrink-0 lg:border-l border-t lg:border-t-0 border-border overflow-auto bg-background">
        <div className="p-4 sm:p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Upcoming events
          </p>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalIcon className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => {
                const color = getEventColor(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => setEditing(e)}
                    className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 size-2 rounded-full shrink-0 ${color.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {e.title}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                          <CalIcon className="size-3 shrink-0" />
                          <span>{formatUpcomingDate(e.date)}</span>
                          <span className="mx-0.5">·</span>
                          <Clock className="size-3 shrink-0" />
                          <span>{e.start}–{e.end}</span>
                        </div>
                        {e.location && (
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{e.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Event modal ────────────────────────────────────────────────── */}
      {(editing || creating) && (
        <EventModal
          initial={
            editing ?? {
              id: "", title: "", date: creating?.date ?? todayIso,
              start: creating?.hour !== undefined ? `${creating.hour.toString().padStart(2, '0')}:00` : "09:00",
              end: creating?.hour !== undefined ? `${(creating.hour + 1).toString().padStart(2, '0')}:00` : "10:00",
              notes: "", location: "", attendees: "",
            }
          }
          isNew={!editing}
          isLoading={isLoading2}
          onClose={() => { setEditing(null); setCreating(null); }}
          onSave={(e) => {
            if (editing) {
              updateMutation.mutate(e, { onSuccess: () => { setEditing(null); setCreating(null); } });
            } else {
              createMutation.mutate(e, { onSuccess: () => { setEditing(null); setCreating(null); } });
            }
          }}
          onDelete={editing ? () => {
            deleteMutation.mutate(editing.id, { onSuccess: () => { setEditing(null); } });
          } : undefined}
        />
      )}
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  days, events, cursor, todayIso,
  onDayClick, onEventClick,
}: {
  days: Date[]; events: Evt[]; cursor: Date; todayIso: string;
  onDayClick: (iso: string) => void; onEventClick: (e: Evt) => void;
}) {
  const [expandDay, setExpandDay] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center border-r border-border last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((d) => {
          const iso = isoDate(d);
          const dayEvents = events.filter((e) => e.date === iso);
          const isCurrentMonth = d.getMonth() === cursor.getMonth();
          const isCurrentDay = iso === todayIso;
          const isExpanded = expandDay === iso;

          return (
            <div
              key={iso}
              onClick={() => onDayClick(iso)}
              className={`min-h-[88px] border-r border-b border-border last:border-r-0 transition-colors cursor-pointer ${
                isCurrentMonth ? "bg-background hover:bg-secondary/30" : "bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <div className="p-1.5">
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`size-6 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      isCurrentDay
                        ? "bg-primary text-primary-foreground"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  {(isExpanded ? dayEvents : dayEvents.slice(0, 3)).map((e) => {
                    const color = getEventColor(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded-md truncate border ${color.bg} ${color.text} ${color.border} hover:opacity-80 transition-opacity`}
                      >
                        {e.start !== "00:00" && <span className="opacity-70 mr-1">{e.start}</span>}
                        {e.title}
                      </button>
                    );
                  })}
                  {!isExpanded && dayEvents.length > 3 && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); setExpandDay(isExpanded ? null : iso); }}
                      className="w-full text-left text-[10px] text-muted-foreground hover:text-foreground px-1.5 transition-colors flex items-center gap-0.5"
                    >
                      <ChevronDown className="size-3" />
                      {dayEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  days, events, todayIso, onSlotClick, onEventClick,
}: {
  days: Date[]; events: Evt[]; todayIso: string;
  onSlotClick: (iso: string, h: number) => void; onEventClick: (e: Evt) => void;
}) {
  const currentHour = new Date().getHours();

  return (
    <div className="flex-1 overflow-auto">
      {/* Header row with day names */}
      <div className="sticky top-0 z-10 bg-background border-b border-border grid grid-cols-[56px_repeat(7,1fr)]">
        <div className="border-r border-border" />
        {days.map((d) => {
          const iso = isoDate(d);
          const isCurrentDay = iso === todayIso;
          return (
            <div
              key={iso}
              className={`px-2 py-2 text-center border-r border-border last:border-r-0 ${isCurrentDay ? "bg-primary/5" : ""}`}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {format(d, "EEE")}
              </p>
              <div
                className={`mx-auto mt-0.5 size-7 flex items-center justify-center rounded-full text-sm font-semibold ${
                  isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
        {/* Time labels column */}
        <div>
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-14 border-b border-border border-r border-border flex items-start justify-end pr-2 pt-0.5"
            >
              <span className="text-[10px] font-mono text-muted-foreground">
                {h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d) => {
          const iso = isoDate(d);
          const isCurrentDay = iso === todayIso;
          const dayEvents = events.filter((e) => e.date === iso);

          return (
            <div
              key={iso}
              className={`relative border-r border-border last:border-r-0 ${isCurrentDay ? "bg-primary/3" : ""}`}
            >
              {/* Hour slots */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  onClick={() => onSlotClick(iso, h)}
                  className="h-14 border-b border-border hover:bg-secondary/40 cursor-pointer transition-colors"
                />
              ))}

              {/* Current time indicator */}
              {isCurrentDay && (
                <div
                  className="absolute left-0 right-0 z-10 pointer-events-none"
                  style={{ top: `${(currentHour / 24) * 100}%` }}
                >
                  <div className="flex items-center">
                    <div className="size-2 rounded-full bg-red-500 -ml-1" />
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                </div>
              )}

              {/* Events */}
              {dayEvents.map((e) => {
                const [startH, startM] = e.start.split(":").map(Number);
                const [endH, endM] = e.end.split(":").map(Number);
                const top = ((startH * 60 + startM) / (24 * 60)) * 100;
                const height = Math.max(
                  ((endH * 60 + endM - startH * 60 - startM) / (24 * 60)) * 100,
                  2,
                );
                const color = getEventColor(e.id);

                return (
                  <button
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    className={`absolute left-0.5 right-0.5 z-10 rounded-md px-1.5 py-0.5 text-left overflow-hidden border ${color.bg} ${color.text} ${color.border} hover:opacity-80 transition-opacity`}
                    style={{ top: `${top}%`, height: `${height}%`, minHeight: "20px" }}
                  >
                    <p className="text-[10px] font-medium truncate leading-tight">{e.title}</p>
                    {height > 4 && (
                      <p className="text-[9px] opacity-70 truncate">{e.start}</p>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Event Modal ──────────────────────────────────────────────────────────────

function EventModal({
  initial, isNew, isLoading, onClose, onSave, onDelete,
}: {
  initial: Evt; isNew: boolean; isLoading: boolean;
  onClose: () => void; onSave: (e: Evt) => void; onDelete?: () => void;
}) {
  const [e, setE] = useState<Evt>(initial);

  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!e.title.trim()) { toast.error("Event title is required"); return; }
    if (isLoading) return;
    onSave(e);
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm grid place-items-center p-4">
      <form
        onSubmit={submit}
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-elevated overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">{isNew ? "New event" : "Edit event"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Title *</label>
            <input
              autoFocus
              value={e.title}
              onChange={(ev) => setE({ ...e, title: ev.target.value })}
              placeholder="Event title"
              disabled={isLoading}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 transition-all"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Date *</label>
            <input
              type="date"
              value={e.date}
              onChange={(ev) => setE({ ...e, date: ev.target.value })}
              disabled={isLoading}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
            />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Start *</label>
              <input
                type="time"
                value={e.start}
                onChange={(ev) => setE({ ...e, start: ev.target.value })}
                disabled={isLoading}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">End *</label>
              <input
                type="time"
                value={e.end}
                onChange={(ev) => setE({ ...e, end: ev.target.value })}
                disabled={isLoading}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="size-3 text-muted-foreground" /> Location
            </label>
            <input
              value={e.location ?? ""}
              onChange={(ev) => setE({ ...e, location: ev.target.value })}
              placeholder="Add location"
              disabled={isLoading}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
            />
          </div>

          {/* Attendees */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <Users className="size-3 text-muted-foreground" /> Attendees
            </label>
            <input
              value={e.attendees ?? ""}
              onChange={(ev) => setE({ ...e, attendees: ev.target.value })}
              placeholder="email@example.com, another@example.com"
              disabled={isLoading}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Notes</label>
            <textarea
              value={e.notes ?? ""}
              onChange={(ev) => setE({ ...e, notes: ev.target.value })}
              rows={3}
              placeholder="Add description…"
              disabled={isLoading}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-50 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border bg-secondary/20">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:shadow-glow transition-all disabled:opacity-50"
            >
              {isLoading && <RefreshCw className="size-3.5 animate-spin" />}
              {isNew ? "Create event" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
