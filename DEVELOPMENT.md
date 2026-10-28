# Cadet — Developer Guide

Technical reference for running and extending Cadet. For a product overview,
see the [README](README.md).

## Tech Stack

### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for state management
- Radix UI + shadcn/ui for components
- Tailwind CSS for styling
- Vite for build tooling

### Backend
- Node.js with Express
- TypeScript
- Drizzle ORM with PostgreSQL
- OpenAI API integration (`gpt-4o` for chat and generation, `text-embedding-3-small` for RAG)
- Multer for file uploads
- Session-based authentication

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Cadet-AI
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities and configurations
├── server/                # Backend Express server
│   ├── lib/               # Server utilities
│   └── routes.ts          # API routes
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── uploads/               # Uploaded files (created automatically at runtime; not in the repo)
```

## Key Features

### Document Categorization
- **Onboarding Documents**: Used by the onboarding chatbot for new employee guidance
- **Cadet Documents**: Used by the main AI assistant for general company training

### AI-Powered Assistance
- RAG (Retrieval-Augmented Generation) integration with company documents
- Context-aware responses based on uploaded materials
- Role-specific guidance for employees and managers

## How the RAG Agent Works

1. **Ingestion** — When a document is uploaded (`POST /api/documents`), it is
   parsed (PDF or plain text), hierarchically chunked
   (document → section → paragraph → sentence), tagged with extracted metadata
   (department, region, doc type, compliance tags), embedded with OpenAI
   `text-embedding-3-small`, and stored in the `chunks` table.
   `POST /api/documents/reindex-all` re-ingests everything (useful after
   importing files from Google Drive/OneDrive or upgrading the chunker).
2. **Retrieval** — Questions are embedded and matched against chunks via
   cosine similarity with keyword pre-filtering, role/department awareness
   (untagged chunks are treated as company-wide), precision-mode for exact
   value lookups, and a minimum relevance threshold so the assistant admits
   when it doesn't know rather than answering from noise.
3. **Agent** — `POST /api/help-center/ask` (used by the AI Assistant page and
   the floating widget on every onboarding step) grounds answers in retrieved
   chunks, returns **citations** with links to source documents, and can
   propose **actions** (create task, file ticket, assign buddy, schedule
   check-in, open link) which the employee approves before execution via
   `POST /api/help-center/action`.
4. **Onboarding chat** — `POST /api/onboarding-chat` runs a selective agent
   that plans which knowledge tools to use per question (org graph, admin
   onboarding config, or vector search) before answering.
5. **Single-tenant by default** — the multi-tenant Supabase registry
   is optional; unregistered orgIds transparently
   fall back to the local Postgres database (tasks, tickets, buddy
   assignments, and analytics events live in local tables).

### Manager Visibility
- `GET /api/manager/team-progress` — every employee's onboarding step,
  completion %, and last visited page, plus team-level summary stats.
- `GET /api/manager/recent-questions` — the questions new hires are asking
  the AI, a direct signal of onboarding knowledge gaps.

### User Management
- Employee and manager role differentiation
- Automatic role-based routing

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run the production build
- `npm run check` - Type-check with TypeScript
- `npm run db:push` - Push database schema changes

### Database Management
This project uses Drizzle ORM. Schema changes should be made in `shared/schema.ts` and applied using `npm run db:push`.

## Deployment

The application is designed to work with:
- Replit (primary deployment platform)
- Any Node.js hosting service with PostgreSQL support
