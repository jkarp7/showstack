export interface Budget {
  id: string
  projectId: string
  department: string
  category: string
  allocatedAmount: number
  committedAmount: number
  spentAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetWithVariance extends Budget {
  available: number
  variance: number
  percentSpent: number
  status: 'critical' | 'warning' | 'normal' | 'good'
}

export interface CreateBudgetData {
  department: string
  category: string
  allocatedAmount: number
  notes?: string
}
