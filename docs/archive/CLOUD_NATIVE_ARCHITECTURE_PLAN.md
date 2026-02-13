# Cloud-Native Architecture: Authentication + Real-Time Collaboration (Issues #34 + #33)

## Overview

**MAJOR ARCHITECTURAL SHIFT**: Transitioning ShowStack from offline-first to **cloud-native with real-time collaboration** while maintaining offline capability.

This plan combines:

- **Issue #34**: User Authentication (JWT-based, server-managed)
- **Issue #33**: Real-Time Collaboration (cloud-native, NOT just cloud backup)
- Hybrid architecture: Cloud primary + local SQLite cache for offline work

**Key Features:**

- Backend server (Express.js + PostgreSQL + Socket.io)
- JWT authentication with server-side session management
- Real-time multi-user collaboration using Operational Transform (OT)
- WebSocket connections for instant updates
- Local SQLite cache for 14-day offline capability
- Conflict resolution for concurrent edits

## Strategic Context

**Priority**: Cloud-native is now the PRIMARY architecture

- Lightwright launching January 2026 with cloud collaboration
- ShowStack must compete with real-time collaboration features
- Issue #38 (File Merge) becomes obsolete with real-time sync
- Maintains "own it outright" positioning with offline capability

## User Requirements (from clarification)

1. **Cloud-Native from Start**: Design auth to work with cloud backend server from day 1
2. **Real-Time Collaboration PRIMARY**: Not cloud backup - actual multi-user real-time editing
3. **Schema Only for Teams/Workspaces**: Database tables ready but UI implementation deferred
4. **Issue #38 Obsolete**: File merge not needed with real-time collaboration
5. **Offline Support Required**: Still need 14-day grace period like existing license system
6. **Auth + Collaboration Together**: Build both as integrated system (not sequential)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│           ELECTRON DESKTOP APP (Client)                 │
├─────────────────────────────────────────────────────────┤
│  React Frontend + Zustand Stores                        │
│  ├─ UI Components (existing)                            │
│  ├─ WebSocket Client (Socket.io-client) - NEW          │
│  └─ Auth Context + Token Management - NEW              │
│                                                          │
│  Main Process (Electron Node.js)                        │
│  ├─ AuthService - JWT token storage - NEW              │
│  ├─ SyncService - Bi-directional sync - NEW            │
│  ├─ WebSocketClient - Real-time connection - NEW       │
│  ├─ CacheService - Local SQLite cache - NEW            │
│  └─ IPC Handlers (updated for cloud)                   │
│                                                          │
│  Local SQLite Cache (offline capability)                │
│  ├─ cache.db: Projects, fixtures, infrastructure       │
│  ├─ sync_queue: Pending changes when offline           │
│  └─ sync_metadata: Version tracking, conflicts         │
└─────────────────────────────────────────────────────────┘
                      ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────┐
│           BACKEND SERVER (Cloud) - NEW                  │
├─────────────────────────────────────────────────────────┤
│  Node.js + Express + TypeScript                         │
│  ├─ REST API (/api/auth, /projects, /fixtures, /sync)  │
│  ├─ JWT Authentication Middleware                       │
│  ├─ Services (Auth, User, Team, Project, Sync)         │
│  └─ Prisma ORM                                          │
│                                                          │
│  Socket.io WebSocket Server                             │
│  ├─ Real-time collaboration engine                      │
│  ├─ Operational Transform (OT) implementation          │
│  ├─ Presence detection (who's online)                   │
│  └─ Change broadcasting to all clients                  │
│                                                          │
│  PostgreSQL Database (Prisma)                           │
│  ├─ users, sessions, teams, projects                    │
│  ├─ fixtures, infrastructure_equipment                  │
│  ├─ change_log (for sync & audit)                      │
│  └─ sync_metadata (version tracking)                    │
│                                                          │
│  Redis Cache (optional)                                 │
│  └─ Session tokens, presence data, rate limiting        │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend (NEW - To Build)

- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **WebSocket**: Socket.io for real-time collaboration
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Hosting**: Railway.app (recommended) or Render/AWS
- **Cache**: Redis (optional, for sessions/presence)

### Desktop App (Updated)

- **Existing**: Electron + React + Zustand + SQLite (sql.js)
- **New**: Socket.io-client, axios, enhanced IPC handlers
- **Offline**: Local SQLite cache for 14-day offline work

## Core Components

### 1. Backend Server (NEW)

- REST API endpoints for CRUD operations
- WebSocket server for real-time updates
- Operational Transform (OT) for conflict-free editing
- JWT-based authentication
- PostgreSQL for cloud data storage

### 2. Desktop App Integration

- AuthService: Manage JWT tokens locally
- SyncService: Bi-directional sync engine
- WebSocketClient: Real-time connection to server
- CacheService: Local SQLite cache management
- Updated IPC handlers to work with cloud API

### 3. Real-Time Collaboration

- Socket.io rooms per project
- Presence detection (who's online, where)
- Operational Transform for concurrent edits
- Change broadcasting to all connected clients
- Conflict resolution UI

### 4. Offline Support

- Local SQLite cache (cache.db)
- Sync queue for offline changes
- 14-day grace period (matches license system)
- Conflict resolution when back online

---

---

## Database Schemas

### Cloud Database (PostgreSQL) - Primary Storage

**Users & Authentication:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Teams & Workspaces (Schema Only - UI Deferred):**

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id),
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP DEFAULT NOW()
);
```

**Projects & Data:**

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  owner_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  -- All existing project fields from current schema --
  version INTEGER DEFAULT 0,  -- For OT versioning
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fixtures (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  -- All 50+ fixture fields from current schema --
  version INTEGER DEFAULT 0,  -- For OT versioning
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE change_log (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50),  -- 'fixture', 'infrastructure', 'project'
  entity_id UUID,
  operation VARCHAR(50),  -- 'create', 'update', 'delete'
  changes JSONB,  -- Delta of changes
  version INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Local Cache Database (SQLite) - Offline Capability

**Cached Data:**

```sql
-- cache.db (local Electron SQLite)

