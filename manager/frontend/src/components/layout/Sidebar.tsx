import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  MapPin,
  DollarSign,
  Briefcase,
  Package,
  CreditCard,
  FileText,
  Settings
} from 'lucide-react'
import { useEdition } from '@/hooks/useEdition'

export function Sidebar() {
  const { hasPM, hasTour, hasProducer } = useEdition()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">ShowStack</h1>
        <p className="text-sm text-muted-foreground">Manager</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <NavItem to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>
          Dashboard
        </NavItem>

        {hasPM && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
              PM Edition
            </div>
            <NavItem to="/budgets" icon={<Receipt className="w-5 h-5" />}>
              Budgets
            </NavItem>
            <NavItem to="/purchase-orders" icon={<ShoppingCart className="w-5 h-5" />}>
              Purchase Orders
            </NavItem>
            <NavItem to="/vendors" icon={<Users className="w-5 h-5" />}>
              Vendors
            </NavItem>
          </>
        )}

        {hasTour && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
              Tour Edition
            </div>
            <NavItem to="/venues" icon={<MapPin className="w-5 h-5" />}>
              Venues
            </NavItem>
            <NavItem to="/per-diems" icon={<DollarSign className="w-5 h-5" />}>
              Per Diems
            </NavItem>
            <NavItem to="/settlements" icon={<FileText className="w-5 h-5" />}>
              Settlements
            </NavItem>
          </>
        )}

        {hasProducer && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
              Producer Edition
            </div>
            <NavItem to="/portfolio" icon={<Briefcase className="w-5 h-5" />}>
              Portfolio
            </NavItem>
            <NavItem to="/inventory" icon={<Package className="w-5 h-5" />}>
              Inventory
            </NavItem>
          </>
        )}

        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
          Shared
        </div>
        <NavItem to="/transactions" icon={<CreditCard className="w-5 h-5" />}>
          Transactions
        </NavItem>
        <NavItem to="/reports" icon={<FileText className="w-5 h-5" />}>
          Reports
        </NavItem>
      </nav>

      <div className="p-4 border-t border-border">
        <NavItem to="/settings" icon={<Settings className="w-5 h-5" />}>
          Settings
        </NavItem>
      </div>
    </aside>
  )
}

interface NavItemProps {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
}

function NavItem({ to, icon, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  )
}
