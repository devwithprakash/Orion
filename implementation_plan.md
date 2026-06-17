# Email Workspace Stabilization & Production Readiness

## Overview
This plan addresses the remaining production readiness issues for the Orion Email and Calendar workspaces, focusing on the five requested areas: "Unknown Sender" resolution, Command Palette (Ctrl+K), Global Keyboard Shortcuts, Command Palette + Shortcut Integration, and deep Performance Optimization.

## Proposed Changes

### 1. Fix "Unknown Sender" (Email Fetching Pipeline)
The root cause of "Unknown Sender" is the caching layer returning mismatched formats, and our extraction logic assuming the first message always contains the correct sender for the inbox. 
**Changes:**
- **Fetch Logic:** We will bypass the fragile `metadata` cache assumptions and always fetch fully hydrated threads in `fetchAndCacheGmailThreads` using `format: "full"`.
- **Extraction Logic:** Update `api/gmail/threads/route.ts` to iterate backwards through thread messages to find the most recent incoming message's `From` header.
- **Robust Parsing:** Enhance `parseFrom` to handle multiline headers and complex nested quotes often found in newsletter and corporate emails.

### 2. Command Palette (Ctrl + K) & Global Shortcuts
We will implement a unified, modern Command Palette (`cmdk`) that integrates directly with a global shortcut registry.

**Changes:**
- **Shortcut Registry Context:** Create `src/components/providers/shortcut-provider.tsx` to handle global keydowns (`C`, `G I`, `/`, etc.) and prevent conflicts when focused in inputs, textareas, or rich text editors.
- **Command Palette Component:** Create `src/components/dashboard/command-palette.tsx` using `cmdk`. It will group actions:
  - Navigation: Inbox, Starred, Sent, Drafts, Trash, Settings
  - Actions: Compose Email, Search Emails, Refresh
- **Shared Actions:** Both the keystroke listeners and the Command Palette options will trigger the exact same functions (e.g., opening the compose modal, router navigation).

### 3. Performance Optimization (Sub-1s Load Times)
The current architecture blocks page loads on Google API roundtrips. We will switch to an optimistic, asynchronous cache-first architecture.

**Changes:**
- **Frontend Query Optimization:** Update `useInfiniteQuery` in the Email Page to use `staleTime: 60000` (1 min), enable background refetching (`refetchOnWindowFocus`), and use `keepPreviousData` for instant folder switching.
- **Backend Cache-First Routing:** Modify `/api/gmail/threads` to *only* query the local Corsair database cache (`db.threads.list`). It will return instantly.
- **Background Sync API:** Modify the sync logic so that the frontend issues a non-blocking `fetch('/api/sync/gmail')` upon loading, which pulls fresh data from Google into the database in the background. The UI will update reactively via TanStack Query when the background sync completes.
- **Calendar Optimization:** Apply the exact same DB-first + background sync pattern to `/api/calendar/events`.

## Verification Plan

### Automated Tests
- TypeScript compilation to ensure all new providers and components are type-safe.

### Manual Verification
- **Command Palette:** Press `Ctrl + K`. Verify search filters correctly. Press `Enter` to navigate. Press `Esc` to close.
- **Shortcuts:** Press `G` then `I` to go to Inbox. Press `C` to open compose. Focus an input and verify `C` types a character instead of opening compose.
- **Performance:** Reload the page. Verify emails appear instantly from cache, and new emails pop in seamlessly seconds later.
- **Senders:** Verify that all emails correctly display a sender name or email, and "Unknown" is gone.

## User Review Required
> [!IMPORTANT]
> The performance optimization requires shifting from synchronous Google API fetches to asynchronous background syncs. This means that for 1-2 seconds after a hard refresh, the user will see the *cached* state of their inbox before new emails pop in. This is the industry standard (Gmail/Linear pattern), but please confirm this behavior is acceptable.

Please review and approve this plan to proceed with implementation.
