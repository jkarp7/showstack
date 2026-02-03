# Phase 3: Cloud Collaboration - Supabase + PowerSync

**Duration:** 6-8 weeks
**Status:** 🟡 Depends on Phase 2
**Priority:** CRITICAL (required for Lightwright parity)
**Goal:** Local-first cloud sync using PowerSync + Supabase

---

## Overview

**Why PowerSync + Supabase:**
- ✅ Zero backend code to write
- ✅ Saves 15-20 weeks vs custom backend
- ✅ $0/month MVP cost
- ✅ Built-in auth, real-time, conflict resolution

---

## Checklist

### 3.1 Supabase Setup (1 week)
- [ ] Create Supabase project
- [ ] Deploy database schema (projects, fixtures, shop_order_*)
- [ ] Configure Row-Level Security policies
- [ ] Set environment variables

### 3.2 PowerSync Integration (3-4 weeks)
- [ ] Install PowerSync SDK
- [ ] Define PowerSync schema (match Supabase)
- [ ] Create PowerSyncService
- [ ] Update all services to use PowerSync
- [ ] Test bidirectional sync

### 3.3 Supabase Auth (1-2 weeks)
- [ ] Install Supabase client
- [ ] Create SupabaseAuthService
- [ ] Build Login/SignUp UI
- [ ] Test auth flow

### 3.4 Collaboration UI (1 week)
- [ ] Build PresenceIndicator component
- [ ] Build SyncStatus component
- [ ] Test with 2+ simultaneous users

---

## Success Criteria

- ✅ PowerSync syncing bidirectionally
- ✅ Offline mode works (queue and replay)
- ✅ Multi-user editing tested
- ✅ Presence indicators working

**Status:** 🟡 Depends on Phase 2
**Next:** Phase 4 - Testing & Quality
