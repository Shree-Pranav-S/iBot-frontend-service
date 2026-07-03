import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import type { RegisterFormProps } from '../../../types/auth.types';

export const RegisterForm: React.FC<RegisterFormProps> = () => {
  const { register, clearError } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = isMinLength && hasUppercase && hasDigit;
  const strength = [isMinLength, hasUppercase, hasDigit].filter(Boolean).length;
  const strengthLabel = useMemo(
    () => ['Password strength', 'Needs work', 'Good', 'Strong'][strength],
    [strength],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    if (!fullName || !email || !companyName || !password) {
      toastError('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (fullName.trim().length < 2 || companyName.trim().length < 2) {
      toastError('Invalid Input', 'Name and company must be at least 2 characters.');
      return;
    }
    if (!isPasswordValid) {
      toastError('Weak Password', 'Password does not meet requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ full_name: fullName, email, company_name: companyName, password });
    } catch (error: unknown) {
      toastError('Registration Failed', error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10';

  return (
    <div className="animate-scaleIn relative overflow-hidden rounded-[24px] border border-white/90 bg-white/92 px-6 py-5 shadow-[0_30px_80px_-34px_rgba(15,23,42,0.3),0_18px_46px_-30px_rgba(5,150,105,0.3)] backdrop-blur-xl sm:px-8 sm:py-6">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500" />

      <div className="text-center">
        <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full border border-emerald-100 bg-emerald-50/80 shadow-inner">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
            Ai
          </span>
          <Sparkles className="absolute right-0.5 top-0.5 h-3.5 w-3.5 text-emerald-500" />
        </div>
        <h2 className="mt-2 font-display text-xl font-extrabold tracking-[-0.035em] text-slate-950">Create Account</h2>
        <p className="mt-1 text-sm text-slate-500">Get started with AI interviews</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
        <AuthField label="Full Name" icon={User}>
          <input
            id="reg-fullname"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            className={inputClass}
          />
        </AuthField>

        <AuthField label="Company" icon={Building2}>
          <input
            id="reg-company"
            type="text"
            required
            minLength={2}
            autoComplete="organization"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Your company name"
            className={inputClass}
          />
        </AuthField>

        <AuthField label="Email" icon={Mail}>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </AuthField>

        <AuthField label="Password" icon={Lock}>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a password"
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
        </AuthField>

        <div className="-mt-1">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((segment) => (
              <span
                key={segment}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  segment <= strength * 2 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-slate-200'
                }`}
              />
            ))}
            <span className={`ml-2 min-w-[42px] text-right text-[10px] font-bold ${strength === 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {strengthLabel}
            </span>
          </div>
          {password.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-semibold">
              {[
                [isMinLength, '8+ characters'],
                [hasUppercase, 'Uppercase'],
                [hasDigit, 'Number'],
              ].map(([valid, label]) => (
                <span key={String(label)} className={`inline-flex items-center gap-1 ${valid ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <Check className="h-2.5 w-2.5" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-0.5 text-[10px] font-medium text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Your data is encrypted and secure.
        </div>

        <button
          id="btn-register-submit"
          type="submit"
          disabled={isSubmitting}
          className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-sm font-bold text-white shadow-[0_16px_28px_-14px_rgba(13,148,136,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_34px_-14px_rgba(13,148,136,0.72)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="my-3 flex items-center gap-4">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-medium text-slate-400">Already registered?</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        id="btn-goto-login"
        type="button"
        onClick={() => {
          clearError();
          navigate('/login');
        }}
        className="flex h-10 w-full items-center justify-center rounded-xl border border-emerald-400 bg-white text-sm font-bold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md active:translate-y-0"
      >
        Sign In
      </button>
    </div>
  );
};

const AuthField = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-bold text-slate-600">{label}</span>
    <span className="group relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-600 transition-transform group-focus-within:scale-110" />
      {children}
    </span>
  </label>
);
