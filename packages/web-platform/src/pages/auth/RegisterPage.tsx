import { useState } from 'react';
import { supabase, createApiClient } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const apiClient = createApiClient();

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Step 1: Create the user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!signUpData.user) {
      setError('Registration failed, please try again.');
      setLoading(false);
      return;
    }

    // After sign up, the user is technically "logged in" on the client
    // So we can now make an authenticated request to create their profile.
    
    // Step 2: Create the profile in our public.profiles table via our backend
    try {
        const profileData = {
            username,
            displayName: username
        };
        const profileResponse = await apiClient.post('/api/auth/profile', profileData);

        if (profileResponse.error) {
            setError(profileResponse.error);
        } else {
            alert('Registration successful! Please check your email to verify your account.');
            navigate('/login');
        }
    } catch (profileError: any) {
        setError(profileError.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dev-primary-bg">
      <div className="glass p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-dev-text-primary mb-6 text-center">
          Create Account
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-dev-text-secondary mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="w-full p-2 rounded bg-dev-secondary-bg text-dev-text-primary border border-dev-tertiary-bg"
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
} 