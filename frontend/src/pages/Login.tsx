import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 selection:bg-enterprise-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-enterprise-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-enterprise-500/20 mb-3">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to Enterprise Agent</h2>
          <p className="text-sm text-slate-400 mt-1">Multi-tenant document intelligence workspace</p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@enterprise.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-enterprise-600 hover:bg-enterprise-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition shadow-md shadow-enterprise-600/20 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2.5 text-center uppercase tracking-wider">
              Instant Demo Access (Seeded)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@enterprise.ai', 'AdminPass123!')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-enterprise-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin User</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">admin@enterprise.ai</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('analyst@enterprise.ai', 'AnalystPass123!')}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Analyst User</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">analyst@enterprise.ai</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-enterprise-400 hover:text-enterprise-300 font-medium">
            Register new tenant
          </Link>
        </p>
      </div>
    </div>
  );
};
