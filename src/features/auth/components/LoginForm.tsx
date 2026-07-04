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

export const LoginForm: React.FC = () => {
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
    'h-11 w-full rounded-xl border border-[#E6DED2] bg-[#FCFAF6] pl-11 pr-4 text-sm font-medium text-[#1F1D1A] outline-none transition-all placeholder:font-normal placeholder:text-[#A0978B] hover:border-[#CDBB9F] hover:bg-white focus:border-[#B9833F] focus:bg-white focus:ring-4 focus:ring-[#B9833F]/10';

  return (
    <div className="animate-scaleIn relative overflow-hidden rounded-[24px] border border-[#E6DED2] bg-white px-6 py-6 shadow-[0_30px_80px_-38px_rgba(36,33,29,0.34)] sm:px-8 sm:py-7">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#B9833F]" />

      <div className="text-center">
        <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#D8C9B5] bg-[#F4E8D6] shadow-inner">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#24211D] text-white shadow-[0_10px_22px_-12px_rgba(36,33,29,0.6)]">
            <Lock className="h-4 w-4" />
          </span>
          <Sparkles className="absolute right-0.5 top-0.5 h-3.5 w-3.5 text-[#B9833F]" />
        </div>
        <h2 className="mt-2 font-display text-xl font-extrabold tracking-[-0.035em] text-[#1F1D1A]">Welcome Back</h2>
        <p className="mt-1 text-sm text-[#706A61]">Sign in to continue to your hiring workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold text-[#706A61]">Email</span>
          <span className="group relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#B9833F] transition-transform group-focus-within:scale-110" />
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
          <span className="mb-1 block text-[10px] font-bold text-[#706A61]">Password</span>
          <span className="group relative block">
            <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#B9833F] transition-transform group-focus-within:scale-110" />
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8175] transition-all hover:scale-110 hover:text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F]"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </span>
        </label>

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#706A61]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Secure sign in
          </span>
          <button
            type="button"
            id="btn-forgot-password"
            onClick={() => navigate('/reset-password')}
            className="text-[11px] font-semibold text-[#9A6A30] transition-colors hover:text-[#6F4A20] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F]"
          >
            Forgot password?
          </button>
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          disabled={isSubmitting}
          className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B9833F] text-sm font-bold text-white shadow-[0_16px_28px_-14px_rgba(154,106,48,0.62)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#9A6A30] hover:shadow-[0_20px_34px_-14px_rgba(154,106,48,0.76)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
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
        <span className="h-px flex-1 bg-[#E6DED2]" />
        <span className="text-[10px] font-medium text-[#8A8175]">New to iBot?</span>
        <span className="h-px flex-1 bg-[#E6DED2]" />
      </div>

      <button
        id="btn-goto-register"
        type="button"
        onClick={() => {
          clearError();
          navigate('/register');
        }}
        className="flex h-10 w-full items-center justify-center rounded-xl border border-[#CDBB9F] bg-white text-sm font-bold text-[#1F1D1A] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9833F] hover:bg-[#F4E8D6] hover:text-[#9A6A30] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] active:translate-y-0"
      >
        Create Account
      </button>
    </div>
  );
};