CREATE TABLE cached_projects (
  id TEXT PRIMARY KEY,
  -- Project fields --
  cloud_version INTEGER DEFAULT 0,
  local_version INTEGER DEFAULT 0,
  last_synced_at INTEGER,
  has_pending_changes INTEGER DEFAULT 0
);

CREATE TABLE cached_fixtures (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  -- All fixture fields --
  cloud_version INTEGER DEFAULT 0,
  local_version INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  operation TEXT,  -- 'create', 'update', 'delete'
  changes TEXT,  -- JSON stringified
  timestamp INTEGER,
  status TEXT DEFAULT 'pending'  -- 'pending', 'syncing', 'synced', 'failed'
);

CREATE TABLE auth_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  user_id TEXT,
  CHECK (id = 1)  -- Single row
);
```

---

## Implementation Sequence

### Phase 1: Backend Foundation (Weeks 1-3)

**Week 1: Backend Setup**

1. Initialize backend project structure
   - Create `/showstack-backend/` directory
   - Set up Express.js + TypeScript
   - Configure tsconfig.json and package.json
   - Install dependencies: express, prisma, socket.io, bcryptjs, jsonwebtoken

2. Set up PostgreSQL database
   - Create Prisma schema (`/backend/prisma/schema.prisma`)
   - Define users, sessions, teams, projects tables
   - Run initial migration: `prisma migrate dev`

3. Deploy to Railway.app
   - Create Railway project
   - Connect GitHub repository
   - Add PostgreSQL database service
   - Configure environment variables
   - Set up automatic deployments

4. Create health check endpoint
   - `GET /health` - Returns server status
   - Test deployment and database connection

**Week 2: Authentication API**

1. Implement auth service (`/backend/src/services/auth.service.ts`)
   - `register(email, password, name)` - Create user
   - `login(email, password)` - Verify credentials, return JWT
   - `refreshToken(refreshToken)` - Issue new access token
   - `logout(sessionId)` - Revoke session
   - Use bcryptjs for password hashing (12 rounds)
   - Generate JWT tokens (access: 15min, refresh: 30 days)

2. Create auth routes (`/backend/src/routes/auth.routes.ts`)
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/refresh`
   - `POST /api/auth/logout`
   - Add request validation (zod schemas)

3. Implement JWT middleware (`/backend/src/middleware/auth.ts`)
   - Extract token from Authorization header
   - Verify JWT signature
   - Attach user to request object
   - Handle expired tokens

4. Session management
   - Store refresh tokens in sessions table (hashed)
   - Track IP address, user agent, expiration
   - Cleanup expired sessions (cron job)

**Week 3: Project & Data APIs**

1. Teams/workspaces endpoints (`/backend/src/routes/teams.routes.ts`)
   - `GET /api/teams` - List user's teams
   - `POST /api/teams` - Create team
   - `GET /api/teams/:id` - Get team details
   - `POST /api/teams/:id/members` - Add member (SCHEMA ONLY - NO UI)

2. Projects endpoints (`/backend/src/routes/projects.routes.ts`)
   - `GET /api/projects` - List user's projects
   - `POST /api/projects` - Create project
   - `GET /api/projects/:id` - Get project
   - `PATCH /api/projects/:id` - Update project
   - `DELETE /api/projects/:id` - Delete project

3. Fixtures endpoints (`/backend/src/routes/fixtures.routes.ts`)
   - `GET /api/projects/:projectId/fixtures` - List fixtures
   - `POST /api/projects/:projectId/fixtures` - Create fixture
   - `PATCH /api/projects/:projectId/fixtures/:id` - Update fixture
   - `DELETE /api/projects/:projectId/fixtures/:id` - Delete fixture

4. Infrastructure endpoints (`/backend/src/routes/infrastructure.routes.ts`)
   - Same CRUD pattern as fixtures

5. Add permissions middleware
   - Check user has access to project
   - Verify team membership
   - Role-based access control (owner, editor, viewer)

