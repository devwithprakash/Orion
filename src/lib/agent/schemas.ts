import { z } from "zod";

// ─── Individual Action Schemas ────────────────────────────────────────────────

export const SendEmailActionSchema = z.object({
  type: z.literal("send_email"),
  to: z.string().email("Invalid recipient email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
});

export const CreateCalendarEventActionSchema = z.object({
  type: z.literal("create_calendar_event"),
  title: z.string().min(1, "Event title is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
  attendees: z.array(z.string().email()).optional().default([]),
  notes: z.string().optional(),
  timeZone: z.string().optional().default("UTC"),
});

export const SummarizeEmailsActionSchema = z.object({
  type: z.literal("summarize_emails"),
  limit: z.number().int().min(1).max(20).default(5),
});

export const AgentActionSchema = z.discriminatedUnion("type", [
  SendEmailActionSchema,
  CreateCalendarEventActionSchema,
  SummarizeEmailsActionSchema,
]);

// ─── Top-Level Plan Schema ────────────────────────────────────────────────────

export const AgentPlanSchema = z.object({
  understood: z.string().min(1),
  // actions may be omitted for informational/conversational responses — default to []
  actions: z
    .array(AgentActionSchema)
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  // AI sometimes returns null — normalise to undefined
  clarificationNeeded: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
});

// ─── Execution Result Schemas ─────────────────────────────────────────────────

export const ActionResultSchema = z.object({
  type: z.string(),
  status: z.enum(["success", "failed", "skipped"]),
  summary: z.string(),
  error: z.string().optional(),
});

export const AgentRunResultSchema = z.object({
  understood: z.string(),
  clarificationNeeded: z.string().optional(),
  actions: z.array(ActionResultSchema),
  usage: z.object({
    used: z.number(),
    remaining: z.number(),
    limit: z.number(),
  }),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type SendEmailAction = z.infer<typeof SendEmailActionSchema>;
export type CreateCalendarEventAction = z.infer<typeof CreateCalendarEventActionSchema>;
export type SummarizeEmailsAction = z.infer<typeof SummarizeEmailsActionSchema>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
export type AgentPlan = z.infer<typeof AgentPlanSchema>;
export type ActionResult = z.infer<typeof ActionResultSchema>;
export type AgentRunResult = z.infer<typeof AgentRunResultSchema>;
