import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'reset') {
      const success = await resetPassword(email);
      if (success) {
        setResetSent(true);
      }
      return;
    }

    const success =
      mode === 'login' ? await signIn(email, password) : await signUp(email, password);

    if (success) {
      navigate('/modules');
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setResetSent(false);
    clearError();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ShowStack</h1>
          <p className="text-gray-400">Production Management Suite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {resetSent && mode === 'reset' && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            Password reset email sent. Check your inbox.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded text-white font-medium transition"
          >
            {isLoading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign In'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => switchMode('reset')}
              className="text-sm text-blue-500 hover:text-blue-400"
            >
              Forgot password?
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-400">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => switchMode('signup')}
                className="text-blue-500 hover:text-blue-400"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-blue-500 hover:text-blue-400"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
          <button
            onClick={() => navigate('/modules')}
            className="text-sm text-gray-500 hover:text-gray-400"
          >
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
}
