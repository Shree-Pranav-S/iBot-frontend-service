import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../hooks/useToast';
import { authService } from '../services/auth';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

type Step = 'email' | 'form' | 'otp' | 'success';

export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── OTP state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('email');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Password validation ─────────────────────────────────────────────────────
  const isMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const isPasswordValid = isMinLength && hasUppercase && hasDigit;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // ── Timer logic ─────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Step 1: Submit email ────────────────────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toastError('Missing Email', 'Please enter your email address.');
      return;
    }
    setStep('form');
  };

  // ── Step 2: Submit password reset form ──────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toastError('Weak Password', 'Password does not meet the requirements.');
      return;
    }
    if (!passwordsMatch) {
      toastError('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email, new_password: newPassword });
      toastSuccess('OTP Sent', 'Check your email for the verification code.');
      setStep('otp');
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP.';
      toastError('Reset Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP digit handling ──────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setOtpDigits(pasted.split(''));
      inputRefs.current[3]?.focus();
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 4) {
      toastError('Incomplete OTP', 'Please enter all 4 digits.');
      return;
    }

    setIsVerifying(true);
    try {
      await authService.verifyOTP({ email, otp });
      if (timerRef.current) clearInterval(timerRef.current);
      setStep('success');
      toastSuccess('Password Updated', 'Your password has been reset successfully.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed.';
      toastError('Verification Failed', message);
      setOtpDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendOTP({ email, new_password: newPassword });
      toastSuccess('OTP Resent', 'A new verification code has been sent.');
      setOtpDigits(['', '', '', '']);
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP.';
      toastError('Resend Failed', message);
    } finally {
      setIsResending(false);
    }
  };

  const inputClass =
    'w-full rounded-input-btn border border-subtle bg-white py-2.5 pl-11 pr-4 text-sm text-black placeholder-muted outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:bg-elevated-2 focus:text-white';

  // ── Success step ────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="w-full rounded-card border-t border-emerald-500/30 border-x border-b border-subtle bg-elevated/80 p-6 shadow-glow-emerald backdrop-blur-sm sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="flex flex-col items-center justify-center py-8 animate-slideUp">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-5">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white font-display mb-2">Password Updated!</h2>
          <p className="text-sm text-secondary text-center mb-4">
            Your password has been reset successfully.
          </p>
          <p className="text-xs text-muted animate-pulse">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // ── OTP verification step ───────────────────────────────────────────────────
  if (step === 'otp') {
    const isOtpComplete = otpDigits.every((d) => d !== '');
    const timerExpired = countdown === 0;

    return (
      <div className="w-full rounded-card border-t border-emerald-500/30 border-x border-b border-subtle bg-elevated/80 p-6 shadow-glow-emerald backdrop-blur-sm sm:p-7 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        {/* Header */}
        <div className="mb-7 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
              <KeyRound className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Verify OTP
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Enter the 4-digit code sent to your email
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
          {otpDigits.map((digit, i) => (
            <input
              key={i}
              id={`otp-digit-${i}`}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className="h-14 w-14 rounded-xl border-2 border-subtle bg-white text-center text-2xl font-bold text-black outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-elevated-2 focus:text-white"
            />
          ))}
        </div>

        {/* Countdown Timer */}
        <div className="flex justify-center mb-6">
          {!timerExpired ? (
            <div className="flex items-center gap-2 rounded-lg border border-subtle bg-elevated-2/40 px-4 py-2">
              <div className="relative h-5 w-5">
                <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-subtle"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={50.27}
                    strokeDashoffset={50.27 * (1 - countdown / 60)}
                    strokeLinecap="round"
                    className="text-emerald-400 transition-all duration-1000"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-secondary tabular-nums">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <button
              id="btn-resend-otp"
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-transparent px-4 py-2 text-xs font-semibold text-emerald-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Resend OTP
            </button>
          )}
        </div>

        {/* Verify Button */}
        <button
          id="btn-verify-otp"
          onClick={handleVerify}
          disabled={!isOtpComplete || isVerifying}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-input-btn py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-emerald active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #fff, transparent)' }}
          />
          {isVerifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Verify & Reset Password
              <ShieldCheck className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            </>
          )}
        </button>

        {/* Back link */}
        <div className="mt-5 flex items-center justify-center">
          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to reset form
          </button>
        </div>
      </div>
    );
  }

  // ── Password reset form (Step 2 — only password fields, no email) ───────────
  if (step === 'form') {
    return (
      <div className="w-full rounded-card border-t border-emerald-500/30 border-x border-b border-subtle bg-elevated/80 p-6 shadow-glow-emerald backdrop-blur-sm sm:p-7 relative overflow-hidden group">
        {/* Subtle top edge glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
              <KeyRound className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display">
            Reset Password
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Set a new password for your account
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-[10px] font-semibold text-secondary mb-1.5 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" />
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            {newPassword.length > 0 && (
              <div className="mt-2 flex gap-2 text-[10px] rounded-lg border border-subtle bg-elevated-2/40 px-3 py-2 animate-slideDown">
                {[
                  { ok: isMinLength, label: '8+ chars' },
                  { ok: hasUppercase, label: 'Uppercase' },
                  { ok: hasDigit, label: 'Digit' },
                ].map(({ ok, label }) => (
                  <div key={label} className="flex items-center gap-1 font-medium">
                    {ok ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <X className="h-3 w-3 text-muted" />
                    )}
                    <span className={ok ? 'text-emerald-400' : 'text-muted'}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[10px] font-semibold text-secondary mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" />
              <input
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pl-11 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-medium">
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 text-red-400" />
                    <span className="text-red-400">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            id="btn-reset-submit"
            type="submit"
            disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
            className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-input-btn py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-emerald active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, #fff, transparent)' }}
            />
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send Verification Code
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Back link */}
        <div className="mt-5 flex items-center justify-center">
          <button
            onClick={() => { setStep('email'); setNewPassword(''); setConfirmPassword(''); }}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Change email
          </button>
        </div>
      </div>
    );
  }

  // ── Email identification step (Step 1) ──────────────────────────────────────
  return (
    <div className="w-full rounded-card border-t border-emerald-500/30 border-x border-b border-subtle bg-elevated/80 p-6 shadow-glow-emerald backdrop-blur-sm sm:p-7 relative overflow-hidden group">
      {/* Subtle top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      {/* Header */}
      <div className="mb-7 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
            <KeyRound className="h-6 w-6 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white font-display">
          Forgot Password?
        </h2>
        <p className="mt-1 text-sm text-secondary">
          Enter your email to get started
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-[11px] font-semibold text-secondary mb-1.5 uppercase tracking-wider">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors" />
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-input-btn border border-subtle bg-white py-3 pl-11 pr-4 text-sm text-black placeholder-muted outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:bg-elevated-2 focus:text-white"
            />
          </div>
        </div>

        {/* Continue */}
        <button
          id="btn-reset-continue"
          type="submit"
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-input-btn py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-emerald active:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #fff, transparent)' }}
          />
          Continue
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-1 h-px bg-subtle" />
        <span className="px-3 text-[10px] font-medium text-muted">Remember your password?</span>
        <div className="flex-1 h-px bg-subtle" />
      </div>

      <button
        id="btn-back-to-login"
        onClick={() => navigate('/login')}
        className="flex w-full items-center justify-center gap-2 rounded-input-btn border border-emerald-500/20 bg-transparent py-2.5 text-sm font-semibold text-secondary transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </button>
    </div>
  );
};
