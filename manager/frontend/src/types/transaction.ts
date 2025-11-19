export interface Transaction {
  id: string
  plaidTransactionId: string
  plaidAccountId: string
  amount: number
  date: string
  merchantName: string
  category: string[]
  matchedPOId?: string
  matchedSettlementId?: string
  matchingConfidence?: number
  manuallyMatched: boolean
  matchedAt?: string
  projectId?: string
  department?: string
  expenseCategory?: string
  isReconciled: boolean
  needsReview: boolean
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export interface PlaidAccount {
  id: string
  userId: string
  plaidAccountId: string
  plaidItemId: string
  institutionName: string
  accountName: string
  accountType: 'checking' | 'savings' | 'credit'
  accountMask: string
  lastSync?: string
  syncFrequency: 'daily' | 'weekly'
  isActive: boolean
  createdAt: string
  updatedAt: string
}
