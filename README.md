# Orion – AI-Powered Email & Calendar Workspace

**Live Demo**: https://orion.prakashjangid.in

**Demo Credentials**:
- **Email**: captainlevi964@gmail.com
- **Password**: Demo@1234

## 1. Project Name & Description

**Orion** is a unified email and calendar workspace that intelligently aggregates your Gmail and Google Calendar data into a single, intuitive interface. Powered by an AI agent.

## 2. Features

### Core Capabilities
- **Gmail Integration**: Fetch, cache, and display Gmail threads with intelligent sender detection
- **Google Calendar Integration**: Sync and view Google Calendar events seamlessly
- **AI Agent**: Intelligent assistant powered by OpenRouter for email summarization, scheduling, and workflow automation
- **Command Palette**: Press `Ctrl+K` to access quick navigation and actions (Inbox, Starred, Sent, Drafts, Search, Compose)
- **Global Keyboard Shortcuts**: 
  - `G I` → Inbox
  - `C` → Compose Email
  - `/` → Search
  - And more...
- **Multi-Tenant Architecture**: Full tenant isolation with secure data partitioning
- **Real-Time Synchronization**: Continuous background sync using Pub/Sub and webhooks
- **Email Verification**: Built-in email verification flow
- **Dark/Light Theme Support**: Toggle between themes seamlessly
- **Responsive Design**: Works beautifully on desktop and tablet

### Advanced Features
- **Webhook Support**: Gmail and Google Calendar webhooks for real-time updates
- **Pub/Sub Integration**: Efficient event streaming with Google Cloud Pub/Sub
- **Rate Limiting**: Built-in API rate limiting to prevent abuse
- **Session Management**: Secure session handling with token-based auth
- **Email Notifications**: Resend integration for transactional emails

## 3. Tech Stack

### Frontend
- **Framework**: Next.js 16.2.9 (App Router)
- **UI Library**: React 19.2.4 + React DOM
- **UI Components**: Shadcn/ui, Base UI
- **Styling**: Tailwind CSS 4 + PostCSS 4
- **State Management**: TanStack React Query 5.101.0
- **Data Fetching**: React Query with optimistic updates
- **Forms & Validation**: Zod 4.4.3
- **Icons**: Phosphor Icons, Lucide React
- **Theming**: next-themes 0.4.6
- **Command Palette**: cmdk 1.1.1

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Next.js 16 API Routes
- **Language**: TypeScript 5
- **Database ORM**: Prisma 7.8.0
- **Database Adapters**: Prisma Adapter for PostgreSQL, Neon
- **Authentication**: better-auth 1.6.17
- **Email Service**: Resend 6.12.4

### Database
- **Primary**: PostgreSQL (self-hosted or Neon)
- **Connection Pooling**: Prisma Adapter for PostgreSQL / Neon Adapter
- **Migrations**: Prisma Migrations
- **Schema**: Multi-table with Corsair integration models, User/Session/Account models

### External APIs & Services
- **Google OAuth**: Gmail API, Google Calendar API, Google Cloud Pub/Sub
- **AI Provider**: OpenRouter (Claude, GPT, other models via OpenRouter)
- **Email Service**: Resend
- **Data Integration Platform**: Corsair (for data syncing and transformation)

### DevTools & Build
- **Module System**: pnpm workspaces
- **Linting**: ESLint 9 with Next.js config
- **Build Tool**: TypeScript compiler + Next.js build
- **Database CLI**: Prisma CLI, drizzle-kit (optional)

## 4. Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Orion Frontend                          │
│                   (Next.js, React, TanStack Query)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Dashboard:  Email │ Calendar │ AI Agent │ Settings       │  │
│  │ Features:   Command Palette, Global Shortcuts            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ├─────── API Routes (Next.js)
             │
┌────────────▼─────────────────────────────────────────────────────┐
│                    Orion Backend (Node.js)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Auth API (better-auth)                                   │  │
│  │ Gmail API (/api/gmail/threads, /api/gmail/sync)        │  │
│  │ Calendar API (/api/calendar/events)                      │  │
│  │ Agent API (/api/agent/analyze, /api/agent/schedule)     │  │
│  │ Sync API (/api/sync/gmail, /api/sync/calendar)          │  │
│  │ Webhook API (/api/webhooks/gmail, /api/webhooks/cal)   │  │
│  │ Connection API (/api/connection/connect)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ├─────── Prisma ORM
             │
