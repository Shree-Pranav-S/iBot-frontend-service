import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import type { LoginFormProps } from '../../../types/auth.types';

export const LoginForm: React.FC<LoginFormProps> = () => {
  const { login, clearError } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      toastError('Missing Fields', 'Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.';
      toastError('Login Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-card border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-7">
      {/* Subtle top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      
      {/* Header */}
      <div className="mb-7 text-center">
        <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-input-btn border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-input-btn border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end -mt-1">
          <button
            type="button"
            id="btn-forgot-password"
            onClick={() => navigate('/reset-password')}
            className="text-[11px] font-medium text-slate-500 transition-colors hover:text-emerald-700"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          id="btn-login-submit"
          type="submit"
          disabled={isSubmitting}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-input-btn py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-emerald active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <span className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #fff, transparent)' }} />
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="px-3 text-[10px] font-medium text-slate-400">New here?</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        id="btn-goto-register"
        onClick={() => { clearError(); navigate('/register'); }}
        className="flex w-full items-center justify-center gap-2 rounded-input-btn border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      >
        Create Account
      </button>
    </div>
  );
};
