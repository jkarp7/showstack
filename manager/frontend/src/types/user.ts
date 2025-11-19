export interface User {
  id: string
  email: string
  name: string
  subscriptionTier: 'pm' | 'tour' | 'producer'
  subscriptionStatus: 'active' | 'trial' | 'cancelled' | 'expired'
  stripeCustomerId?: string
  plaidItemId?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  subscriptionTier: 'pm' | 'tour' | 'producer'
}
