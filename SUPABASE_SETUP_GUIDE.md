# Supabase & PowerSync Setup Guide

**Status:** Configuration ready, integration deferred until Phase 2.3 complete
**Duration:** 1-2 hours
**Last Updated:** February 4, 2026

---

## Overview

This guide walks you through setting up Supabase and PowerSync for ShowStack. We're preparing the infrastructure now, but won't integrate it with the app until Phase 2.3 (Service Layer) is complete.

**What we're doing:**

1. Creating Supabase project and deploying schema
2. Configuring Row-Level Security (RLS) policies
3. Setting up PowerSync instance
4. Storing credentials securely

**What we're NOT doing yet:**

- Writing PowerSync integration code
- Modifying service layer
- Building sync UI components

---

## Prerequisites

- ✅ Supabase account created
- ✅ PowerSync account created
- ✅ Node.js and npm installed
- ✅ Git repository access

---

## Part 1: Supabase Setup (30-45 minutes)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in project details:
   - **Name:** `ShowStack Production` (or `ShowStack Dev` for testing)
   - **Database Password:** Generate a strong password (save it in 1Password/LastPass)
   - **Region:** Choose closest to your location (e.g., `us-east-1`)
   - **Pricing Plan:** Free tier for now (can upgrade later)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 2: Get API Credentials

Once your project is ready:

