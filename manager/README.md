# ShowStack:Manager

**Modern production and tour management platform with real-time financial tracking**

ShowStack:Manager brings FinTech capabilities to live entertainment production management, providing automatic transaction matching, real-time budget variance visibility, and seamless banking integration via Plaid API.

---

## 🎯 Overview

ShowStack:Manager eliminates manual financial reconciliation for production and tour managers by integrating directly with banking systems. It's the first production management tool to offer:

- **Real-time transaction sync** via Plaid API
- **Automatic transaction matching** to POs and settlements
- **Budget vs. Actual tracking** with instant variance visibility
- **Three specialized editions** (PM, Tour, Producer) with shared financial backend

---

## 💼 Product Editions

### PM Edition - $79/month
**Target Users:** Production Managers, General Managers (office-based)

**Features:**
- Pre-production budgeting by department/category
- Vendor management
- Purchase order creation and tracking
- Invoice reconciliation
- Automatic transaction matching to POs

### Tour Edition - $99/month
**Target Users:** Tour Managers, Company Managers, Advance Teams

**Features:**
- Venue advancing and stop management
- Per diem tracking with card integration
- Settlement processing
- Travel logistics
- Local crew management

### Producer Edition - $199/month
**Target Users:** Producers, Executive Producers, Company Owners

**Features:**
- Multi-show portfolio oversight
- Rental inventory management
- Resource allocation across projects
- Cash flow forecasting
- Executive dashboards
- All PM + Tour features

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript 5
- Vite (build tool)
- Tailwind CSS + Radix UI
- Zustand (state management)
- React Query (data fetching)
- React Plaid Link

**Backend:**
- Node.js 20+ + Express
- PostgreSQL (via Prisma ORM)
- Plaid API (banking integration)
- Stripe (payments)
- JWT authentication
- Bull (background jobs)

**Infrastructure:**
- Electron (desktop app wrapper)
- Redis (job queue)
- SendGrid (email)

### Project Structure

```
manager/
├── frontend/              # React application
│   ├── src/
│   │   ├── features/     # Feature-based organization
│   │   │   ├── auth/
│   │   │   ├── pm/       # PM Edition features
│   │   │   ├── tour/     # Tour Edition features
│   │   │   ├── producer/ # Producer Edition features
│   │   │   ├── plaid/    # Plaid integration
│   │   │   └── ...
│   │   ├── components/   # Shared UI components
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
├── backend/              # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── plaid/
│   │   │   ├── matching/
│   │   │   └── ...
│   │   ├── middleware/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── docs/                 # Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (for background jobs)
- Plaid account (sandbox for development)
- Stripe account (test mode)

### Installation

```bash
# Clone the repository
git clone https://github.com/jkarp7/showstack.git
cd showstack/manager

# Install dependencies
npm run install:all

# Set up environment variables
cd backend
cp .env.example .env
# Edit .env with your credentials

cd ../frontend
# Frontend uses backend proxy, no .env needed for dev

# Set up database
cd ../backend
npx prisma migrate dev
npx prisma generate

# Generate encryption key (for Plaid tokens)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add to ENCRYPTION_KEY in backend/.env
```

### Development

```bash
# Terminal 1: Start backend
cd manager/backend
npm run dev

# Terminal 2: Start frontend
cd manager/frontend
npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:5000
Prisma Studio: `npx prisma studio` (http://localhost:5555)

---

## 📊 Key Features

### 1. Plaid Banking Integration

**Bank Connection Flow:**
1. User clicks "Connect Bank Account"
2. Plaid Link modal opens
3. User authenticates with bank
4. Access token stored (AES-256 encrypted)
5. Transactions sync automatically (daily/weekly)

**Transaction Sync:**
- Automatic daily sync via background jobs
- Manual sync on-demand
- Webhook support for real-time updates
- 90-day transaction history

### 2. Smart Transaction Matching

**Matching Algorithm:**
- **Amount matching** (40 points): Exact or within 5%
- **Vendor name similarity** (40 points): Fuzzy matching (Levenshtein distance)
- **Date proximity** (20 points): Within 7 days of PO issue date

**Auto-match threshold:** 85% confidence
**Manual review:** 50-85% confidence
**Reject:** <50% confidence

### 3. Budget vs. Actual Tracking

Real-time variance calculation:
- **Allocated:** Original budget
- **Committed:** POs issued but not paid
- **Spent:** Matched transactions
- **Available:** Allocated - Committed - Spent

**Variance Status:**
- 🔴 Critical: Over budget by >10%
- 🟡 Warning: Over budget
- ⚪ Normal: Within budget
- 🟢 Good: Under budget by >20%

### 4. Tour Per Diem Management

- Automatic categorization (hotel, meal, transportation)
- Venue stop assignment based on transaction date
- Per diem budget tracking per venue
- Over-budget alerts

### 5. Producer Portfolio Dashboard

- Multi-project aggregation
- Total budget vs. spent across all shows
- Cash flow forecasting
- Rental inventory tracking
- Resource allocation

---

## 🔒 Security

### Data Protection

- **AES-256-GCM encryption** for Plaid access tokens
- **JWT authentication** with secure httpOnly cookies
- **Password hashing** with bcrypt (10 rounds)
- **Rate limiting** on all API endpoints
- **Helmet.js** for HTTP security headers
- **SQL injection prevention** via Prisma ORM

### Plaid Security

- Access tokens never sent to frontend
- Encrypted at rest in database
- Automatic token rotation
- Webhook signature verification

### Edition-Based Access Control

Middleware enforces feature access based on subscription tier:

```typescript
// Backend
router.get('/portfolio',
  authenticateJWT,
  requireEdition('producer'),
  portfolioController.get
)

// Frontend
const { hasProducer } = useEdition()
if (hasProducer) {
  // Show producer features
}
```

---

## 📈 Roadmap

### Phase 1: Foundation (Weeks 1-8) - IN PROGRESS
- ✅ Project structure setup
- ✅ Database schema design
- ✅ Frontend/backend scaffolding
- 🚧 User authentication
- 🚧 Basic Plaid connection
- ⬜ CRUD operations (projects, budgets, POs)

### Phase 2: Smart Matching (Weeks 9-14)
- ⬜ Transaction sync implementation
- ⬜ Matching algorithm
- ⬜ Manual review queue
- ⬜ Tour per diem tracking
- ⬜ Settlement processing

### Phase 3: Producer Edition (Weeks 15-22)
- ⬜ Portfolio dashboard
- ⬜ Multi-project analytics
- ⬜ Inventory management
- ⬜ Cash flow forecasting

### Phase 4: Launch (Weeks 23-28)
- ⬜ Performance optimization
- ⬜ Security audit
- ⬜ Beta testing
- ⬜ Public launch

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 📄 License

Copyright © 2025 Lytrix / Josh Karp Designs
Proprietary - All rights reserved during development

---

## 🤝 Contributing

This is currently a private project in early development. Contributions will be welcomed after beta launch.

---

## 📞 Contact

**Josh Karp**
Lytrix / Josh Karp Designs
[jkarp.com](https://jkarp.com)

---

**Built for the live entertainment industry**

🎭 Theater • 🎵 Concert • 🎪 Festival • 🎬 Corporate Events
