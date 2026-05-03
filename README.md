# SIPHL - Hyperliquid SIP Platform

Smart investment portal for creating Systematic Investment Plans (SIPs) on Hyperliquid spot assets.

## Features

- 🔐 **Wallet Authentication** - Connect with Rainbow Kit (Arbitrum mainnet)
- 🤖 **Auto-Generated Agent Wallets** - Secure, encrypted agent wallets for automated trading
- 💰 **Systematic Investment Plans** - Create recurring buy orders (8h, 12h, 24h intervals)
- ⚡ **Automated Execution** - Supabase cron jobs execute trades automatically
- 📊 **Portfolio Tracking** - View balances and execution history
- 🔒 **AES-256-GCM Encryption** - Bank-grade security for private keys

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Authentication**: Rainbow Kit + Wagmi (Arbitrum only)
- **Database**: Supabase (PostgreSQL + Cron)
- **Trading**: Hyperliquid SDK
- **Runtime**: Bun

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agent/          # Agent wallet management
│   │   ├── hyperliquid/    # Hyperliquid API wrappers
│   │   ├── sips/           # SIP CRUD operations
│   │   └── supabase-cron/  # Automated SIP execution
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── hyperliquid/       # Hyperliquid SDK wrappers
│   ├── crypto/            # Encryption & wallet generation
│   └── constants.ts
└── types/
    └── database.ts        # TypeScript types

supabase/
└── migrations/
    └── 20241128000001_initial_schema.sql
```

## Setup Instructions

### 1. Install Dependencies

```bash
bun install
```

### 2. Generate Encryption Key

```bash
openssl rand -hex 32
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and keys

### 4. Link Supabase

```bash
bunx supabase login
bunx supabase link --project-ref your-project-ref
```

### 5. Push Database Migrations

```bash
bunx supabase db push
```

### 6. Generate TypeScript Types (Optional)

```bash
bunx supabase gen types typescript --local > src/types/database.ts
```

### 7. Setup Environment Variables

Create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Encryption (from step 2)
ENCRYPTION_KEY=your_256bit_hex_encryption_key

# Cron Security (generate another random string)
CRON_SECRET=your_random_cron_secret

# Rainbow Kit
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 8. Get WalletConnect Project ID

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a new project
3. Copy the Project ID

### 9. Run Development Server

```bash
bun dev
```

## Database Schema

### Key Tables

- **users** - User accounts (linked to Arbitrum wallets)
- **agent_wallets** - Auto-generated trading wallets (encrypted private keys)
- **systematic_investment_plans** - SIP configurations
- **sip_executions** - Execution history
- **hyperliquid_spot_metadata** - Cached asset information

## API Endpoints

### Agent Wallet Management

- `POST /api/agent/create` - Create new agent wallet
- `POST /api/agent/delete` - Delete agent wallet

### Hyperliquid Integration

- `GET /api/hyperliquid/assets` - Get spot assets with prices
- `GET /api/hyperliquid/balances?address=0x...` - Get user balances

### SIP Management

- `GET /api/sips` - List all SIPs
- `POST /api/sips` - Create new SIP
- `GET /api/sips/[id]` - Get SIP details with execution history
- `PATCH /api/sips/[id]` - Update SIP status (pause/resume/cancel)
- `DELETE /api/sips/[id]` - Delete SIP

### Cron Execution

- `POST /api/supabase-cron/execute-sips` - Execute due SIPs (secured with CRON_SECRET)

## Supabase Cron Setup

After deploying to production, set up the cron job in Supabase:

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Create a new cron job:

```sql
SELECT net.http_post(
  url := 'https://your-domain.vercel.app/api/supabase-cron/execute-sips',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_CRON_SECRET'
  ),
  body := '{}'::jsonb
) as request_id;
```

3. Set schedule to `0 * * * *` (every hour)

## Security Features

- **AES-256-GCM Encryption** - All agent wallet private keys are encrypted
- **Row Level Security** - Database policies ensure users can only access their own data
- **Cron Authentication** - Cron endpoint secured with secret token
- **Server-Side Decryption** - Private keys only decrypted on server during trade execution
- **No Client Exposure** - Private keys never sent to client

## Deployment

### Recommended: Vercel

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

Then:

1. Import project in Vercel
2. Add all environment variables
3. Deploy
4. Update Supabase cron URL to production domain

## Critical Implementation Notes

### Hyperliquid Spot Asset IDs

Spot assets use `10000 + assetIndex` for order placement:

```typescript
const spotAssetId = 10000 + assetIndex;
```

### SIP Intervals

- 8h: Every 8 hours
- 12h: Every 12 hours
- 24h: Every 24 hours

### Database Triggers

Auto-update `next_execution_at` when SIP executes (handled by database trigger).

## Development Roadmap

### Phase 1: ✅ Backend Infrastructure (COMPLETED)

- ✅ Next.js + Bun setup
- ✅ Supabase integration
- ✅ Database schema & migrations
- ✅ Encryption module
- ✅ Hyperliquid SDK wrappers
- ✅ API endpoints
- ✅ Cron execution logic

### Phase 2: Frontend & UI (Next Steps)

- [ ] Rainbow Kit integration
- [ ] Dashboard UI components
- [ ] Agent wallet management UI
- [ ] SIP creation form
- [ ] Balance display
- [ ] Execution history view

### Phase 3: Testing & Production

- [ ] End-to-end testing
- [ ] Security audit
- [ ] Production deployment
- [ ] Cron job setup

## Warning

⚠️ **IMPORTANT SECURITY NOTICE**

- Only deposit funds you can afford to risk into agent wallets
- This is experimental software - use at your own risk
- Agent wallets are system-controlled - keep balances minimal
- Not financial advice - do your own research
- Understand smart contract and exchange risks before using

## Support

For issues or questions, please create an issue in the GitHub repository.

## License

MIT