1. Go to **Settings** → **API** in the left sidebar
2. Copy these values (you'll need them in Step 8):
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon public** key
   - **Project API keys** → **service_role secret** key (⚠️ keep this secret!)

### Step 3: Deploy Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file I created: `supabase/migrations/001_initial_schema.sql`
4. Copy the entire contents and paste into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: `Success. No rows returned`

### Step 4: Apply Indexes

1. Still in SQL Editor, click **"New query"**
2. Open: `supabase/migrations/002_indexes.sql`
3. Copy contents and paste into SQL editor
4. Click **"Run"**
5. Confirm: `Success. No rows returned`

### Step 5: Configure Row-Level Security (RLS)

1. In SQL Editor, click **"New query"**
2. Open: `supabase/migrations/003_rls_policies.sql`
3. Copy contents and paste into SQL editor
4. Click **"Run"**
5. Confirm: `Success. No rows returned`

**What RLS does:**

- Users can only access projects they own or are shared with
- Anonymous users can't access any data
- Service role can bypass RLS for admin operations

### Step 6: Verify Schema Deployment

1. Go to **Table Editor** in left sidebar
2. You should see all tables listed:
   - `projects` (with ~80 columns)
   - `fixtures` (with ~100 columns)
   - `shop_order_projects`
   - `shop_order_sections`
   - `shop_order_items`
   - `dimmer_racks`
   - `pd_racks`
   - `infrastructure_equipment`
   - And 10+ more tables
3. Click into `projects` table and verify columns exist

### Step 7: Enable Realtime (for PowerSync)

1. Go to **Database** → **Replication** in left sidebar
2. Click **"Enable Replication"** if not already enabled
3. Select these tables for replication:
   - ✅ All tables (check "Select all")
4. Click **"Save"**

### Step 8: Save Credentials Locally

Now we'll create your local `.env` file:

1. Open the file I created: `.env.example`
2. Copy it to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and fill in your values from Step 2:
   ```bash
   # Supabase Configuration
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **Important:** The `.env` file is in `.gitignore` - never commit it to git!

---

## Part 2: PowerSync Setup (15-30 minutes)

### Step 9: Create PowerSync Instance

1. Go to [https://powersync.com/dashboard](https://powersync.com/dashboard)
2. Click **"Create Instance"**
3. Fill in details:
   - **Instance Name:** `ShowStack Production` (or `ShowStack Dev`)
   - **Region:** Same as Supabase region
4. Click **"Create"**

### Step 10: Connect PowerSync to Supabase

1. In PowerSync dashboard, go to **Settings** → **Database Connection**
2. Select **"Supabase"** as database provider
3. Fill in connection details:
   - **Supabase URL:** Your project URL from Step 2
   - **Supabase Service Role Key:** Your service_role key from Step 2
   - **Database Name:** `postgres` (default)
4. Click **"Test Connection"**
5. If successful, click **"Save"**

### Step 11: Configure Sync Rules

1. In PowerSync dashboard, go to **Sync Rules**
2. Click **"Upload Sync Rules"**
3. Open the file I created: `supabase/powersync/sync-rules.yaml`
4. Copy contents and paste into editor
5. Click **"Validate"** to check syntax
6. Click **"Deploy"**

**What sync rules do:**

- Define which tables to sync
- Filter data by user (only sync user's projects)
- Transform data for local storage

### Step 12: Get PowerSync Credentials

1. In PowerSync dashboard, go to **Settings** → **Credentials**
2. Copy these values:
   - **PowerSync Instance URL** (looks like `https://xxxxx.powersync.com`)
   - **PowerSync Token** (JWT token)

### Step 13: Add PowerSync Credentials to .env

1. Edit your `.env` file
2. Add PowerSync credentials:
   ```bash
   # PowerSync Configuration
   POWERSYNC_URL=https://xxxxx.powersync.com
   POWERSYNC_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Part 3: Verification (10 minutes)

### Step 14: Test Supabase Connection

I've created a test script for you:

```bash
npm run test:supabase
```

This will:

- Connect to Supabase
- Verify schema exists
- Test RLS policies
- Print connection status

Expected output:

```
✅ Connected to Supabase
✅ Schema verified (15 tables found)
✅ RLS policies active
```

### Step 15: Test PowerSync Connection

```bash
npm run test:powersync
```

This will:

- Connect to PowerSync
- Verify sync rules deployed
- Test token validity
- Print connection status

Expected output:

```
✅ Connected to PowerSync
✅ Sync rules deployed (15 tables configured)
✅ Token valid
```

---

## Part 4: Security Checklist

Before moving on, verify:

- [ ] `.env` file is in `.gitignore` (never committed)
- [ ] Service role key only in `.env` (not in code)
- [ ] RLS policies enabled on all tables
- [ ] Supabase project password saved in password manager
- [ ] PowerSync token secured
- [ ] API keys not shared publicly

---

## What's Next?

✅ **Setup Complete!** Your cloud infrastructure is ready.

**Deferred until Phase 2.3 (Service Layer) complete:**

- Installing PowerSync SDK (`@powersync/web`)
- Writing PowerSync integration code
- Updating service layer to use PowerSync
- Building sync UI components

**Why wait?**

- Service layer provides clean integration points for PowerSync
- Without services, PowerSync would integrate with 20+ IPC handlers (complex)
- Services enable proper conflict resolution and business logic separation

---

## Troubleshooting

### Supabase Connection Fails

**Problem:** Can't connect to Supabase
**Solution:**

- Verify API keys are correct
- Check URL format (should include `https://`)
- Ensure project is fully initialized (wait 2-3 minutes)

### Schema Migration Errors

**Problem:** SQL migration fails
**Solution:**

- Run migrations in order (001, 002, 003)
- Check for syntax errors in SQL
- Verify you're using correct Supabase region
- Try dropping tables and re-running: `DROP TABLE IF EXISTS projects CASCADE;`

### RLS Policies Block Access

**Problem:** Can't access data even when authenticated
**Solution:**

- Verify RLS policies are applied correctly
- Check user ID matches policy filter
- Use service_role key for admin access (bypasses RLS)
- Temporarily disable RLS for testing: `ALTER TABLE projects DISABLE ROW LEVEL SECURITY;`

### PowerSync Connection Fails

**Problem:** Can't connect to PowerSync
**Solution:**

- Verify PowerSync instance is active
- Check token expiration
- Ensure Supabase connection is configured first
- Verify sync rules are deployed

### Sync Rules Validation Errors

**Problem:** Sync rules fail to validate
**Solution:**

- Check YAML syntax (indentation matters)
- Verify table names match Supabase schema
- Ensure user ID filter is correct
- Test with simpler rules first, then add complexity

---

## Cost Breakdown

### Current Setup (Free Tier)

**Supabase Free Tier:**

- 500MB database storage
- 2GB bandwidth/month
- 50,000 monthly active users
- Unlimited API requests

**PowerSync Free Tier:**

- Up to 10 users
- Unlimited sync operations
- Community support

**Total Cost:** $0/month

### Production Upgrade Path

**Supabase Pro ($25/month):**

- 8GB database storage
- 50GB bandwidth/month
- 100,000 monthly active users
- Daily backups
- Email support

**PowerSync Pro ($99/month):**

- Unlimited users
- Priority support
- Advanced monitoring
- SLA guarantee

**Total Production Cost:** $124/month

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PowerSync Documentation](https://docs.powersync.com)
- [ShowStack Phase 3 Plan](./docs/archive/renovation/Phase-3-Cloud-Collaboration.md)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PowerSync Sync Rules Reference](https://docs.powersync.com/usage/sync-rules)

---

**Setup Status:** Infrastructure ready, integration pending Phase 2.3
**Last Updated:** February 4, 2026
**Next Steps:** Complete Phase 2.3 (Service Layer), then integrate PowerSync
