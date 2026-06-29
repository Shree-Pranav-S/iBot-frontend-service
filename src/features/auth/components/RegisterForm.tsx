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

  const inputClass = "w-full rounded-input-btn border border-subtle bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder-muted outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:bg-elevated-2 focus:text-white";

  return (
    <div className="w-full rounded-card border-t border-emerald-500/30 border-x border-b border-subtle bg-elevated/80 p-6 shadow-glow-emerald backdrop-blur-sm sm:p-7 relative overflow-hidden group">
      {/* Subtle top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-white font-display">Create Account</h2>
        <p className="mt-1 text-sm text-secondary">Get started with AI interviews</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: Full Name + Company */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-secondary mb-1.5 uppercase tracking-wider">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" />
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
            <label className="block text-[10px] font-semibold text-secondary mb-1.5 uppercase tracking-wider">Company</label>
            <div className="relative group">
              <Building className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" />
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
          <label className="block text-[10px] font-semibold text-secondary mb-1.5 uppercase tracking-wider">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" />
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
          <label className="block text-[10px] font-semibold text-secondary mb-1.5 uppercase tracking-wider">Password</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" />
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Password rules */}
          {password.length > 0 && (
            <div className="mt-2 flex gap-2 text-[10px] rounded-lg border border-subtle bg-elevated-2/40 px-3 py-2 animate-slideDown">
              {[
                { ok: isMinLength, label: '8+ chars' },
                { ok: hasUppercase, label: 'Uppercase' },
                { ok: hasDigit, label: 'Digit' },
              ].map(({ ok, label }) => (
                <div key={label} className="flex items-center gap-1 font-medium">
                  {ok
                    ? <Check className="h-3 w-3 text-emerald-400" />
                    : <X className="h-3 w-3 text-muted" />}
                  <span className={ok ? 'text-emerald-400' : 'text-muted'}>{label}</span>
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
        <div className="flex-1 h-px bg-subtle" />
        <span className="px-3 text-[10px] font-medium text-muted">Already registered?</span>
        <div className="flex-1 h-px bg-subtle" />
      </div>

      <button
        id="btn-goto-login"
        onClick={() => { clearError(); navigate('/login'); }}
        className="flex w-full items-center justify-center gap-2 rounded-input-btn border border-emerald-500/20 bg-transparent py-2.5 text-sm font-semibold text-secondary transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
      >
        Sign In
      </button>
    </div>
  );
};
