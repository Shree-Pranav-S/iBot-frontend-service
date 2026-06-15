import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { User, Mail, Lock, Building, Eye, EyeOff, Loader2, Check, X, ArrowRight, Sparkles } from 'lucide-react';
import type { RegisterFormProps } from '../../../types/auth.types';

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleView }) => {
  const { register, clearError } = useAuth();
  const { error: toastError } = useToast();
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
      toastError('Missing Fields', 'Please fill in all fields to continue.');
      return;
    }

    if (fullName.trim().length < 2 || companyName.trim().length < 2) {
      toastError('Invalid Input', 'Full name and company name must be at least 2 characters.');
      return;
    }

    if (!isPasswordValid) {
      toastError('Weak Password', 'Password does not meet the complexity requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ full_name: fullName, email, company_name: companyName, password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toastError('Registration Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `w-full rounded-xl border border-white/15 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30`;
  const inputStyle = { background: 'rgba(255,255,255,0.06)' };

  return (
    <div
      className="w-full rounded-2xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="mb-7 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 mb-4">
          <Sparkles className="h-3 w-3" />
          Free Recruiter Account
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h2>
        <p className="mt-1.5 text-sm text-slate-400">Start evaluating candidates with AI today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row: Full Name + Company */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="reg-fullname"
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sarah Connor"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Company</label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="reg-company"
                type="text"
                required
                minLength={2}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-11`}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password rules */}
          {password.length > 0 && (
            <div className="mt-2.5 flex gap-3 text-[11px] rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              {[
                { ok: isMinLength, label: '8+ chars' },
                { ok: hasUppercase, label: 'Uppercase' },
                { ok: hasDigit, label: 'Digit' },
              ].map(({ ok, label }) => (
                <div key={label} className="flex items-center gap-1">
                  {ok
                    ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                    : <X className="h-3.5 w-3.5 text-slate-500" />}
                  <span className={ok ? 'text-emerald-300' : 'text-slate-500'}>{label}</span>
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
          className="group relative mt-1 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <span className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: 'linear-gradient(135deg, #fff, transparent)' }} />
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-slate-500 font-medium">Already registered?</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <button
        id="btn-goto-login"
        onClick={() => { clearError(); onToggleView(); }}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all duration-200"
      >
        Sign In Instead
      </button>
    </div>
  );
};