### Phase 2: Desktop App Auth Integration (Weeks 4-5)

**Week 4: Auth Services in Electron**

1. Create AuthService (`/src/main/services/AuthService.ts`)
   - Store JWT tokens in local SQLite (encrypted)
   - Methods: `login(email, password)`, `logout()`, `getAccessToken()`
   - Auto-refresh access token before expiration
   - Call backend API: `POST https://api.showstack.app/api/auth/login`

2. Create cache database schema (`/src/main/database/cacheSchema.ts`)
   - auth_tokens table (single row for current session)
   - cached_projects, cached_fixtures, cached_infrastructure
   - sync_queue table (pending changes when offline)
   - sync_metadata table (version tracking)

3. Create CacheService (`/src/main/services/CacheService.ts`)
   - Initialize cache.db (separate from app.db)
   - Methods for reading/writing cached data
   - Query local cache before hitting API

4. Update IPC handlers to use API (`/src/main/ipc/auth.ts`)
   - `auth:login` - Call authService.login(), store tokens
   - `auth:logout` - Clear tokens, clear cache
   - `auth:getCurrentUser` - Return cached user from token
   - Register handlers in `/src/main/index.ts`

**Week 5: API Client & Offline Detection**

1. Create ApiClient service (`/src/main/services/ApiClient.ts`)
   - Axios wrapper with auth token injection
   - Automatic token refresh on 401 responses
   - Base URL: `https://api.showstack.app`
   - Methods: `get()`, `post()`, `patch()`, `delete()`

2. Update existing IPC handlers to use API instead of local SQLite
   - `/src/main/ipc/projects.ts` - Fetch from API, cache locally
   - `/src/main/ipc/fixtures.ts` - CRUD via API, real-time updates
   - `/src/main/ipc/infrastructure.ts` - CRUD via API

3. Implement offline detection (`/src/main/services/NetworkMonitor.ts`)
   - Ping `https://api.showstack.app/health` every 5 seconds
   - Emit 'online' / 'offline' events
   - Update UI banner when offline

4. Implement cache-first strategy
   - Try local cache first (instant response)
   - Fetch from API in background if online
   - Update cache with fresh data

5. Frontend login UI (`/src/renderer/src/pages/Login.tsx`)
   - Remove "Skip login" button
   - Call `window.api.auth.login({ email, password })`
   - Store auth state in Zustand
   - Redirect to /modules on success

### Phase 3: Real-Time Collaboration (Weeks 6-8)

**Week 6: WebSocket Server**

1. Set up Socket.io server (`/backend/src/websocket/server.ts`)
   - Initialize Socket.io with Express server
   - Enable CORS for Electron client
   - Add connection authentication (verify JWT)
   - Configure transports (websocket, polling)

2. Implement connection handler (`/backend/src/websocket/handlers/connection.handler.ts`)
   - Verify JWT token on connection
   - Create socket-to-user mapping
   - Handle disconnections
   - Emit 'authenticated' event on success

3. Implement project rooms
   - `join-project` event - Add socket to project room
   - `leave-project` event - Remove socket from room
   - Track which users are in which projects
   - Broadcast user join/leave to room

4. Basic presence detection
   - Track online users per project
   - Emit `user:joined` / `user:left` events
   - Store presence in memory (Map<projectId, Set<userId>>)

**Week 7: Operational Transform (OT) Implementation**

1. Define OT operation types (`/backend/src/websocket/ot/operations.ts`)

   ```typescript
   type OTOperation = InsertOperation | DeleteOperation | UpdateOperation;

   interface UpdateOperation {
     type: 'update';
     entityType: 'fixture' | 'infrastructure';
     entityId: string;
     path: string[]; // Field path e.g. ['channel']
     oldValue: any;
     newValue: any;
     clientVersion: number;
     timestamp: number;
   }
   ```

2. Implement transformation logic (`/backend/src/websocket/ot/transform.ts`)
   - Transform concurrent operations
   - Last-write-wins for same field conflicts (based on timestamp)
   - Return transformed operation

3. Apply operations to database (`/backend/src/websocket/ot/apply.ts`)
   - Validate operation
   - Apply to PostgreSQL (update entity + increment version)
   - Log change in change_log table
   - Return new version

4. Implement operation handler (`/backend/src/websocket/handlers/fixture.handler.ts`)
   - Listen for 'operation' event from clients
   - Validate user permissions
   - Transform against concurrent operations
   - Apply to database
   - Broadcast to all clients in project room
   - Emit `fixture:updated` / `infrastructure:updated` events

5. Server-side operation broadcasting flow:
   ```
   Client A → operation → Server
                           ├─ Validate permissions
                           ├─ Transform against pending ops
                           ├─ Apply to PostgreSQL
                           ├─ Increment version
                           ├─ Log in change_log
                           └─ Broadcast to room (including Client A)
   ```

**Week 8: Desktop App WebSocket Integration**

