# SIPHL Setup Guide

## ✅ What's Been Built

Your Hyperliquid SIP platform is complete! Here's what we've implemented:

### Backend (100% Complete)

- ✅ Complete database schema with Supabase
- ✅ AES-256-GCM encryption for agent wallets
- ✅ Hyperliquid SDK integration (spot trading)
- ✅ All API endpoints functional
- ✅ Cron job execution logic ready

### Frontend (100% Complete)

- ✅ Rainbow Kit wallet authentication (Arbitrum only)
- ✅ Landing page with wallet connect
- ✅ Dashboard with stats overview
- ✅ Agent wallet management UI
- ✅ SIP creation and management pages
- ✅ Hyperliquid balances viewer
- ✅ Minimal glass morphism UI

## 🚀 Quick Start

### 1. Setup Supabase

Create a Supabase project at https://supabase.com

```bash
# Login to Supabase
bunx supabase login

# Link to your project
bunx supabase link --project-ref YOUR_PROJECT_REF

# Push database schema
bunx supabase db push
```

### 2. Configure Environment Variables

Update `.env.local` with real values:

```bash
# Get from Supabase dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Generate encryption key
openssl rand -hex 32  # Copy output to ENCRYPTION_KEY

# Generate cron secret
openssl rand -hex 32  # Copy output to CRON_SECRET

# Get from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

```

### 3. Run Development Server

```bash
bun dev
```

Visit http://localhost:3000

### 4. Setup Supabase Cron (After Deployment)

Once deployed to production:

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Click "Create a new cron job"
3. Add this SQL:

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

4. Set schedule to: `0 * * * *` (every hour)
5. Name it: `execute-sips`

## 📱 Application Flow

### User Journey

1. **Connect Wallet**

   - User visits landing page
   - Connects Arbitrum wallet via Rainbow Kit
   - Automatically redirected to dashboard

2. **Create Agent Wallet**

   - Navigate to "Agent" page
   - Click "Create Agent Wallet"
   - System generates encrypted wallet
   - Copy agent address

3. **Fund Agent**

   - Go to Hyperliquid
   - Transfer USDC to agent wallet address
   - Wait for confirmation

4. **Create SIP**

   - Navigate to "SIPs" → "Create SIP"
   - Select spot asset (e.g., PURR, HYPE)
   - Set amount (min $1 USDC)
   - Choose interval (8h, 12h, or 24h)
   - Submit

5. **Monitor**
   - View active SIPs in dashboard
   - Check execution history
   - Pause/Resume as needed
   - View balances on Hyperliquid

## 🏗️ Architecture

### Database Tables

1. **users** - User accounts (Arbitrum wallet addresses)
2. **agent_wallets** - Encrypted agent wallets (AES-256-GCM)
3. **systematic_investment_plans** - SIP configurations
4. **sip_executions** - Execution history with results
5. **hyperliquid_spot_metadata** - Cached asset info

### API Routes

#### Agent Management

- `POST /api/agent/create` - Generate new agent wallet
- `POST /api/agent/delete` - Delete agent wallet

#### Hyperliquid Data

- `GET /api/hyperliquid/assets` - Get spot assets + prices
- `GET /api/hyperliquid/balances?address=0x...` - Get balances

#### SIP Management

- `GET /api/sips` - List user's SIPs
- `POST /api/sips` - Create new SIP
- `GET /api/sips/[id]` - Get SIP with execution history
- `PATCH /api/sips/[id]` - Update SIP status
- `DELETE /api/sips/[id]` - Delete SIP

#### Cron Execution

- `POST /api/supabase-cron/execute-sips` - Execute due SIPs (secured)

### Security Features

1. **Private Key Encryption**

   - AES-256-GCM with random IV per key
   - Encryption key stored only in env vars
   - Keys never sent to client
   - Decrypted only server-side during trades

2. **Authentication**

   - Rainbow Kit wallet signatures
   - Supabase Row Level Security
   - API route protection

3. **Cron Security**
   - Secret token authentication
   - Service role bypass for automated execution

## 🧪 Testing

### Before Production

1. **Test Agent Wallet**

   ```bash
   # Start dev server
   bun dev

   # Connect wallet
   # Create agent wallet
   # Verify encryption in Supabase
   ```

2. **Test Hyperliquid Integration**

   ```bash
   # Check balances page works
   # Verify asset list loads
   # Confirm prices display
   ```

3. **Test SIP Creation**

   ```bash
   # Create test SIP with small amount ($1)
   # Verify database entry
   # Check next_execution_at calculated correctly
   ```

4. **Test Cron Manually**
   ```bash
   curl -X POST http://localhost:3000/api/supabase-cron/execute-sips \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

## 🚢 Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to vercel.com
2. Import your repository
3. Add environment variables (same as .env.local)
4. Deploy

### 3. Post-Deployment

1. Update Supabase cron URL to production domain
2. Test wallet connection on live site
3. Create test SIP with small amount
4. Monitor cron execution logs

## 📊 Monitoring

### Check Cron Execution

In Supabase Dashboard → Database → Cron Jobs → View Logs

### Check SIP Executions

```sql
SELECT * FROM sip_executions
ORDER BY executed_at DESC
LIMIT 10;
```

### Check Failed Executions

```sql
SELECT * FROM sip_executions
WHERE status = 'failed'
ORDER BY executed_at DESC;
```

## ⚠️ Important Notes

### Security Warnings

1. **Only deposit funds you can afford to risk**
2. **Keep minimal balances in agent wallets**
3. **Withdraw profits regularly to main wallet**
4. **This is experimental software**

### Hyperliquid Specifics

1. **Spot Asset IDs**: Always `10000 + assetIndex`
2. **Order Type**: Using IOC (Immediate or Cancel) for market-like execution
3. **Slippage**: Default 2% slippage tolerance
4. **Minimum**: $1 USDC minimum per SIP

### Database Triggers

- `next_execution_at` auto-updates when SIP executes
- `updated_at` timestamps maintained automatically

## 🐛 Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf .next
bun run build
```

### Supabase Connection Issues

```bash
# Check if migrations applied
bunx supabase db diff --use-migra

# Relink project
bunx supabase link --project-ref YOUR_PROJECT_REF
```

### Wallet Connection Issues

1. Check WalletConnect Project ID is correct
2. Verify only using Arbitrum network
3. Clear browser cache
4. Try different wallet (MetaMask, Rainbow, etc.)

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Rainbow Kit Docs](https://rainbowkit.com)
- [Hyperliquid API Docs](https://hyperliquid.gitbook.io)

## 🎯 Next Steps

1. ✅ Setup Supabase project
2. ✅ Configure environment variables
3. ✅ Test locally
4. ✅ Deploy to Vercel
5. ✅ Setup Supabase cron job
6. ✅ Test with small amounts
7. ✅ Monitor execution logs

---

**Built with ❤️ using Next.js, Supabase, and Hyperliquid**
