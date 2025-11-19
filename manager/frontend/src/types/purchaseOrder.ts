export interface Vendor {
  id: string
  name: string
  primaryContact?: string
  email?: string
  phone?: string
  address?: string
  type: string
  paymentTerms?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  projectId: string
  vendorId: string
  vendor?: Vendor
  poNumber: string
  amount: number
  status: 'pending' | 'approved' | 'sent' | 'paid' | 'cancelled'
  issueDate: string
  paymentTerms?: string
  dueDate?: string
  department: string
  category: string
  description?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreatePOData {
  vendorId: string
  amount: number
  department: string
  category: string
  paymentTerms?: string
  dueDate?: string
  description?: string
  notes?: string
}