1. Create WebSocketClient service (`/src/main/services/WebSocketClient.ts`)
   - Connect to `wss://api.showstack.app` with JWT auth
   - Handle reconnection logic
   - Join/leave project rooms
   - Send operations to server
   - Receive operations from server
   - Broadcast to renderer process via IPC

2. Add WebSocket IPC handlers (`/src/main/ipc/websocket.ts`)
   - `websocket:joinProject(projectId)` - Join project room
   - `websocket:leaveProject(projectId)` - Leave room
   - `websocket:sendOperation(operation)` - Send OT operation

3. Frontend WebSocket service (`/src/renderer/src/services/WebSocketService.ts`)
   - Event emitter for WebSocket events
   - Listen to IPC events from main process
   - Methods: `on()`, `off()`, `joinProject()`, `leaveProject()`

4. Update Zustand stores to listen to WebSocket events
   - `/src/renderer/src/store/fixtureStore.ts`
   - Listen for `fixture:updated`, `fixture:created`, `fixture:deleted`
   - Apply updates to local state immediately
   - Show live cursors/presence indicators

5. UI indicators
   - Online users list in project header
   - "User X is editing..." indicator on fixtures
   - Sync status badge (synced, syncing, offline)

### Phase 4: Sync Engine (Weeks 9-11)

**Week 9: Local Cache Implementation**

1. Initialize cache database (`/src/main/database/cache.ts`)
   - Create cache.db separate from app.db and project.db
   - Run cache schema migrations
   - Export getCache() function

2. Implement CacheService methods
   - `cacheProject(project)` - Store project in cache
   - `getCachedProject(id)` - Retrieve from cache
   - `cacheFixture(fixture)` - Store fixture in cache
   - `getCachedFixtures(projectId)` - Retrieve fixtures
   - `cacheInfrastructure(equipment)` - Store equipment
   - Mark cached_at timestamp on all operations

3. Implement sync queue
   - `queueChange(projectId, entityType, entityId, operation, changes)` - Add to queue
   - `getQueuedChanges()` - Get all pending changes
   - `markSynced(id)` - Mark change as synced
   - `markFailed(id, error)` - Mark change as failed

4. Update IPC handlers to use cache
   - Read from cache first (instant response)
   - Fetch from API in background if online
   - Queue writes to sync_queue when offline

**Week 10: Bi-Directional Sync**

1. Create SyncService (`/src/main/services/SyncService.ts`)
   - `start()` - Start periodic sync (every 30 seconds)
   - `stop()` - Stop sync timer
   - `sync()` - Perform full sync (push + pull)
   - `pushChanges()` - Push queued changes to server
   - `pullChanges()` - Pull remote changes from server

2. Implement push logic
   - Read all pending changes from sync_queue
   - POST to `/api/sync/push` with batch of changes
   - On success: mark as synced in queue
   - On failure: mark as failed, retry later
   - Handle auth errors (token expired)

3. Implement pull logic
   - GET `/api/sync/pull?projectId=X&since=Y` (Y = last known version)
   - Server returns all changes since version Y
   - Apply changes to local cache
   - Update sync_metadata (last_sync_version, last_sync_at)

4. Backend sync endpoints (`/backend/src/routes/sync.routes.ts`)
   - `POST /api/sync/push` - Accept batch of changes from client
   - `GET /api/sync/pull?projectId=X&since=Y` - Return changes since version Y
   - `POST /api/sync/resolve` - Resolve conflicts manually

5. Automatic sync triggers
   - Sync every 30 seconds when online
   - Sync immediately when NetworkMonitor emits 'online' event
   - Sync on app launch if authenticated

**Week 11: Conflict Resolution**

1. Detect conflicts
   - Client pushes change with version 5
   - Server is already at version 7
   - Server returns 409 Conflict with conflicting changes

2. Create ConflictResolverDialog UI (`/src/renderer/src/components/common/ConflictResolverDialog.tsx`)
   - Show local value vs server value
   - Show who made server change + timestamp
   - Buttons: "Keep Mine", "Use Server Version"
   - Apply resolution choice

3. Implement conflict resolution strategies
   - **Last-write-wins (automatic)**: Use timestamp to pick winner
   - **Manual resolution**: Show dialog, let user choose
   - **Field-level merge**: Different fields don't conflict
   - Log all conflicts for audit

4. Backend conflict detection (`/backend/src/services/sync.service.ts`)
   - Compare client version vs server version
   - If mismatch, return conflicting changes
   - Log conflicts in change_log table

### Phase 5: Testing & Polish (Weeks 12-14)

**Week 12: Integration Testing**

1. Multi-user collaboration testing
   - Open 2 desktop app instances with different users
   - Both join same project
   - Edit same fixture simultaneously
   - Verify both see changes in real-time
   - Verify OT resolves conflicts correctly

2. Offline → online transition testing
   - Start app online, join project
   - Disconnect internet
   - Make changes (should queue in sync_queue)
   - Reconnect internet
   - Verify changes sync automatically
   - Verify conflicts resolved if server changed

