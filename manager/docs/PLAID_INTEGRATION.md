# Plaid Integration Guide

Complete guide to implementing and using Plaid banking integration in ShowStack:Manager.

## Overview

Plaid provides secure bank account connections and transaction data. ShowStack:Manager uses Plaid to:

- Connect user bank accounts
- Sync transaction history (up to 90 days)
- Automatically match transactions to purchase orders
- Track per diem expenses on tour

## Plaid Environments

| Environment | Purpose | Cost | Transaction History |
|------------|---------|------|---------------------|
| Sandbox | Development/Testing | Free | Fake data |
| Development | Limited production testing | Free | 100 Items |
| Production | Live production | $1-5/connected account | Unlimited |

For initial development, use **Sandbox**.

---

## Setup

### 1. Create Plaid Account

1. Sign up at https://dashboard.plaid.com/signup
2. Complete account verification
3. Navigate to Team Settings → Keys
4. Copy your `client_id` and `sandbox` secret

### 2. Configure Environment

Add to `backend/.env`:

```env
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox
```

### 3. Install Dependencies

Already included in package.json:

```json
{
  "dependencies": {
    "plaid": "^17.0.0",
    "react-plaid-link": "^3.5.1"
  }
}
```

---

## Implementation

### Backend: Plaid Client Setup

**File:** `backend/src/services/plaid/client.ts` (create this)

```typescript
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)
```

### Backend: Create Link Token

**File:** `backend/src/services/plaid/linkService.ts`

```typescript
import { plaidClient } from './client.js'

export async function createLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'ShowStack Manager',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
  })

  return response.data.link_token
}
```

### Backend: Exchange Public Token

```typescript
import { encrypt } from '../../utils/encryption.js'
import { prisma } from '../../lib/prisma.js'

export async function exchangePublicToken(publicToken: string, userId: string) {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  })

  const accessToken = response.data.access_token
  const itemId = response.data.item_id

  // Get account details
  const accountsResponse = await plaidClient.accountsGet({
    access_token: accessToken,
  })

  // Store each account
  for (const account of accountsResponse.data.accounts) {
    await prisma.plaidAccount.create({
      data: {
        userId,
        plaidAccountId: account.account_id,
        plaidItemId: itemId,
        accessToken: encrypt(accessToken), // Encrypt!
        institutionName: accountsResponse.data.item.institution_id || 'Unknown',
        accountName: account.name,
        accountType: account.type,
        accountMask: account.mask || '****',
        isActive: true,
      },
    })
  }

  return itemId
}
```

### Frontend: Plaid Link Component

**File:** `frontend/src/features/plaid/components/PlaidLink.tsx`

```typescript
import { usePlaidLink } from 'react-plaid-link'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export function PlaidLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    // Get link token from backend
    api.post('/api/plaid/link/token')
      .then(res => setLinkToken(res.data.linkToken))
  }, [])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      // Exchange public token for access token
      await api.post('/api/plaid/link/exchange', {
        publicToken,
        metadata,
      })

      alert('Bank account connected successfully!')
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link error:', err)
      }
    },
  })

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="px-4 py-2 bg-primary text-white rounded-md"
    >
      Connect Bank Account
    </button>
  )
}
```

---

## Transaction Sync

### Manual Sync

```typescript
// backend/src/services/plaid/transactionService.ts
import { plaidClient } from './client.js'
import { decrypt } from '../../utils/encryption.js'
import { prisma } from '../../lib/prisma.js'
import { subDays, format } from 'date-fns'

export async function syncTransactions(plaidAccountId: string) {
  const account = await prisma.plaidAccount.findUnique({
    where: { id: plaidAccountId },
  })

  if (!account) throw new Error('Account not found')

  const accessToken = decrypt(account.accessToken)
  const lastSync = account.lastSync || subDays(new Date(), 90)

  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: format(lastSync, 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  })

  // Store transactions
  for (const tx of response.data.transactions) {
    await prisma.transaction.upsert({
      where: { plaidTransactionId: tx.transaction_id },
      create: {
        plaidTransactionId: tx.transaction_id,
        plaidAccountId: account.id,
        amount: Math.abs(tx.amount),
        date: new Date(tx.date),
        merchantName: tx.merchant_name || tx.name,
        category: tx.category || [],
        needsReview: true,
      },
      update: {
        amount: Math.abs(tx.amount),
        merchantName: tx.merchant_name || tx.name,
      },
    })
  }

  await prisma.plaidAccount.update({
    where: { id: plaidAccountId },
    data: { lastSync: new Date() },
  })

  return response.data.transactions.length
}
```

### Automatic Sync (Background Job)

