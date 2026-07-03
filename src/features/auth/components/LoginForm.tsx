import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import type { LoginFormProps } from '../../../types/auth.types';

export const LoginForm: React.FC<LoginFormProps> = () => {
  const { login, clearError } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    if (!email || !password) {
      toastError('Missing Fields', 'Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (error: unknown) {
      toastError('Login Failed', error instanceof Error ? error.message : 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10';

  return (
    <div className="animate-scaleIn relative overflow-hidden rounded-[24px] border border-white/90 bg-white/92 px-6 py-6 shadow-[0_30px_80px_-34px_rgba(15,23,42,0.3),0_18px_46px_-30px_rgba(5,150,105,0.3)] backdrop-blur-xl sm:px-8 sm:py-7">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500" />

      <div className="text-center">
        <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full border border-emerald-100 bg-emerald-50/80 shadow-inner">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Lock className="h-4 w-4" />
          </span>
          <Sparkles className="absolute right-0.5 top-0.5 h-3.5 w-3.5 text-emerald-500" />
        </div>
        <h2 className="mt-2 font-display text-xl font-extrabold tracking-[-0.035em] text-slate-950">Welcome Back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue to your hiring workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold text-slate-600">Email</span>
          <span className="group relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-600 transition-transform group-focus-within:scale-110" />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold text-slate-600">Password</span>
          <span className="group relative block">
            <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-600 transition-transform group-focus-within:scale-110" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-all hover:scale-110 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </span>
        </label>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Secure sign in
          </span>
          <button
            type="button"
            id="btn-forgot-password"
            onClick={() => navigate('/reset-password')}
            className="text-[11px] font-semibold text-emerald-700 transition-colors hover:text-emerald-900 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          disabled={isSubmitting}
          className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-sm font-bold text-white shadow-[0_16px_28px_-14px_rgba(13,148,136,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_34px_-14px_rgba(13,148,136,0.72)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="my-4 flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-medium text-slate-400">New to iBot?</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        id="btn-goto-register"
        type="button"
        onClick={() => {
          clearError();
          navigate('/register');
        }}
        className="flex h-10 w-full items-center justify-center rounded-xl border border-emerald-400 bg-white text-sm font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md active:translate-y-0"
      >
        Create Account
      </button>
    </div>
  );
};
