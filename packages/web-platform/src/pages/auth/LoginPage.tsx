import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dev-primary-bg">
      <div className="glass p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-dev-text-primary mb-6 text-center">
          Sign In
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-dev-text-secondary mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="w-full p-2 rounded bg-dev-secondary-bg text-dev-text-primary border border-dev-tertiary-bg"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-dev-text-secondary mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="w-full p-2 rounded bg-dev-secondary-bg text-dev-text-primary border border-dev-tertiary-bg"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="w-full bg-dev-accent-primary text-white p-2 rounded hover:bg-dev-accent-primary-dark disabled:bg-gray-500"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
} 