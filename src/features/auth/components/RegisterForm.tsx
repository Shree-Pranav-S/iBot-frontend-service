import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { User, Mail, Lock, Building, Eye, EyeOff, Loader2, Check, X, ArrowRight } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      toastError('Registration Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-input-btn border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="group relative w-full overflow-hidden rounded-card border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-7">
      {/* Subtle top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">Create Account</h2>
        <p className="mt-1 text-sm text-slate-500">Get started with AI interviews</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: Full Name + Company */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                id="reg-fullname"
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sarah Connor"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">Company</label>
            <div className="relative group">
              <Building className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
              <input
                id="reg-company"
                type="text"
                required
                minLength={2}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={`${inputClass} pl-11`}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-600">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pl-11 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Password rules */}
          {password.length > 0 && (
            <div className="animate-slideDown mt-2 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px]">
              {[
                { ok: isMinLength, label: '8+ chars' },
                { ok: hasUppercase, label: 'Uppercase' },
                { ok: hasDigit, label: 'Digit' },
              ].map(({ ok, label }) => (
                <div key={label} className="flex items-center gap-1 font-medium">
                  {ok
                    ? <Check className="h-3 w-3 text-emerald-400" />
                    : <X className="h-3 w-3 text-slate-400" />}
                  <span className={ok ? 'text-emerald-600' : 'text-slate-400'}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          id="btn-register-submit"
          type="submit"
          disabled={isSubmitting || !isPasswordValid}
          className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-input-btn py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-emerald active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <span className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #fff, transparent)' }} />
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="px-3 text-[10px] font-medium text-slate-400">Already registered?</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        id="btn-goto-login"
        onClick={() => { clearError(); navigate('/login'); }}
        className="flex w-full items-center justify-center gap-2 rounded-input-btn border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      >
        Sign In
      </button>
    </div>
  );
};
