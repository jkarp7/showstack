import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function RegisterForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subscriptionTier: 'pm' as 'pm' | 'tour' | 'producer'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement registration logic
    console.log('Register:', formData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg border border-border">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">ShowStack:Manager</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Edition</label>
            <select
              value={formData.subscriptionTier}
              onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
            >
              <option value="pm">PM Edition - $79/month</option>
              <option value="tour">Tour Edition - $99/month</option>
              <option value="producer">Producer Edition - $199/month</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-primary hover:underline"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
