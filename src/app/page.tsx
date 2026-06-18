import {
  Mail,
  Calendar,
  Bot,
  ArrowRight,
  Check,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative px-5 sm:px-6 pt-20 sm:pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/20 blur-[120px] rounded-full" />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mb-6 leading-[1.05]">
            Email and calendar, <br />
            <span className="font-medium italic">finally on your side.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-9 max-w-xl mx-auto leading-relaxed">
            Manage Gmail and Google Calendar directly, or let the Orion agent
            take over with natural language. You choose the speed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:shadow-glow transition-all"
            >
              Get Started{" "}
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#product"
              className="px-6 py-3 rounded-xl border border-border font-medium hover:bg-secondary transition-colors"
            >
              See it in action
            </a>
          </div>
        </div>

        {/* Agent demo */}
        <div className="max-w-2xl mx-auto mt-16 sm:mt-20 p-2 border border-border rounded-2xl bg-card shadow-elevated">
          <div className="bg-background rounded-xl overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/40">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Agent active
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                ⌘K
              </span>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-secondary border border-border grid place-items-center text-[10px] font-mono shrink-0">
                  YOU
                </div>
                <div className="bg-secondary px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed min-w-0">
                  Schedule 30 min with{" "}
                  <span className="text-primary">friend@orion.dev</span>{" "}
                  Thursday and send him a heads-up.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-lg bg-primary grid place-items-center text-[10px] font-mono text-primary-foreground shrink-0">
                  O
                </div>
                <div className="flex-1 min-w-0 border border-primary/20 bg-accent-soft/40 rounded-2xl rounded-tl-sm p-3 space-y-2">
                  {[
                    "Created calendar event Thu 9:00",
                    "Sent invitation",
                    "Drafted and sent email",
                  ].map((s, i) => (
                    <div key={s} className="flex items-center gap-2.5 text-sm">
                      <span className="size-4 rounded-full bg-primary/20 grid place-items-center text-primary">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                      <span className="truncate">{s}</span>
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground shrink-0">
                        {(0.2 + i * 0.15).toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section
        id="features"
        className="px-5 sm:px-6 py-20 sm:py-24 bg-secondary/40 border-y border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
              Real workflows
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
              Outcomes,{" "}
              <span className="font-medium italic">not features.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                p: "Draft a reply to Sarah confirming the launch date.",
                o: "Reply drafted in your voice · queued for review.",
              },
              {
                p: "Move all my Friday meetings to next Monday.",
                o: "4 events moved · conflicts resolved · attendees notified.",
              },
              {
                p: "Summarize my inbox while I was away.",
                o: "12 threads grouped by priority · 3 require action.",
              },
            ].map((w) => (
              <div
                key={w.p}
                className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  PROMPT
                </div>
                <p className="text-sm font-medium mb-4 leading-relaxed">
                  "{w.p}"
                </p>
                <div className="text-xs font-mono text-primary mb-2">
                  RESULT
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {w.o}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section id="product" className="px-5 sm:px-6 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
              One workspace
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
              Inbox, calendar, agent —{" "}
              <span className="font-medium italic">together.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                i: Mail,
                t: "Gmail",
                d: "A premium inbox built for keyboard-first reading and replying.",
              },
              {
                i: Calendar,
                t: "Calendar",
                d: "Create, edit, and reschedule events with a single click or prompt.",
              },
              {
                i: Bot,
                t: "Agent",
                d: "Delegate multi-step work and watch it execute in real time.",
              },
            ].map(({ i: Icon, t, d }) => (
              <div
                key={t}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div className="size-10 rounded-xl bg-accent-soft text-primary grid place-items-center mb-4">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — manual + AI */}
      <section className="px-5 sm:px-6 py-20 sm:py-24 bg-secondary/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
              Two ways to work
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
              How Orion works
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-7 rounded-2xl border border-border bg-card">
              <div className="size-10 rounded-xl bg-secondary text-foreground grid place-items-center mb-5">
                <MousePointerClick className="size-5" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Manual workflow
              </div>
              <h3 className="text-xl font-semibold mb-2">Drive it yourself</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Use Orion like a polished, keyboard-first Gmail and Calendar.
                Compose, reply, schedule, reschedule — all directly, no AI
                required.
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  "Premium inbox with compose & drafts",
                  "Full calendar CRUD with event details",
                  "Keyboard shortcuts everywhere",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-7 rounded-2xl border border-primary/30 bg-card shadow-glow">
              <div className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-5">
                <Sparkles className="size-5" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                AI workflow
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Hand it to the agent
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Ask Orion in plain language. It chains actions across Gmail and
                Calendar, shows you each step, and waits for approval on
                anything sensitive.
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  "Natural-language commands",
                  "Multi-step execution with live status",
                  "Approval gates for external actions",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-6 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-4">
            Let Orion handle{" "}
            <span className="font-medium italic">the busywork.</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect Gmail and Calendar in minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-medium hover:shadow-glow transition-all"
          >
            Get started with Orion <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
