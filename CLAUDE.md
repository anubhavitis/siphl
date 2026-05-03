# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
bun dev          # Start development server
bun run build    # Production build
bun run lint     # Run linting
```

## Architecture

**Siphl** is a Hyperliquid Systematic Investment Plan (SIP) platform built with Next.js 16 + React 19.

### Core Flow
1. User connects wallet (Rainbow Kit on Arbitrum)
2. System generates encrypted agent wallet for trading
3. User creates SIPs with intervals (8h/12h/24h)
4. Supabase cron executes orders via backend services

### Key Directories

- `src/app/api/` - Next.js API routes (thin controllers)
- `src/backend/services/` - Business logic (agent, SIP, db services)
- `src/lib/hyperliquid/` - HL SDK wrappers, hooks, Zustand store
- `src/lib/crypto/` - AES-256-GCM encryption utilities
- `src/components/ui/` - shadcn components

### Service Layer Pattern

Routes delegate to services:
```
API Route → Service → Database/External API
```

- `agent.service.ts` - Agent wallet management
- `sip.service.ts` / `sip-executor.service.ts` - SIP logic
- `db.service.ts` - Supabase queries
- `order.service.ts` - Hyperliquid order execution

### State Management

- **Zustand** (`lib/hyperliquid/store.tsx`) - HL clients (info, exchange)
- **TanStack Query** - Server state, caching
- **Wagmi** - Wallet connection state

## Key Patterns

- Use `@/` path alias for imports
- All UI via shadcn/ui components (Radix + Tailwind)
- `"use client"` only for interactive components
- Custom hooks in `lib/hooks/` and `lib/hyperliquid/hooks.tsx`

### UI/UX Patterns

- Header and action buttons should always be visible regardless of data state
- Use skeleton loaders during loading states (not just text)
- Use DataTable's built-in empty state for tables with no data
- Use mobile-friendly layouts: stack vertically on small screens, use `flex-wrap` and `break-all` for long content

## Security

- Private keys encrypted with AES-256-GCM before storage
- Keys decrypted only server-side during cron execution
- Cron endpoints secured with `CRON_SECRET` header validation
- Supabase RLS for user data isolation

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ENCRYPTION_KEY` (32-byte hex for AES-256)
- `CRON_SECRET` (cron endpoint auth)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_BUILDER_ADDRESS` (agent fee recipient)

## Database

5 main tables: `users`, `agent_wallets`, `sips`, `sip_executions`, `spot_metadata`

Types generated in `src/types/database.ts`
