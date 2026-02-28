import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useP2PSettings } from '../context/P2PContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useP2PSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-poppins font-extrabold text-brand mb-2">Welcome Back</h1>
            <p className="text-neutral-400">Sign in to continue your broadcast</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:border-beacon-500 outline-none transition-colors shadow-inner"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-beacon-600 hover:bg-beacon-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-beacon-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-neutral-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-beacon-400 hover:text-beacon-300 font-semibold transition-colors">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
