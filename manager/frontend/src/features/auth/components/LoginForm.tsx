import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement login logic
    console.log('Login:', { email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg border border-border">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">ShowStack:Manager</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/register')}
            className="text-sm text-primary hover:underline"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  )
}