3. Conflict resolution testing
   - User A edits fixture channel "1" → "2" (offline)
   - User B edits same fixture channel "1" → "3" (online)
   - User A reconnects
   - Verify conflict dialog shows both values
   - User A chooses resolution
   - Verify both users see final value

4. Performance testing (1000+ fixtures)
   - Load project with 1000+ fixtures
   - Measure initial sync time
   - Measure WebSocket update latency
   - Verify UI remains responsive
   - Test virtual scrolling with real-time updates

**Week 13: UI/UX Polish**

1. Loading states and spinners
   - Show spinner during login
   - Show progress during initial project sync
   - Show "Syncing..." indicator during uploads

2. Error messages and recovery
   - "Unable to connect to server" banner
   - "Session expired, please log in" dialog
   - "Sync conflict detected" dialog with clear options
   - Retry logic for failed operations

3. Sync status indicators
   - Green checkmark: "All changes synced"
   - Orange spinner: "Syncing..."
   - Red warning: "Failed to sync, retrying..."
   - Gray cloud: "Offline - changes will sync when online"

4. Offline banner
   - Show at top of app when offline
   - Display: "Offline - X days remaining in grace period"
   - Yellow warning when < 3 days remaining
   - Red warning when offline > 14 days

5. Presence indicators
   - Avatar pills showing online users
   - "User X is editing fixture 123" tooltip
   - Live cursor positions (optional, future)
   - Last seen timestamp

**Week 14: Documentation & Deployment**

1. Backend API documentation
   - Set up Swagger/OpenAPI
   - Document all endpoints with examples
   - Authentication flow documentation
   - WebSocket events documentation

2. Developer documentation
   - Architecture overview
   - How to run backend locally
   - How to test real-time features
   - Database schema documentation
   - OT implementation explained

3. User documentation
   - How real-time collaboration works
   - How offline mode works (14-day grace period)
   - How to resolve sync conflicts
   - Team management guide
   - Troubleshooting guide

4. Monitoring and alerting
   - Set up error tracking (Sentry)
   - Set up logs aggregation (Papertrail or Railway logs)
   - Database query performance monitoring
   - WebSocket connection monitoring
   - Alert on high error rates

5. Production deployment
   - Backend: Railway.app production environment
   - Database: PostgreSQL backup schedule
   - Environment variables configured
   - SSL/TLS certificates (automatic via Railway)
   - Health check monitoring

### Phase 6: Migration & Rollout (Week 15)

1. Data migration scripts
   - Export data from local SQLite (existing users)
   - Transform to cloud PostgreSQL schema
   - Import via API (preserves user ownership)
   - Verify data integrity

2. Opt-in beta testing
   - Deploy to beta.showstack.app
   - Invite 10-20 early adopters
   - Collect feedback on real-time features
   - Monitor backend logs for errors
   - Fix bugs and iterate

3. Gradual rollout to all users
   - Release to production (api.showstack.app)
   - Update desktop app to use cloud backend
   - Phased rollout: 10% → 50% → 100%
   - Monitor error rates at each step
   - Provide fallback to offline-only mode if issues

4. Monitor for issues
   - Track sync errors
   - Track WebSocket connection failures
   - Track conflict resolution frequency
   - Track backend API latency
   - Track database query performance

5. Gather feedback and iterate
   - User surveys on collaboration features
   - Analytics on feature usage
   - Identify pain points
   - Plan next iteration improvements

---

## Critical Files: Backend Server (NEW - To Create)

### Backend Core

1. `/backend/src/index.ts` - Express server entry point + Socket.io setup
2. `/backend/src/config/database.ts` - Prisma client configuration
3. `/backend/prisma/schema.prisma` - PostgreSQL database schema (all tables)

### Authentication

4. `/backend/src/services/auth.service.ts` - JWT token generation, bcrypt hashing
5. `/backend/src/routes/auth.routes.ts` - POST /api/auth/login, /register, /refresh
6. `/backend/src/middleware/auth.ts` - JWT authentication middleware

### Data APIs

7. `/backend/src/routes/projects.routes.ts` - Project CRUD endpoints
8. `/backend/src/routes/fixtures.routes.ts` - Fixture CRUD endpoints
9. `/backend/src/routes/sync.routes.ts` - POST /push, GET /pull endpoints

### WebSocket & OT

10. `/backend/src/websocket/server.ts` - Socket.io server initialization
11. `/backend/src/websocket/handlers/fixture.handler.ts` - Real-time fixture updates
12. `/backend/src/websocket/ot/operations.ts` - OT operation type definitions
13. `/backend/src/websocket/ot/transform.ts` - OT transformation logic
14. `/backend/src/websocket/ot/apply.ts` - Apply operations to PostgreSQL

### Sync Engine

15. `/backend/src/services/sync.service.ts` - Conflict detection and resolution

---

## Critical Files: Desktop App (Modified/New)

### Electron Main Process Services