┌────────────▼─────────────────────────────────────────────────────┐
│                  PostgreSQL Database                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Users, Sessions, Accounts (Auth)                         │  │
│  │ CorsairIntegrations, CorsairAccounts (Data Sync)         │  │
│  │ SyncState, AgentUsage (Tracking)                         │  │
│  │ Verification, AgentLog (Secondary)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
             │
             ├────────► Google OAuth (Gmail, Calendar API)
             ├────────► Google Cloud Pub/Sub (Real-time Events)
             ├────────► OpenRouter (AI Agent)
             └────────► Resend (Email Notifications)
```

### Authentication Flow
1. **Sign Up / Sign In**: User authenticates via email/password or Google OAuth
2. **Session Creation**: better-auth creates a session token stored in the database
3. **Corsair Provisioning**: Upon email verification, a Corsair tenant is auto-provisioned
4. **Google Connection**: User connects their Google account via OAuth
5. **Token Storage**: Access & refresh tokens securely stored in the Account model
6. **Session Management**: Tokens validated on each API request

### Data Sync Flow
1. **Initial Sync**: Fetch emails/events from Google API and cache in PostgreSQL
2. **Background Sync**: Scheduled or webhook-triggered syncs pull new data
3. **Pub/Sub Events**: Google Cloud Pub/Sub pushes real-time notification events
4. **Cache-First UI**: Frontend displays cached data instantly, updates reactively
5. **Webhook Verification**: HMAC verification ensures webhook authenticity

## 5. Prerequisites

Before getting started, ensure you have:

- **Node.js**: Version 18+ (tested with Node 20)
- **pnpm**: Version 8+ (for workspace management)
- **PostgreSQL**: Version 13+ (self-hosted or cloud-hosted)
  - Or use **Neon** (serverless PostgreSQL)
- **Google Cloud Project**: With Gmail API, Calendar API, and Pub/Sub enabled
- **Google OAuth Credentials**: OAuth 2.0 Client ID (Web application)
- **OpenRouter API Key**: For AI agent capabilities
- **Resend Account & API Key**: For email notifications
- **Git**: For cloning the repository
- **Text Editor/IDE**: VS Code recommended

### Optional but Recommended
- **Docker & Docker Compose**: For local PostgreSQL (included in `docker-compose.yml`)
- **Prisma Studio**: For database inspection (`pnpm db:studio`)
- **Postman/Insomnia**: For API testing

## 6. Live Demo

A live demo of Orion is available at:

- https://orion.example.com

> Replace this URL with your deployed production or staging link.

## 7. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# === DATABASE ===
DATABASE_URL="postgresql://user:password@localhost:5432/orion"
# For Neon:
# DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/orion"

# === AUTHENTICATION (better-auth) ===
BETTER_AUTH_SECRET="your-random-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# === GOOGLE APIs & SERVICES ===
GOOGLE_PROJECT_ID="your-google-cloud-project-id"

# === AI AGENT ===
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-api-key"

# === EMAIL SERVICE ===
RESEND_API_KEY="re_your-resend-api-key"
RESEND_EMAIL="noreply@yourdomain.com"

# === WEBHOOKS & EVENTS ===
WEBHOOK_SECRET="your-webhook-signing-secret"
PUBSUB_TOPIC_ID="orion-events"
PUBSUB_SUBSCRIPTION_ID="orion-worker"

# === CORS & SECURITY ===
CORS_ORIGIN="http://localhost:3000"

# === FEATURE FLAGS (Optional) ===
ENABLE_CALENDAR_SYNC="true"
ENABLE_AI_AGENT="true"
MAINTENANCE_MODE="false"
```

### Notes:
- `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL`: Update in production to your domain
- All API keys should be kept secret; never commit to version control
- Use `.env.local` for local development (gitignored)

## 7. Installation & Local Development

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/orion.git
cd orion
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Set Up PostgreSQL
**Option A: Using Docker Compose**
```bash
docker-compose up -d
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env.local` and fill in the required variables (see section 6).

### Step 5: Run Database Migrations
```bash
pnpm db:migrate -- dev
```

This will:
- Create tables (User, Session, Account, Verification, CorsairIntegration, etc.)
- Run all pending migrations
- Generate Prisma Client types

