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
} from "lucide-react";

type Evt = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  notes?: string;
};

const initial: Evt[] = [
  {
    id: "1",
    title: "Standup",
    date: isoDateOffset(0),
    start: "09:00",
    end: "09:30",
  },
  {
    id: "2",
    title: "Friend @ Corsair",
    date: isoDateOffset(3),
    start: "09:00",
    end: "10:00",
    notes: "Integration kickoff",
  },
  {
    id: "3",
    title: "Design review",
    date: isoDateOffset(2),
    start: "14:00",
    end: "16:00",
  },
  {
    id: "4",
    title: "Lunch with Alex",
    date: isoDateOffset(1),
    start: "12:30",
    end: "13:30",
  },
  {
    id: "5",
    title: "Roadmap planning",
    date: isoDateOffset(4),
    start: "15:00",
    end: "17:00",
  },
];

function isoDateOffset(d: number) {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Evt[]>(initial);
  const [cursor, setCursor] = useState(new Date());
  const [editing, setEditing] = useState<Evt | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  const monthDays = useMemo(() => buildMonth(cursor), [cursor]);
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.date >= today)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .slice(0, 6);
  }, [events]);

  const monthName = cursor.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(addMonths(cursor, -1))}
              className="size-8 grid place-items-center rounded hover:bg-secondary text-muted-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              className="size-8 grid place-items-center rounded hover:bg-secondary text-muted-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <h2 className="text-lg font-medium">{monthName}</h2>
          <button
            onClick={() => setCursor(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary"
          >
            Today
          </button>
          <button
            onClick={() => setCreating(new Date().toISOString().slice(0, 10))}
            className="ml-auto flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:shadow-glow transition-all"
          >
            <Plus className="size-4" /> Event
          </button>
        </div>

        {/* Month grid */}
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="grid grid-cols-7 border-b border-border">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center border-r border-border last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {monthDays.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const dayEvents = events.filter((e) => e.date === iso);
              const isToday = iso === new Date().toISOString().slice(0, 10);
              const inMonth = d.getMonth() === cursor.getMonth();
              return (
                <button
                  key={iso}
                  onClick={() => setCreating(iso)}
                  className={`min-h-[88px] text-left p-2 border-r border-b border-border last:border-r-0 hover:bg-secondary/40 transition-colors ${!inMonth ? "bg-secondary/20 text-muted-foreground" : ""}`}
                >
                  <div
                    className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : ""}`}
                  >
                    {d.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setEditing(e);
                        }}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-primary/15 text-foreground border border-primary/30 truncate"
                      >
                        {e.start} {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming sidebar */}
      <aside className="lg:w-80 lg:shrink-0 lg:border-l border-t lg:border-t-0 border-border p-4 sm:p-5 overflow-auto">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Upcoming
        </div>
        <div className="space-y-2">
          {upcoming.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No upcoming events.
            </div>
          )}
          {upcoming.map((e) => (
            <button
              key={e.id}
              onClick={() => setEditing(e)}
              className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="text-sm font-medium truncate">{e.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <CalIcon className="size-3" /> {formatDate(e.date)}
                <span className="mx-1">·</span>
                <Clock className="size-3" /> {e.start}–{e.end}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {(editing || creating) && (
        <EventModal
          initial={
            editing ?? {
              id: crypto.randomUUID(),
              title: "",
              date: creating ?? isoDateOffset(0),
              start: "09:00",
              end: "10:00",
            }
          }
          isNew={!editing}
          onClose={() => {
            setEditing(null);
            setCreating(null);
          }}
          onSave={(e) => {
            setEvents((prev) =>
              editing ? prev.map((p) => (p.id === e.id ? e : p)) : [...prev, e],
            );
            setEditing(null);
            setCreating(null);
          }}
          onDelete={
            editing
              ? () => {
                  setEvents((p) => p.filter((x) => x.id !== editing.id));
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function EventModal({
  initial,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  initial: Evt;
  isNew: boolean;
  onClose: () => void;
  onSave: (e: Evt) => void;
  onDelete?: () => void;
}) {
  const [e, setE] = useState<Evt>(initial);
  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!e.title.trim()) return;
    onSave(e);
  }
  return (
    <div className="fixed inset-0 z-50 bg-foreground/30 grid place-items-center p-4">
      <form
        onSubmit={submit}
        className="bg-card w-full max-w-md rounded-2xl border border-border shadow-elevated"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">
            {isNew ? "New event" : "Edit event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Title</label>
            <input
              autoFocus
              value={e.title}
              onChange={(ev) => setE({ ...e, title: ev.target.value })}
              placeholder="Event title"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Date</label>
            <input
              type="date"
              value={e.date}
              onChange={(ev) => setE({ ...e, date: ev.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Start</label>
              <input
                type="time"
                value={e.start}
                onChange={(ev) => setE({ ...e, start: ev.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">End</label>
              <input
                type="time"
                value={e.end}
                onChange={(ev) => setE({ ...e, end: ev.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Notes</label>
            <textarea
              value={e.notes ?? ""}
              onChange={(ev) => setE({ ...e, notes: ev.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 p-4 border-t border-border">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10"
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
              className="text-xs px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:shadow-glow transition-all"
            >
              {isNew ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function buildMonth(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Monday start
  const start = new Date(first);
  start.setDate(1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function formatDate(iso: string) {
  const d = new Date(iso + "T00:00");
  return d.toLocaleDateString("default", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
