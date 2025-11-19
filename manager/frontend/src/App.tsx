import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Auth
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

// Layouts
import { AppShell } from '@/components/layout/AppShell'

// Dashboards (placeholders for now)
import { Dashboard } from '@/features/projects/components/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected routes */}
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* PM Edition routes */}
            <Route path="budgets" element={<div>Budgets - Coming Soon</div>} />
            <Route path="purchase-orders" element={<div>Purchase Orders - Coming Soon</div>} />
            <Route path="vendors" element={<div>Vendors - Coming Soon</div>} />

            {/* Tour Edition routes */}
            <Route path="venues" element={<div>Venues - Coming Soon</div>} />
            <Route path="per-diems" element={<div>Per Diems - Coming Soon</div>} />
            <Route path="settlements" element={<div>Settlements - Coming Soon</div>} />

            {/* Producer Edition routes */}
            <Route path="portfolio" element={<div>Portfolio - Coming Soon</div>} />
            <Route path="inventory" element={<div>Inventory - Coming Soon</div>} />

            {/* Shared routes */}
            <Route path="transactions" element={<div>Transactions - Coming Soon</div>} />
            <Route path="reports" element={<div>Reports - Coming Soon</div>} />
            <Route path="settings" element={<div>Settings - Coming Soon</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
