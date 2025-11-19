# ShowStack:Manager - Quick Start Guide

Get ShowStack:Manager running in 5 minutes!

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Git

## Step 1: Clone & Install

```bash
git clone https://github.com/jkarp7/showstack.git
cd showstack/manager

# Install all dependencies
cd frontend && npm install
cd ../backend && npm install
```

## Step 2: Database Setup

```bash
# Create PostgreSQL database
createdb showstack_manager

# Or using psql:
psql -U postgres
CREATE DATABASE showstack_manager;
\q

# Set database URL in backend/.env
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/showstack_manager?schema=public"
JWT_SECRET=your-secret-key-change-this
PLAID_ENV=sandbox
```

## Step 3: Run Database Migrations

```bash
# From backend directory
npx prisma migrate dev --name init
npx prisma generate
```

## Step 4: Generate Encryption Key

```bash
# Generate a secure encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add to `backend/.env`:
```env
ENCRYPTION_KEY=your_generated_key_here
```

## Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd manager/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd manager/frontend
npm run dev
```

## Step 6: Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

## Next Steps

### 1. Create an Account
Navigate to http://localhost:3000/register and create your first user.

### 2. Set Up Plaid (Optional for Development)

Sign up for Plaid sandbox account:
1. Go to https://dashboard.plaid.com/signup
2. Get your credentials
3. Add to `backend/.env`:

```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
```

### 3. Explore the Features

- Create a project
- Set up budget departments
- Add vendors
- Create purchase orders
- Connect a bank account (sandbox)
- See automatic transaction matching!

## Troubleshooting

### Database connection error
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env matches your setup

### Port already in use
- Backend: Change PORT in backend/.env
- Frontend: Change port in frontend/vite.config.ts

### Prisma errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Tools

### Prisma Studio (Database GUI)
```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### API Testing
Use the provided Postman collection in `manager/docs/api-collection.json` or:

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","subscriptionTier":"pm"}'
```

## Common Tasks

### Add a new database migration
```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Reset everything and start fresh
```bash
cd backend
npx prisma migrate reset
npm run dev
```

### View logs
Backend logs are in the console where you ran `npm run dev`

---

## Need Help?

- Check the main README: `manager/README.md`
- Review the full technical docs: `manager/docs/`
- Open an issue on GitHub

Happy building! 🚀
