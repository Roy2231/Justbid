import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      localStorage.setItem('justbid_user_email', email);
      if (name) {
        localStorage.setItem('justbid_user_name', name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-zinc-200">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="mb-5">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-800 text-[11px] font-semibold mb-1">
            {isLogin ? 'Member Sign In' : 'New Account'}
          </div>
          <h2 className="text-xl font-bold text-zinc-900">
            {isLogin ? 'Welcome Back to JustBid' : 'Create an Account'}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isLogin ? 'Sign in to manage your auctions, bids, and vouchers.' : 'Create an account to track your startup offers and bids.'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs mb-4 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          {!isLogin && (
            <div>
              <label className="block font-medium text-zinc-700 mb-1">Your Full Name / Handle</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-zinc-400" size={15} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900 bg-white"
                  placeholder="e.g. Alex Morgan"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-zinc-400" size={15} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900 bg-white"
                placeholder="you@acme.com"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-zinc-400" size={15} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-zinc-900 bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            disabled={loading}
            type="submit"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(234,88,12,0.3)] disabled:opacity-50 text-xs sm:text-sm mt-2"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          {isLogin ? "Don't have an account yet? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
