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
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';

export const RegisterForm: React.FC = () => {
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
    'h-[clamp(2.5rem,6.5vh,2.75rem)] w-full rounded-xl border border-[#E6DED2] bg-[#FCFAF6] pl-11 pr-4 text-sm font-medium text-[#1F1D1A] outline-none transition-all placeholder:font-normal placeholder:text-[#A0978B] hover:border-[#CDBB9F] hover:bg-white focus:border-[#B9833F] focus:bg-white focus:ring-4 focus:ring-[#B9833F]/10';

  return (
    <div className="animate-scaleIn relative overflow-hidden rounded-[24px] border border-[#E6DED2] bg-white px-6 py-[clamp(0.875rem,2.5vh,1.25rem)] shadow-[0_30px_80px_-38px_rgba(36,33,29,0.34)] sm:px-8">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#B9833F]" />

      <div className="text-center">
        <div className="relative mx-auto grid h-[clamp(2.5rem,7vh,3rem)] w-[clamp(2.5rem,7vh,3rem)] place-items-center rounded-full border border-[#D8C9B5] bg-[#F4E8D6] shadow-inner">
          <span className="grid h-[clamp(1.875rem,5vh,2.25rem)] w-[clamp(1.875rem,5vh,2.25rem)] place-items-center rounded-full bg-[#24211D] text-white shadow-[0_10px_22px_-12px_rgba(36,33,29,0.6)]">
            <UserPlus className="h-4 w-4" />
          </span>
          <Sparkles className="absolute right-0.5 top-0.5 h-3.5 w-3.5 text-[#B9833F]" />
        </div>
        <h2 className="mt-[clamp(0.25rem,1vh,0.5rem)] font-display text-xl font-extrabold tracking-[-0.035em] text-[#1F1D1A]">Create Account</h2>
        <p className="mt-0.5 text-sm text-[#706A61]">Get started with AI interviews</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-[clamp(0.5rem,1.5vh,1rem)] flex flex-col gap-[clamp(0.375rem,1vh,0.625rem)]">
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8175] transition-all hover:scale-110 hover:text-[#1F1D1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F]"
          >
            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </AuthField>

        <div className="-mt-1">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((segment) => (
              <span
                key={segment}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  segment <= strength * 2
                    ? strength === 3
                      ? 'bg-emerald-500'
                      : 'bg-[#B9833F]'
                    : 'bg-[#E6DED2]'
                }`}
              />
            ))}
            <span className={`ml-2 min-w-[42px] text-right text-[10px] font-bold ${
              strength === 3 ? 'text-emerald-600' : strength > 0 ? 'text-[#9A6A30]' : 'text-[#8A8175]'
            }`}>
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
                <span key={String(label)} className={`inline-flex items-center gap-1 ${valid ? 'text-emerald-600' : 'text-[#8A8175]'}`}>
                  <Check className="h-2.5 w-2.5" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-0.5 text-[10px] font-medium text-[#706A61]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Your data is encrypted and secure.
        </div>

        <button
          id="btn-register-submit"
          type="submit"
          disabled={isSubmitting}
          className="group relative flex h-[clamp(2.5rem,6.5vh,2.75rem)] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#B9833F] text-sm font-bold text-white shadow-[0_16px_28px_-14px_rgba(154,106,48,0.62)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#9A6A30] hover:shadow-[0_20px_34px_-14px_rgba(154,106,48,0.76)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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

      <div className="my-[clamp(0.375rem,1vh,0.75rem)] flex items-center gap-4">
        <span className="h-px flex-1 bg-[#E6DED2]" />
        <span className="text-[10px] font-medium text-[#8A8175]">Already registered?</span>
        <span className="h-px flex-1 bg-[#E6DED2]" />
      </div>

      <button
        id="btn-goto-login"
        type="button"
        onClick={() => {
          clearError();
          navigate('/login');
        }}
        className="flex h-9 w-full items-center justify-center rounded-xl border border-[#CDBB9F] bg-white text-sm font-bold text-[#1F1D1A] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9833F] hover:bg-[#F4E8D6] hover:text-[#9A6A30] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] active:translate-y-0"
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
    <span className="mb-1 block text-[10px] font-bold text-[#706A61]">{label}</span>
    <span className="group relative block">
      <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#B9833F] transition-transform group-focus-within:scale-110" />
      {children}
    </span>
  </label>
);