16. `/src/main/services/AuthService.ts` (NEW) - JWT token storage in SQLite
17. `/src/main/services/ApiClient.ts` (NEW) - Axios wrapper with auth injection
18. `/src/main/services/WebSocketClient.ts` (NEW) - Socket.io client wrapper
19. `/src/main/services/SyncService.ts` (NEW) - Bi-directional sync engine
20. `/src/main/services/CacheService.ts` (NEW) - Local SQLite cache management
21. `/src/main/services/NetworkMonitor.ts` (NEW) - Online/offline detection

### Database

22. `/src/main/database/cacheSchema.ts` (NEW) - Local cache database schema
23. `/src/main/database/cache.ts` (NEW) - Initialize cache.db

### IPC Handlers (Modified)

24. `/src/main/ipc/auth.ts` (NEW) - Auth IPC handlers
25. `/src/main/ipc/websocket.ts` (NEW) - WebSocket IPC handlers
26. `/src/main/ipc/fixtures.ts` (MODIFIED) - Use API + cache + WebSocket
27. `/src/main/ipc/projects.ts` (MODIFIED) - Use API + cache

### Frontend Services

28. `/src/renderer/src/services/WebSocketService.ts` (NEW) - WebSocket event emitter
29. `/src/renderer/src/hooks/useAuth.ts` (NEW) - React auth hook

### Frontend UI

30. `/src/renderer/src/pages/Login.tsx` (MODIFIED) - Remove "Skip login" button
31. `/src/renderer/src/pages/Register.tsx` (NEW) - User registration page
32. `/src/renderer/src/components/AuthGuard.tsx` (NEW) - Route protection
33. `/src/renderer/src/components/common/ConflictResolverDialog.tsx` (NEW) - Conflict UI

### Frontend State

34. `/src/renderer/src/store/authStore.ts` (NEW) - Auth Zustand store
35. `/src/renderer/src/store/fixtureStore.ts` (MODIFIED) - Listen to WebSocket events

### Types & Config

36. `/src/shared/types/auth.types.ts` (NEW) - Auth type definitions
37. `/src/shared/types/sync.types.ts` (NEW) - Sync/OT type definitions
38. `/src/preload/index.ts` (MODIFIED) - Add auth + WebSocket API methods

---

## Dependencies to Install

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@types/express": "^4.17.17",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "@types/bcryptjs": "^2.4.2",
    "jsonwebtoken": "^9.0.0",
    "@types/jsonwebtoken": "^9.0.2",
    "socket.io": "^4.6.0",
    "zod": "^3.21.0",
    "express-rate-limit": "^6.7.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "winston": "^3.8.0",
    "dotenv": "^16.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "vitest": "^0.34.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.12",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

### Desktop App New Dependencies

```json
{
  "dependencies": {
    "socket.io-client": "^4.6.0",
    "axios": "^1.4.0"
  }
}
```

**Note:** bcryptjs and jsonwebtoken only needed in backend. Desktop app just stores/sends tokens.

---

## Timeline Estimate

**Total: 15-16 weeks (3.5-4 months) for MVP**

### Breakdown by Phase:

- **Backend Foundation** (Weeks 1-3): 3 weeks
  - Backend setup, auth API, data APIs

- **Desktop Auth Integration** (Weeks 4-5): 2 weeks
  - Auth services, API client, offline detection

- **Real-Time Collaboration** (Weeks 6-8): 3 weeks
  - WebSocket server, OT implementation, desktop integration

- **Sync Engine** (Weeks 9-11): 3 weeks
  - Local cache, bi-directional sync, conflict resolution

- **Testing & Polish** (Weeks 12-14): 3 weeks
  - Integration testing, UI polish, documentation

- **Migration & Rollout** (Week 15): 1 week
  - Data migration, beta testing, production deployment

### Post-MVP Enhancements (Future):

- OAuth2 social login (Google, GitHub)
- Email verification and password reset
- Team management UI (add/remove members, roles)
- Cursor sharing (live editing indicators)
- Audit log UI
- Advanced conflict resolution (3-way merge)

---

## Security Considerations

### Password Security

- **Hashing**: bcryptjs with 12 rounds (backend server)
- **Validation**: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- **Storage**: Never store plaintext passwords, only password_hash

### Token Security

- **JWT**: Access token (15 min), Refresh token (30 days)
- **Storage**: Refresh tokens hashed in database, access tokens in local SQLite
- **Refresh**: Auto-refresh when access token < 5 min remaining
- **Revocation**: Refresh tokens can be revoked (logout)

### Session Management

- **Grace Period**: 14 days offline before forced re-authentication
- **Logout**: Single device or all devices
- **Cleanup**: Expired sessions auto-deleted after 30 days

### Data Security

