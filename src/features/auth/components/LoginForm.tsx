import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import type { LoginFormProps } from '../../../types/auth.types';

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleView }) => {
  const { login, clearError } = useAuth();
  const { error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      toastError('Missing Fields', 'Please fill in your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      toastError('Authentication Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full rounded-2xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 mb-4">
          <Sparkles className="h-3 w-3" />
          Recruiter Portal
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome back</h2>
        <p className="mt-1.5 text-sm text-slate-400">Sign in to your recruiter account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-white/15 bg-white/8 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/15 bg-white/8 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="btn-login-submit"
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <span className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: 'linear-gradient(135deg, #fff, transparent)' }} />
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-slate-500 font-medium">New to iBot?</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <button
        id="btn-goto-register"
        onClick={() => { clearError(); onToggleView(); }}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all duration-200"
      >
        Create Recruiter Account
      </button>
    </div>
  );
};