```typescript
// backend/src/workers/transactionSyncWorker.ts
import Queue from 'bull'
import { syncTransactions } from '../services/plaid/transactionService.js'

const syncQueue = new Queue('transaction-sync', process.env.REDIS_URL!)

// Add daily sync jobs
export async function scheduleDailySyncs() {
  const accounts = await prisma.plaidAccount.findMany({
    where: {
      isActive: true,
      syncFrequency: 'daily',
    },
  })

  for (const account of accounts) {
    await syncQueue.add({ accountId: account.id }, {
      repeat: { cron: '0 2 * * *' }, // 2 AM daily
    })
  }
}

// Process sync jobs
syncQueue.process(async (job) => {
  const { accountId } = job.data
  await syncTransactions(accountId)
})
```

---

## Webhooks

Plaid can send webhooks for real-time transaction updates.

### Backend Webhook Handler

```typescript
// backend/src/routes/webhooks.ts
router.post('/plaid', async (req, res) => {
  const webhook = req.body

  switch (webhook.webhook_type) {
    case 'TRANSACTIONS':
      if (webhook.webhook_code === 'DEFAULT_UPDATE') {
        // New transactions available
        const itemId = webhook.item_id
        const account = await prisma.plaidAccount.findFirst({
          where: { plaidItemId: itemId },
        })

        if (account) {
          await syncTransactions(account.id)
        }
      }
      break

    case 'ITEM':
      if (webhook.webhook_code === 'ERROR') {
        // Item error, disable account
        await prisma.plaidAccount.updateMany({
          where: { plaidItemId: webhook.item_id },
          data: { isActive: false },
        })
      }
      break
  }

  res.json({ received: true })
})
```

### Register Webhook URL

In Plaid Dashboard:
1. Go to Account → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/plaid`
3. Select transaction webhooks

---

## Testing in Sandbox

### Test Credentials

Plaid provides test banks in sandbox:

| Institution | Username | Password |
|------------|----------|----------|
| Chase | user_good | pass_good |
| Bank of America | user_good | pass_good |
| Wells Fargo | user_good | pass_good |

### Test Scenarios

```
user_good / pass_good = Successfully connected account
user_bad / pass_good = Invalid credentials
custom_[institution] = Custom institution for testing
```

### Sample Transactions

Sandbox returns realistic fake transactions:
- Coffee shops: $3-8
- Grocery stores: $50-200
- Gas stations: $40-80
- Restaurants: $15-75
- Recurring bills: $50-150

---

## Security Best Practices

### 1. Never Expose Access Tokens

❌ **Never:**
```typescript
res.json({ accessToken: account.accessToken })
```

✅ **Always:**
```typescript
res.json({ accountId: account.id, institutionName: account.institutionName })
```

### 2. Encrypt at Rest

```typescript
// Always encrypt before storing
accessToken: encrypt(accessToken)

// Decrypt only when needed
const token = decrypt(account.accessToken)
```

### 3. Webhook Verification

```typescript
import crypto from 'crypto'

function verifyPlaidWebhook(body: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.PLAID_WEBHOOK_SECRET!)
  hmac.update(body)
  const expectedSignature = hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

### 4. Rate Limiting

Plaid has rate limits. Implement retry logic:

```typescript
async function retryPlaidRequest<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn()
  } catch (error: any) {
    if (error.response?.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return retryPlaidRequest(fn, retries - 1)
    }
    throw error
  }
}
```

---

## Production Checklist

Before going to production:

- [ ] Switch from sandbox to production credentials
- [ ] Set up webhook URL with SSL
- [ ] Implement webhook signature verification
- [ ] Add error handling for all Plaid API calls
- [ ] Set up monitoring for failed syncs
- [ ] Test Item error flows (reauth required)
- [ ] Implement token rotation
- [ ] Review Plaid pricing and limits
- [ ] Add user consent/privacy disclosures
- [ ] Test account disconnection flow

---

## Common Issues

### "Invalid access token"
- Token may have expired
- User may have changed bank password
- Trigger re-authentication via Link Update Mode

### "Product not ready"
- Transactions can take 1-2 minutes after connection
- Check webhook for "INITIAL_UPDATE"

### "Rate limit exceeded"
- Implement exponential backoff
- Cache transaction data
- Reduce sync frequency

---

## Resources

- Plaid Docs: https://plaid.com/docs/
- Plaid API Reference: https://plaid.com/docs/api/
- React Plaid Link: https://github.com/plaid/react-plaid-link
- Plaid Sandbox: https://dashboard.plaid.com/sandbox

---

For implementation questions, check the Plaid community forum or contact support through the dashboard.