- **HTTPS**: All API communication over TLS
- **WSS**: WebSocket over TLS (wss://)
- **CORS**: Restricted to Electron app origin
- **Rate Limiting**: Prevent brute force attacks

---

## Design Decisions & Rationale

### 1. PostgreSQL vs MongoDB

**Chosen:** PostgreSQL with Prisma ORM

**Rationale:**

- ShowStack data is highly structured (fixtures have 50+ defined fields)
- Relational data (projects → fixtures, teams → members)
- ACID compliance important for multi-user editing
- JSON/JSONB support for flexible fields (custom_fields, accessories)
- Better querying for complex reports
- Prisma provides type-safe queries and migrations

### 2. Operational Transform (OT) vs CRDT

**Chosen:** Operational Transform (OT)

**Rationale:**

- Fixtures are discrete entities with clear fields (not free-form text)
- OT is simpler to implement for this use case
- Lower bandwidth requirements (only deltas, not full state)
- Proven in production (Google Docs, Figma use OT)
- Last-write-wins strategy for same-field conflicts (based on timestamp)

### 3. Railway.app vs AWS

**Chosen:** Railway.app (initially)

**Rationale:**

- Faster time to market (zero-config PostgreSQL)
- Lower operational overhead (managed database, auto-scaling)
- Cost-effective for early stage (~$20-50/month)
- Easy migration to AWS later if scale requires
- Built-in SSL/TLS, environment variables, CI/CD

### 4. Real-Time WebSocket vs Polling

**Chosen:** Real-time WebSocket (Socket.io)

**Rationale:**

- Better UX for collaboration (instant updates)
- Lower server load than polling (no repeated requests)
- Presence detection requires WebSocket
- Aligns with cloud-native goal
- Socket.io handles reconnection and fallback transports

### 5. Hybrid Architecture (Cloud + Local Cache)

**Chosen:** Cloud primary + local SQLite cache

**Rationale:**

- Maintains offline capability (14-day grace period)
- Instant UI response (read from cache)
- No data loss when offline (sync queue)
- Graceful degradation to read-only after grace period
- Matches user expectation from current offline-first system

### 6. JWT Tokens (Short-Lived Access + Long-Lived Refresh)

**Chosen:** Access token (15 min) + Refresh token (30 days)

**Rationale:**

- Access token short-lived reduces risk if compromised
- Refresh token allows persistent sessions
- Refresh token stored hashed in database (can be revoked)
- Auto-refresh before expiration = seamless UX

---

## Risks & Mitigation

### Risk 1: Data Loss During Sync

**Impact:** High - Users lose work
**Mitigation:**

- Comprehensive conflict resolution UI
- change_log table tracks all modifications
- Ability to view/revert previous versions
- Extensive testing of sync scenarios
- User can always choose which version to keep

### Risk 2: Network Instability

**Impact:** Medium - Poor collaboration experience
**Mitigation:**

- Robust reconnection logic (Socket.io handles automatically)
- Queue changes locally when offline
- Clear UI indicators of online/offline status
- Graceful degradation to read-only mode
- 14-day grace period before forced logout

### Risk 3: Scale (1000+ Fixtures, Multiple Users)

**Impact:** Medium - Slow performance, high latency
**Mitigation:**

- Virtual scrolling for large data grids (already implemented)
- Incremental sync (only fetch changed data, not full project)
- Database indexing on common queries (project_id, user_id, version)
- Delta broadcasting (only changed fields, not entire fixture)
- Load testing before production launch

### Risk 4: Backend Costs Exceed Budget

**Impact:** Medium - Unsustainable operating expenses
**Mitigation:**

- Start with Railway (predictable pricing)
- Monitor usage and optimize queries
- Implement rate limiting to prevent abuse
- Plan for tiered pricing (free tier with limits)
- Can migrate to AWS if scale requires

### Risk 5: User Adoption (Learning Curve)

**Impact:** Medium - Users don't use collaboration features
**Mitigation:**

- Gradual opt-in rollout (beta testing first)
- Clear documentation and tutorials
- In-app onboarding for real-time features
- Maintain offline-first mode as fallback
- Collect feedback and iterate

### Risk 6: Conflict Resolution Complexity

**Impact:** Low - Users confused by conflicts
**Mitigation:**

- Automatic resolution (last-write-wins) for most cases
- Only show dialog for irreconcilable conflicts
- Clear UI showing both versions side-by-side
- Default to "Keep Mine" for safety
- Log all conflicts for support debugging

---

## Success Criteria

### Backend (Must Have)

- ✅ Backend server deployed to Railway.app with PostgreSQL
- ✅ User registration and JWT authentication working
- ✅ All REST API endpoints functional (auth, projects, fixtures, sync)
- ✅ WebSocket server handles real-time connections
- ✅ Operational Transform correctly resolves concurrent edits
- ✅ Change log tracks all modifications for audit

### Desktop App (Must Have)

- ✅ Login page removes "Skip login" bypass, connects to backend
- ✅ JWT tokens stored securely in local SQLite
- ✅ WebSocket client connects to server and receives real-time updates
- ✅ Local SQLite cache works for 14-day offline capability
- ✅ Sync engine pushes/pulls changes bi-directionally
- ✅ Conflict resolution UI shows and resolves conflicts

### Real-Time Collaboration (Must Have)

- ✅ Two users can edit same project simultaneously
- ✅ Changes appear in real-time on both screens (< 1 second latency)
- ✅ Concurrent edits to same fixture resolve automatically (OT)
- ✅ Presence detection shows who's online
- ✅ UI indicators show sync status (synced, syncing, offline)

### Offline Support (Must Have)

- ✅ Users can work offline for 14 days
- ✅ Changes queue locally when offline
- ✅ Automatic sync when back online
- ✅ Conflict resolution when offline changes conflict with server
- ✅ Grace period warning banner shows days remaining

### Performance (Must Have)

- ✅ Initial project sync completes in < 5 seconds (1000 fixtures)
- ✅ Real-time updates arrive in < 1 second
- ✅ UI remains responsive during sync
- ✅ Virtual scrolling handles 1000+ fixtures smoothly

### Security (Must Have)

- ✅ Passwords hashed with bcryptjs (12 rounds)
- ✅ JWT tokens expire and auto-refresh
- ✅ All API communication over HTTPS/WSS
- ✅ Rate limiting prevents brute force attacks
- ✅ User permissions enforced server-side

---

## Out of Scope (Future Enhancements)

These features are **designed into the schema** but **not implemented in MVP**:

1. **Team Management UI**: Add/remove team members, assign roles (schema exists, UI deferred)
2. **Email Verification**: Verify email addresses on registration
3. **Password Reset**: Email-based password reset flow
4. **OAuth2 Social Login**: Google, GitHub authentication
5. **Cursor Sharing**: Live editing indicators showing user cursors
6. **Session Management UI**: View/revoke active sessions in account page
7. **Audit Log UI**: View change history with user attribution
8. **3-Way Merge**: Advanced conflict resolution
9. **User Profile Page**: Edit name, avatar, preferences
10. **Team Billing**: Team-based subscription management

---

## Summary

This plan represents a **major architectural evolution** for ShowStack:

### From Offline-First → Cloud-Native Hybrid

- **Was**: Local SQLite only, no backend, no real-time features
- **Now**: Cloud PostgreSQL primary + local cache, real-time collaboration, offline-capable

### What This Enables

- ✅ **Real-time collaboration**: Multiple users editing same project simultaneously
- ✅ **Cloud-native**: Compete with Lightwright's cloud platform
- ✅ **Future-ready**: Foundation for team management, cloud storage, mobile apps
- ✅ **Offline support**: Maintains 14-day grace period (existing behavior)
- ✅ **Issue #38 obsolete**: File merge not needed with real-time sync

### What This Requires

- ✅ **Backend server**: Express.js + PostgreSQL + Socket.io (new infrastructure)
- ✅ **15-16 weeks implementation**: Significant development effort
- ✅ **Ongoing costs**: ~$20-50/month for Railway.app hosting
- ✅ **Data migration**: Move existing users from local SQLite to cloud

### Strategic Value

- 🎯 **Compete with Lightwright**: Real-time collaboration is their major selling point
- 🎯 **Modern architecture**: Cloud-native is industry standard
- 🎯 **Scalable**: Can support growth without rewrite
- 🎯 **Revenue opportunity**: Team plans, cloud storage, premium features

### Key Risks

- ⚠️ **Complexity**: Much larger scope than original offline-first auth
- ⚠️ **Backend costs**: Ongoing operational expenses
- ⚠️ **User adoption**: Learning curve for collaboration features
- ⚠️ **Migration**: Moving existing users to cloud

### Mitigation

- ✅ **Phased rollout**: Beta test with early adopters first
- ✅ **Offline fallback**: Users can still work offline 14 days
- ✅ **Cost monitoring**: Start small with Railway, scale as needed
- ✅ **Clear documentation**: Tutorials and onboarding for new features

---

## Next Steps

**Immediate (This Week):**

1. Review this plan with stakeholders
2. Confirm scope and timeline (15-16 weeks)
3. Confirm budget for backend hosting (~$20-50/month)
4. Decide: Build now or phase differently?

**If Approved (Week 1):**

1. Create backend repository (`showstack-backend`)
2. Set up Railway.app account and PostgreSQL
3. Initialize Express + TypeScript project
4. Start implementing authentication API

**Alternative Approach (If Timeline Too Long):**

1. **Option A**: Implement just authentication (Issues #34) first with local SQLite (original 7-day plan)
2. Then revisit cloud-native architecture for Issue #33 separately
3. **Trade-off**: Will require refactoring auth system later

---

## Questions for User

Before proceeding, please confirm:

1. **Scope**: Are you comfortable with 15-16 week timeline for cloud-native system?
2. **Costs**: Are you OK with ~$20-50/month ongoing backend hosting costs?
3. **Alternatives**: Do you want to proceed with full cloud-native, or implement local auth first (7 days) and defer cloud to later?
4. **Resources**: Do you have backend development experience, or will this be learning as you go?

---

_This plan represents the comprehensive cloud-native architecture combining Issues #34 (Auth) and #33 (Collaboration) as requested._
