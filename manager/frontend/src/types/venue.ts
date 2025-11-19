export interface VenueStop {
  id: string
  projectId: string
  venueName: string
  city: string
  state?: string
  country: string
  loadInDate: string
  showDate: string
  loadOutDate?: string
  advanceStatus: 'pending' | 'in_progress' | 'complete'
  advanceNotes?: string
  perDiemBudget: number
  perDiemSpent: number
  localCrewCount?: number
  localCrewCost?: number
  settlementStatus: 'pending' | 'in_progress' | 'complete'
  settlement?: Settlement
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Settlement {
  id: string
  venueStopId: string
  venueStop?: VenueStop
  grossRevenue?: number
  expenses: number
  netRevenue?: number
  perDiemTotal: number
  localCrewTotal: number
  transportTotal: number
  otherExpenses: number
  status: 'draft' | 'pending' | 'approved' | 'paid'
  approvedBy?: string
  approvedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateVenueStopData {
  venueName: string
  city: string
  state?: string
  country: string
  loadInDate: string
  showDate: string
  loadOutDate?: string
  perDiemBudget: number
  localCrewCount?: number
  localCrewCost?: number
}
