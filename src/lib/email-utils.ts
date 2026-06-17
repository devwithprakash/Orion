import { z } from "zod";

// ─── Shared "From" header parser ─────────────────────────────────────────────
/**
 * Parses a raw "From" header into name + email.
 * Handles:
 *   "John Doe <john@example.com>"  → { name: "John Doe",  email: "john@example.com" }
 *   "<john@example.com>"           → { name: "",          email: "john@example.com" }
 *   "john@example.com"             → { name: "",          email: "john@example.com" }
 *   "=?UTF-8?Q?...?= <x@y.com>"   → decoded name + email
 */
export function parseFrom(raw: string): { name: string; email: string } {
  if (!raw || !raw.trim()) return { name: "", email: "" };

  // Decode RFC 2047 encoded-word (=?charset?encoding?text?=)
  const decoded = raw.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g,
    (_, charset, encoding, text) => {
      try {
        if (encoding.toUpperCase() === "B") {
          return Buffer.from(text, "base64").toString("utf-8");
        } else {
          // Q encoding: _ → space, =XX → hex
          return text.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_: string, h: string) =>
            String.fromCharCode(parseInt(h, 16))
          );
        }
      } catch {
        return text;
      }
    }
  );

  // Pattern: "Name <email>"  or  "<email>"
  const angleMatch = decoded.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/^["']|["']$/g, "");
    const email = angleMatch[2].trim().toLowerCase();
    return { name, email };
  }

  // Pattern: bare email address
  const emailOnly = decoded.trim();
  if (emailOnly.includes("@")) {
    return { name: "", email: emailOnly.toLowerCase() };
  }

  return { name: emailOnly, email: "" };
}

/** Returns display name: prefers real name, falls back to email local-part, then "Unknown" */
export function displayName(name: string, email: string): string {
  if (name) return name;
  if (email) return email.split("@")[0];
  return "Unknown";
}

// ─── Generic header extractor ─────────────────────────────────────────────────
export function getHeader(
  hdrs: { name?: string; value?: string }[] | undefined,
  headerName: string
): string {
  return (
    hdrs?.find((h) => h.name?.toLowerCase() === headerName.toLowerCase())
      ?.value ?? ""
  );
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const threadListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  pageToken: z.string().optional(),
  folder: z
    .enum(["inbox", "starred", "sent", "drafts", "trash", "all"])
    .default("inbox"),
  q: z.string().optional(),
});

export const sendEmailSchema = z.object({
  to: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message body is required"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  threadId: z.string().optional(),
});

export const syncQuerySchema = z.object({
  force: z.coerce.boolean().default(false),
});

// ─── Folder → Gmail label mapping ────────────────────────────────────────────
export const FOLDER_LABEL_MAP: Record<string, string> = {
  inbox: "INBOX",
  starred: "STARRED",
  sent: "SENT",
  drafts: "DRAFT",
  trash: "TRASH",
};

// ─── Enriched thread type ─────────────────────────────────────────────────────
export type EnrichedThread = {
  id: string;
  messageCount: number;
  from: string;
  fromEmail: string;
  subject: string | null;
  snippet: string;
  date: string;
  unread: boolean;
  starred: boolean;
  inInbox: boolean;
  labelIds: string[];
};