### Step 6: Start the Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Step 7: Verify Setup
- Visit `http://localhost:3000` and see the landing page
- Click **Sign Up** and create a test account
- Check your email for the verification link (Resend)
- Verify your email and proceed to connect Google

### Additional Commands
```bash
# Generate Prisma Client types
pnpm db:generate

# View database in Prisma Studio
pnpm db:studio

# Run linter
pnpm lint

# Build for production
pnpm build
pnpm start
```

## 8. Google OAuth Setup

### Prerequisites
- Active Google Cloud Project
- Billing enabled (required for some APIs)

### Step 1: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create your project
3. Enable the following APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **Google Cloud Pub/Sub API**
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy your **Client ID** and **Client Secret** to `.env.local`

### Step 2: Enable Required Scopes

Ensure your OAuth consent screen requests the following scopes:
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/pubsub`

### Step 3: Set Up Service Account (Optional, for server-side operations)

1. Create a **Service Account** in Google Cloud Console
2. Download the JSON key file
3. Store securely (e.g., in an encrypted environment variable)
4. Grant necessary IAM roles: `Gmail Admin`, `Calendar Admin`, `Pub/Sub Subscriber`

## 9. Webhook Configuration

### Gmail Webhooks

Gmail uses **Pub/Sub** push notifications instead of traditional webhooks. Setup:

1. **Create a Pub/Sub Topic**:
   ```bash
   gcloud pubsub topics create orion-events
   ```

2. **Create a Subscription**:
   ```bash
   gcloud pubsub subscriptions create orion-worker \
     --topic=orion-events \
     --push-endpoint=https://yourdomain.com/api/webhooks/gmail \
     --push-auth-service-account=your-service-account@project.iam.gserviceaccount.com
   ```

3. **Watch Gmail**:
   Call the Gmail API `watch()` endpoint to subscribe to label changes:
   ```javascript
   const res = await gmail.users.watch({
     userId: 'me',
     requestBody: {
       topicName: 'projects/YOUR_PROJECT_ID/topics/orion-events',
       labelIds: ['INBOX'],
     },
   });
   ```

4. **Handle Pub/Sub Messages**:
   In `/api/webhooks/gmail`, verify and process messages:
   ```javascript
   // Verify JWT signature
   // Decode message
   // Update local cache
   // Trigger frontend refetch
   ```

### Google Calendar Webhooks

Similar to Gmail, use Pub/Sub or set up direct webhook endpoints:

1. **Set Watch on Calendar**:
   ```javascript
   const res = await calendar.calendarList.watch({
     calendarId: 'primary',
     requestBody: {
       address: 'https://yourdomain.com/api/webhooks/calendar',
       type: 'web_hook',
     },
   });
   ```

2. **Handle Webhook Push** in `/api/webhooks/calendar`:
   - Verify X-Goog-Channel-Token
   - Fetch updated events
   - Update database cache
   - Broadcast to frontend


## 10. Project Structure

```
orion/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing page
│   │   ├── (auth)/                  # Auth group (signin, signup, reset password)
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # Authentication endpoints
│   │   │   ├── agent/               # AI agent endpoints
│   │   │   ├── gmail/               # Gmail API integration
│   │   │   ├── calendar/            # Calendar API integration
│   │   │   ├── sync/                # Background sync endpoints
│   │   │   ├── connection/          # OAuth connection flow
│   │   │   ├── corsair/             # Corsair integration
│   │   │   └── webhooks/            # Webhook handlers (Gmail, Calendar)
│   │   └── dashboard/               # Authenticated dashboard
│   │       ├── layout.tsx           # Dashboard shell
│   │       ├── agent/               # AI Agent workspace
│   │       ├── email/               # Email/Inbox workspace
│   │       ├── calendar/            # Calendar workspace
│   │       └── settings/            # Settings workspace
│   │
│   ├── components/                  # React components
│   │   ├── dashboard/               # Dashboard-specific components
│   │   │   ├── sidebar.tsx          # Main navigation sidebar
│   │   │   ├── command-palette.tsx # Command palette (Ctrl+K)
│   │   │   ├── connect-google-card.tsx
│   │   │   └── settings-integration-card.tsx
│   │   ├── landing/                 # Landing page components
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── orion-logo.tsx
│   │   ├── providers/               # Context providers
│   │   │   ├── query-provider.tsx   # TanStack Query setup
│   │   │   ├── shortcut-provider.tsx # Global keyboard shortcuts
│   │   │   └── theme-provider.tsx   # Theme (dark/light)
│   │   └── ui/                      # Shadcn UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── calendar.tsx
│   │       ├── chart.tsx
│   │       └── ... (40+ components)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-mobile.ts            # Detect mobile viewport
│   │   └── use-connection-status.ts # Connection status hook
│   │
│   └── lib/                         # Utility functions & configurations
│       ├── auth.ts                  # better-auth configuration
│       ├── auth-client.ts           # Client-side auth utilities
│       ├── db.ts                    # Prisma Client instance
│       ├── corsair.ts               # Corsair configuration
│       ├── connection.ts            # OAuth connection utilities
│       ├── tenant.ts                # Multi-tenant utilities
│       ├── email-utils.ts           # Email parsing & formatting
│       ├── events.ts                # Event handling
│       ├── utils.ts                 # General utilities
│       ├── validators/              # Zod validators
│       ├── agent/                   # AI agent logic
│       │   ├── openrouter.ts        # OpenRouter API wrapper
│       │   └── analyzer.ts          # Email/event analysis
│       └── sync/                    # Synchronization logic
│           ├── gmail.ts
│           ├── calendar.ts
│           └── orchestrator.ts
│
├── prisma/                          # Prisma ORM
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Migration history
│
├── generated/                       # Auto-generated files
│   └── prisma/                      # Prisma Client types
│
├── public/                          # Static assets
│   ├── images/
│   ├── icons/
│   └── ...
│
├── features/                        # Feature modules
│   ├── auth/                        # Auth feature
│   │   └── actions/
│   ├── agent/                       # Agent feature
│   │   └── index.ts
│   └── ...
│
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── postcss.config.mjs              # PostCSS configuration
├── eslint.config.mjs               # ESLint configuration
├── package.json                    # Dependencies & scripts
├── pnpm-workspace.yaml             # Workspace configuration
├── docker-compose.yml              # Local PostgreSQL setup
└── README.md                       # This file
```

### Key Directories Explained

| Directory | Purpose |
|-----------|---------|
| `src/app` | Next.js App Router pages and API routes |
| `src/app/api` | Backend API endpoints (auth, data sync, webhooks) |
| `src/app/dashboard` | Authenticated dashboard workspaces |
| `src/components` | Reusable React components (UI, providers, dashboard) |
| `src/lib` | Core business logic, utilities, configurations |
| `src/lib/agent` | AI agent implementation and OpenRouter integration |
| `src/lib/sync` | Gmail/Calendar synchronization logic |
| `prisma` | Database schema and migrations |
| `generated/prisma` | Auto-generated Prisma Client types |
| `features` | Feature modules (auth, agent) |

## 11. Security

### Authentication & Authorization
- **Session Tokens**: Stored in HTTP-only cookies (set by better-auth)
- **Token Expiration**: Sessions expire after 7 days (configurable)
- **Rate Limiting**: Built-in rate limiting on auth endpoints
- **CSRF Protection**: Better-auth handles CSRF tokens automatically
- **Password Security**: Passwords hashed with bcrypt (better-auth)
- **Email Verification**: Required before email/password signup

### Multi-Tenant Isolation
- **Tenant ID**: Every user gets a unique tenant ID upon signup
- **Database Isolation**: CorsairAccount, SyncState, AgentUsage filtered by tenantId
- **API Request Validation**: All requests validate user ownership of resources
- **Data Segregation**: No leakage between tenants at database or application level

### API Security
- **Protected Routes**: Dashboard and API endpoints require valid session
- **CORS**: Restricted to your domain in production
- **Webhook Verification**: HMAC signatures verify webhook authenticity
- **Rate Limiting**: API rate limits prevent brute force attacks
- **Input Validation**: Zod validators sanitize all inputs
- **SQL Injection Prevention**: Prisma parameterized queries prevent SQL injection

### OAuth & Third-Party Integrations
- **Access Tokens**: Stored encrypted in Account.accessToken
- **Refresh Tokens**: Stored encrypted in Account.refreshToken
- **Scope Restriction**: OAuth scopes limited to Gmail, Calendar, Pub/Sub
- **Token Rotation**: Automatic refresh token rotation handled by better-auth
- **Secure Storage**: Tokens never exposed in client-side code

### Data Protection
- **At Rest**: PostgreSQL encryption (enable at database level)
- **In Transit**: HTTPS/TLS enforced in production
- **Secrets Management**: Environment variables in `.env.local` (not committed)
- **Audit Logging**: AgentLog table tracks all agent actions
- **Data Retention**: Configure retention policies for sensitive data

### Production Hardening
1. Enable HTTPS/TLS
2. Use strong, unique `BETTER_AUTH_SECRET`
3. Restrict webhook IPs if possible
4. Enable database backups
5. Set up monitoring and alerting
6. Implement rate limiting at CDN level (Vercel, Cloudflare)
7. Use secrets management service (Vercel Secrets, AWS Secrets Manager)
8. Regularly update dependencies (`pnpm update`)

## 12. API Endpoints

### Authentication Endpoints
```
POST   /api/auth/sign-up           # Email/password signup
POST   /api/auth/sign-in           # Email/password login
POST   /api/auth/sign-out          # Logout
POST   /api/auth/reset-password    # Initiate password reset
POST   /api/auth/verify-email      # Verify email token
GET    /api/auth/session           # Get current session
GET    /api/auth/callback/google   # OAuth callback (auto-handled)
```

### Gmail Integration Endpoints
```
GET    /api/gmail/threads          # List cached email threads (cache-first)
GET    /api/gmail/threads/[id]     # Get single thread details
POST   /api/gmail/sync             # Trigger background sync
POST   /api/gmail/threads/[id]/mark-read
POST   /api/gmail/threads/[id]/star
POST   /api/gmail/draft            # Create draft
GET    /api/gmail/search           # Search emails (with filters)
```

### Calendar Endpoints
```
GET    /api/calendar/events        # List calendar events
GET    /api/calendar/events/[id]   # Get event details
POST   /api/calendar/events        # Create event
PUT    /api/calendar/events/[id]   # Update event
DELETE /api/calendar/events/[id]   # Delete event
POST   /api/calendar/sync          # Trigger sync
```

### AI Agent Endpoints
```
POST   /api/agent/analyze          # Analyze email with AI
POST   /api/agent/schedule         # Schedule meeting (with AI suggestion)
POST   /api/agent/compose          # AI-assisted email composition
GET    /api/agent/usage            # Get daily usage statistics
GET    /api/agent/logs             # View agent action logs
```

### Webhook Endpoints
```
POST   /api/webhooks/gmail         # Gmail Pub/Sub notifications
POST   /api/webhooks/calendar      # Calendar change notifications
GET    /api/webhooks/health        # Webhook health check
```

### Connection & Integration Endpoints
```
POST   /api/connection/connect     # Initiate Google OAuth flow
POST   /api/connection/disconnect  # Revoke Google access
GET    /api/connection/status      # Check connection status
POST   /api/corsair/config         # Configure Corsair integration
```

### Sync Orchestration Endpoints
```
POST   /api/sync/all               # Full sync (gmail + calendar)
POST   /api/sync/gmail             # Gmail-only sync
POST   /api/sync/calendar          # Calendar-only sync
GET    /api/sync/status            # Get sync status & last sync times
```

### Miscellaneous
```
GET    /api/health                 # API health check
GET    /api/version                # API version
```

**Note**: All endpoints except `/api/auth/sign-up`, `/api/auth/sign-in`, `/api/auth/callback/google`, and `/api/health` require a valid session.

## 13. Known Limitations

### Current Constraints
- **Email Limit**: Initial sync limited to last 100 threads per folder (configurable)
- **Calendar Limit**: Last 365 days of events synced
- **Refresh Rate**: Background sync runs every 5 minutes (configurable)
- **AI Model**: Currently fixed to OpenRouter "free" tier; upgrading model requires code change
- **Timezone**: Calendar events displayed in user's system timezone only
- **Attachments**: Email attachments not downloaded or cached (metadata only)
- **Gmail Labels**: Only INBOX, SENT, DRAFTS, STARRED tracked; custom labels unsupported
- **Concurrent Users**: No real-time collaboration on shared documents

### Unsupported Features
- ✗ Email composing via Resend (planned)
- ✗ Outlook/Microsoft 365 integration
- ✗ Slack/Teams integration
- ✗ Advanced email templates
- ✗ Meeting recording transcription
- ✗ Email scheduling with timezone awareness
- ✗ Two-factor authentication (2FA) for user accounts
- ✗ API rate limiting per user (global limits only)
- ✗ Bulk operations (delete, archive 100+ emails at once)

