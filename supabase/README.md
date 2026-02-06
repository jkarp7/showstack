# Supabase & PowerSync Configuration

This directory contains all configuration files for ShowStack's cloud infrastructure.

## Directory Structure

```
supabase/
├── migrations/           # SQL migration files for Supabase
│   ├── 001_initial_schema.sql    # Complete database schema (17 tables)
│   ├── 002_indexes.sql           # Performance indexes (40+ indexes)
│   └── 003_rls_policies.sql      # Row-Level Security policies
│
├── powersync/            # PowerSync sync rules
│   └── sync-rules.yaml           # Defines which tables to sync and filters
│
└── README.md             # This file
```

## Files Overview

### `migrations/001_initial_schema.sql`
- Creates all ShowStack tables in PostgreSQL
- Converts SQLite schema to PostgreSQL (BIGINT timestamps, BOOLEAN flags, JSONB)
- Adds `user_id` columns for Row-Level Security
- Defines foreign key relationships
- **Run this first** in Supabase SQL Editor

### `migrations/002_indexes.sql`
- Creates 40+ performance indexes
- Optimized for common query patterns
- Includes composite indexes for filtering
- **Run this second** in Supabase SQL Editor

### `migrations/003_rls_policies.sql`
- Enables Row-Level Security on all tables
- Users can only access their own data
- Service role bypasses RLS for admin operations
- Policies for all CRUD operations (SELECT, INSERT, UPDATE, DELETE)
- **Run this third** in Supabase SQL Editor

### `powersync/sync-rules.yaml`
- Defines 3 sync buckets:
  1. **user_projects** - ShowStack projects and related data (fixtures, racks, infrastructure)
  2. **shop_orders** - Shop order projects and items
  3. **user_templates** - Reusable templates (page layouts, paperwork configs)
- Filters data by user_id (only sync user's data)
- Uses Last-Write-Wins conflict resolution
- **Upload this** in PowerSync Dashboard → Sync Rules

## Setup Instructions

Follow the complete setup guide in the root directory:
**[SUPABASE_SETUP_GUIDE.md](../SUPABASE_SETUP_GUIDE.md)**

## Quick Reference

### Supabase Dashboard Locations
- **SQL Editor**: Run migrations here
- **Table Editor**: View/verify schema
- **Database → Replication**: Enable realtime for PowerSync
- **Settings → API**: Get API keys

### PowerSync Dashboard Locations
- **Settings → Database Connection**: Connect to Supabase
- **Sync Rules**: Upload sync-rules.yaml
- **Settings → Credentials**: Get PowerSync URL and token

## Environment Variables

After setup, add these to your `.env` file (see `.env.example` in root):

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# PowerSync
POWERSYNC_URL=https://xxxxx.powersync.com
POWERSYNC_TOKEN=eyJhbGc...
```

## Security Notes

⚠️ **CRITICAL**: Never commit `.env` to git (already in `.gitignore`)

⚠️ **CRITICAL**: Never use `SUPABASE_SERVICE_ROLE_KEY` in renderer process (main process only)

✅ RLS policies ensure users can only access their own data

✅ PowerSync sync rules filter by `user_id` automatically

## Database Schema Summary

**17 Tables Total:**

**Production Tables (13):**
- `projects` - Main project records
- `fixtures` - Lighting fixtures (100+ columns)
- `dimmer_racks` - Dimmer power distribution
- `dimmer_rack_modules` - Module configurations
- `pd_racks` - Non-dimmed power distribution
- `phase_distribution_templates` - Electrical phase configurations
- `infrastructure_equipment` - Network/audio/video equipment
- `user_preferences` - Per-project settings
- `shop_order_projects` - Equipment rental orders
- `shop_order_sections` - Order categories
- `shop_order_items` - Individual line items
- `shop_order_revisions` - Version control
- `shop_order_notes` - 3-tier notes system

**Template Tables (4):**
- `shop_order_note_templates` - Reusable note templates
- `page_layout_templates` - Visual page designer
- `page_layout_elements` - Layout components
- `paperwork_templates` - Report configurations

## Integration Status

✅ **Schema Ready**: All migrations created and documented
✅ **RLS Configured**: Security policies defined
✅ **PowerSync Rules**: Sync rules created
✅ **Environment Template**: .env.example updated

⏳ **Integration Pending**: Phase 2.3 (Service Layer) must be complete before PowerSync integration

## Next Steps

1. **Now**: Follow [SUPABASE_SETUP_GUIDE.md](../SUPABASE_SETUP_GUIDE.md) to deploy infrastructure
2. **After Phase 2.3**: Integrate PowerSync SDK with service layer
3. **Phase 3.4**: Build collaboration UI components

## Troubleshooting

### Migration Fails
- Run migrations in order (001, 002, 003)
- Check for syntax errors
- Verify Supabase project is fully initialized

### RLS Blocks Access
- Verify user is authenticated
- Check `user_id` matches in policies
- Use service_role key for admin access (bypasses RLS)

### PowerSync Connection Fails
- Verify Supabase connection configured first
- Check token expiration
- Ensure sync rules are deployed

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PowerSync Documentation](https://docs.powersync.com)
- [ShowStack Phase 3 Plan](../docs/renovation/Phase-3-Cloud-Collaboration.md)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PowerSync Sync Rules Reference](https://docs.powersync.com/usage/sync-rules)

---

**Last Updated:** February 4, 2026
**Status:** Configuration ready, integration pending Phase 2.3
