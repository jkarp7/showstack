import { useAuth } from '@/features/auth/hooks/useAuth'

export function useEdition() {
  const { user } = useAuth()

  const edition = user?.subscriptionTier || 'pm'

  return {
    edition,
    hasPM: ['pm', 'producer'].includes(edition),
    hasTour: ['tour', 'producer'].includes(edition),
    hasProducer: edition === 'producer',
  }
}
