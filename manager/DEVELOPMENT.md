# Development Guide - ShowStack:Manager

## Project Structure Overview

```
manager/
├── frontend/                 # React application
│   ├── src/
│   │   ├── features/        # Feature modules (auth, pm, tour, producer, plaid)
│   │   ├── components/      # Shared UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Third-party integrations (api, plaid, stripe)
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Helper functions
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Helper functions
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── tsconfig.json
│
└── docs/                     # Documentation
```

## Development Workflow

### 1. Running in Development

**Backend (Terminal 1):**
```bash
cd manager/backend
npm run dev
```
- Runs on http://localhost:5000
- Auto-reloads on file changes (tsx watch)
- Logs all HTTP requests (morgan)

**Frontend (Terminal 2):**
```bash
cd manager/frontend
npm run dev
```
- Runs on http://localhost:3000
- Hot module replacement (HMR)
- Proxies API calls to backend

### 2. Database Workflow

**Create a migration:**
```bash
cd manager/backend
npx prisma migrate dev --name description_of_change
```

**View database:**
```bash
npx prisma studio
# Opens at http://localhost:5555
```

**Reset database (WARNING: deletes all data):**
```bash
npx prisma migrate reset
```

### 3. Adding Features

#### Adding a New Route (Backend)

1. Create route file in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add business logic in `backend/src/services/`
4. Register route in `backend/src/index.ts`

Example:
```typescript
// routes/vendors.ts
import { Router } from 'express'
import { vendorController } from '../controllers/vendorController.js'
import { authenticateJWT } from '../middleware/auth.js'

const router = Router()
router.use(authenticateJWT)

router.get('/', vendorController.list)
router.post('/', vendorController.create)

export default router

// index.ts
import vendorRoutes from './routes/vendors.js'
app.use('/api/vendors', vendorRoutes)
```

#### Adding a Feature (Frontend)

1. Create feature directory in `frontend/src/features/`
2. Add components, hooks, services
3. Add routes in `App.tsx`
4. Add navigation in `Sidebar.tsx`

Example structure:
```
features/vendors/
├── components/
│   ├── VendorList.tsx
│   ├── VendorForm.tsx
│   └── VendorCard.tsx
├── hooks/
│   └── useVendors.ts
└── services/
    └── vendorService.ts
```

### 4. TypeScript Types

**Shared types** are in `frontend/src/types/`

When adding a new database model:
1. Add to Prisma schema
2. Run `npx prisma generate`
3. Create corresponding TypeScript type in `frontend/src/types/`

### 5. Styling

Using **Tailwind CSS** with custom theme:
- Colors defined in `tailwind.config.js`
- CSS variables in `src/index.css`
- Component styles use Tailwind classes

Example:
```tsx
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
  Click me
</button>
```

### 6. API Calls

Use the configured axios instance:
```typescript
import { api } from '@/lib/api'

// GET request
const response = await api.get('/api/projects')

// POST request
const response = await api.post('/api/projects', {
  name: 'New Project',
  type: 'tour',
})

// Authentication handled automatically via interceptor
```

### 7. State Management

Using **Zustand** for global state:

```typescript
// Create store
import { create } from 'zustand'

interface ProjectStore {
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
}))

// Use in component
const { currentProject, setCurrentProject } = useProjectStore()
```

### 8. Testing

**Backend tests:**
```bash
cd manager/backend
npm test
```

**Frontend tests:**
```bash
cd manager/frontend
npm test
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Avoid `any` (use `unknown` if needed)
- Use explicit return types for functions

### Naming Conventions

- **Components:** PascalCase (`UserProfile.tsx`)
- **Files:** camelCase (`userService.ts`)
- **Hooks:** `use` prefix (`useAuth.ts`)
- **Types:** PascalCase (`User`, `Project`)
- **Functions:** camelCase (`calculateBudget()`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_UPLOAD_SIZE`)

### File Organization

- One component per file
- Group related components in folders
- Export from index files for cleaner imports

## Common Tasks

### Add a Database Field

1. Update Prisma schema
```prisma
model Project {
  // ... existing fields
  newField String?
}
```

2. Create migration
```bash
npx prisma migrate dev --name add_new_field
```

3. Update TypeScript types
```typescript
export interface Project {
  // ... existing fields
  newField?: string
}
```

### Add Edition-Specific Feature

1. Add middleware check (backend)
```typescript
router.get('/feature',
  authenticateJWT,
  requireEdition('producer'),
  controller.get
)
```

2. Add UI check (frontend)
```typescript
const { hasProducer } = useEdition()

{hasProducer && <ProducerFeature />}
```

### Add Plaid Integration

See `docs/PLAID_INTEGRATION.md` for complete guide.

## Environment Variables

### Backend

Required:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Secret for JWT tokens
- `ENCRYPTION_KEY` - 64-char hex for AES-256

Optional:
- `PLAID_CLIENT_ID`, `PLAID_SECRET` - For banking
- `STRIPE_SECRET_KEY` - For payments
- `SENDGRID_API_KEY` - For emails
- `REDIS_URL` - For background jobs

### Frontend

- `VITE_API_URL` - Backend API URL (defaults to proxy)

## Debugging

### Backend Debugging

1. Add breakpoints in VS Code
2. Run with debugger: F5 or use debug config

Or add console logs:
```typescript
import { logger } from '../utils/logger.js'

logger.debug('Debug message', { data })
logger.info('Info message')
logger.error('Error message', error)
```

### Frontend Debugging

- Use React DevTools browser extension
- Check Network tab for API calls
- Use browser console
- Add `console.log()` or use debugger

### Database Debugging

Use Prisma Studio:
```bash
npx prisma studio
```

Or check raw queries:
```typescript
const result = await prisma.$queryRaw`SELECT * FROM "User"`
```

## Performance

### Backend

- Use database indexes (defined in Prisma schema)
- Implement pagination for large lists
- Cache frequently accessed data (Redis)
- Use background jobs for slow operations (Bull)

### Frontend

- Code splitting with React.lazy()
- Memoize expensive calculations (useMemo)
- Debounce user input
- Virtual scrolling for long lists
- Optimize images

## Deployment

### Frontend

```bash
cd manager/frontend
npm run build
# Outputs to dist/
```

Deploy `dist/` to:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

### Backend

```bash
cd manager/backend
npm run build
# Outputs to dist/

npm start
# Runs production build
```

Deploy to:
- AWS EC2 / ECS
- Heroku
- Railway
- DigitalOcean App Platform

### Database

Use managed PostgreSQL:
- AWS RDS
- Heroku Postgres
- Railway
- Supabase

Run migrations on deploy:
```bash
npx prisma migrate deploy
```

## Git Workflow

1. Create feature branch
```bash
git checkout -b feature/feature-name
```

2. Make changes and commit
```bash
git add .
git commit -m "Add feature description"
```

3. Push to remote
```bash
git push origin feature/feature-name
```

4. Create pull request on GitHub

## Need Help?

- Check documentation in `docs/`
- Review existing code for patterns
- Search GitHub issues
- Ask in team chat

Happy coding! 🚀
