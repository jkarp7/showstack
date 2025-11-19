export interface Project {
  id: string
  userId: string
  name: string
  type: 'venue' | 'tour' | 'festival' | 'corporate' | 'other'
  status: 'bidding' | 'prep' | 'in_production' | 'on_road' | 'closed'
  startDate?: string
  endDate?: string
  totalBudget: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectData {
  name: string
  type: Project['type']
  startDate?: string
  endDate?: string
  totalBudget: number
}
