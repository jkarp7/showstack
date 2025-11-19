export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to ShowStack:Manager
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Budget"
          value="$0.00"
          description="Across all projects"
        />
        <MetricCard
          title="Total Spent"
          value="$0.00"
          description="This month"
        />
        <MetricCard
          title="Active Projects"
          value="0"
          description="In production"
        />
        <MetricCard
          title="Pending POs"
          value="0"
          description="Awaiting approval"
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>1. Connect your bank account via Plaid</p>
          <p>2. Create your first project</p>
          <p>3. Set up your budget departments</p>
          <p>4. Add vendors and create purchase orders</p>
          <p>5. Watch transactions automatically match!</p>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  description: string
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
