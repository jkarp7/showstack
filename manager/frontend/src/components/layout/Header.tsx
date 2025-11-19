import { Bell, ChevronDown } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Project switcher will go here */}
        <div className="text-sm text-muted-foreground">
          Select a project to get started
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 rounded-md hover:bg-accent relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{user?.name || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {user?.subscriptionTier || 'Free'} Edition
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
