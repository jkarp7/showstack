/**
 * Financial calculation utilities
 */

export function calculateVariance(allocated: number, spent: number): number {
  return allocated - spent
}

export function calculatePercentSpent(spent: number, allocated: number): number {
  if (allocated === 0) return 0
  return (spent / allocated) * 100
}

export function getVarianceStatus(
  variance: number,
  allocated: number
): 'critical' | 'warning' | 'normal' | 'good' {
  if (allocated === 0) return 'normal'

  const percentVariance = (variance / allocated) * 100

  if (percentVariance < -10) return 'critical' // Over budget by >10%
  if (percentVariance < 0) return 'warning'    // Over budget
  if (percentVariance > 20) return 'good'      // Under budget by >20%
  return 'normal'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100
}
