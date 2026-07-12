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
    'h-11 w-full rounded-xl border border-[#E6DED2] bg-[#FCFAF6] pl-11 pr-4 text-sm font-medium text-[#1F1D1A] outline-none transition-all placeholder:font-normal placeholder:text-[#A0978B] hover:border-[#CDBB9F] hover:bg-white focus:border-[#B9833F] focus:bg-white focus:ring-4 focus:ring-[#B9833F]/10';

  const cardClass =
    'animate-scaleIn relative w-full overflow-hidden rounded-[24px] border border-[#E6DED2] bg-white px-6 py-6 shadow-[0_30px_80px_-38px_rgba(36,33,29,0.34)] sm:px-8 sm:py-7';

  const primaryButtonClass =
    'group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B9833F] text-sm font-bold text-white shadow-[0_16px_28px_-14px_rgba(154,106,48,0.62)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#9A6A30] hover:shadow-[0_20px_34px_-14px_rgba(154,106,48,0.76)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F] focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50';

  const secondaryButtonClass =
    'flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#CDBB9F] bg-white text-sm font-bold text-[#1F1D1A] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B9833F] hover:bg-[#F4E8D6] hover:text-[#9A6A30] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9833F]';

  const iconBadge = (
    <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#D8C9B5] bg-[#F4E8D6] shadow-inner">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#24211D] text-white shadow-[0_10px_22px_-12px_rgba(36,33,29,0.6)]">
        <KeyRound className="h-4 w-4" />
      </span>
    </div>
  );

  // ── Success step ────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[#B9833F]" />
        <div className="flex flex-col items-center justify-center py-8 animate-slideUp">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#D8C9B5] bg-[#F4E8D6] shadow-inner">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#24211D] text-white">
              <ShieldCheck className="h-7 w-7 text-[#B9833F]" />
            </span>
          </div>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.035em] text-[#1F1D1A] mb-2">Password Updated!</h2>
          <p className="text-sm text-[#706A61] text-center mb-4">
            Your password has been reset successfully.
          </p>
          <p className="text-xs text-[#8A8175] animate-pulse">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // ── OTP verification step ───────────────────────────────────────────────────
  if (step === 'otp') {
    const isOtpComplete = otpDigits.every((d) => d !== '');
    const timerExpired = countdown === 0;

    return (
      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[#B9833F]" />

        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center">{iconBadge}</div>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.035em] text-[#1F1D1A]">
            Verify OTP
          </h2>
          <p className="mt-1 text-sm text-[#706A61]">
            Enter the 4-digit code sent to your email
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="mb-6 flex justify-center gap-3" onPaste={handleOtpPaste}>
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
              className="h-14 w-14 rounded-xl border-2 border-[#E6DED2] bg-[#FCFAF6] text-center text-2xl font-bold text-[#1F1D1A] outline-none transition-all focus:border-[#B9833F] focus:bg-white focus:ring-4 focus:ring-[#B9833F]/10"
            />
          ))}
        </div>

        {/* Countdown Timer */}
        <div className="mb-6 flex justify-center">
          {!timerExpired ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#E6DED2] bg-[#FCFAF6] px-4 py-2">
              <div className="relative h-5 w-5">
                <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#E6DED2]"
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
                    className="text-[#B9833F] transition-all duration-1000"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#706A61] tabular-nums">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <button
              id="btn-resend-otp"
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center gap-2 rounded-lg border border-[#CDBB9F] bg-white px-4 py-2 text-xs font-semibold text-[#9A6A30] transition-all hover:border-[#B9833F] hover:bg-[#F4E8D6] disabled:opacity-50"
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
          className={primaryButtonClass}
        >
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
            className="flex items-center gap-1.5 text-xs font-medium text-[#8A8175] transition-colors hover:text-[#9A6A30]"
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
      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[#B9833F]" />

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">{iconBadge}</div>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.035em] text-[#1F1D1A]">
            Reset Password
          </h2>
          <p className="mt-1 text-sm text-[#706A61]">
            Set a new password for your account
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#706A61]">
              New Password
            </label>
            <div className="group relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#B9833F] transition-transform group-focus-within:scale-110" />
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8175] transition-colors hover:text-[#1F1D1A]"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Password rules */}
            {newPassword.length > 0 && (
              <div className="mt-2 flex animate-slideDown gap-2 rounded-lg border border-[#E6DED2] bg-[#FCFAF6] px-3 py-2 text-[10px]">
                {[
                  { ok: isMinLength, label: '8+ chars' },
                  { ok: hasUppercase, label: 'Uppercase' },
                  { ok: hasDigit, label: 'Digit' },
                ].map(({ ok, label }) => (
                  <div key={label} className="flex items-center gap-1 font-medium">
                    {ok ? (
                      <Check className="h-3 w-3 text-[#9A6A30]" />
                    ) : (
                      <X className="h-3 w-3 text-[#8A8175]" />
                    )}
                    <span className={ok ? 'text-[#9A6A30]' : 'text-[#8A8175]'}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#706A61]">
              Confirm Password
            </label>
            <div className="group relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#B9833F] transition-transform group-focus-within:scale-110" />
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8175] transition-colors hover:text-[#1F1D1A]"
              >
                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-[10px] font-medium">
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3 text-[#9A6A30]" />
                    <span className="text-[#9A6A30]">Passwords match</span>
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
            className={`${primaryButtonClass} mt-1`}
          >
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
            className="flex items-center gap-1.5 text-xs font-medium text-[#8A8175] transition-colors hover:text-[#9A6A30]"
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
    <div className={cardClass}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#B9833F]" />

      {/* Header */}
      <div className="mb-7 text-center">
        <div className="mb-4 flex justify-center">{iconBadge}</div>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.035em] text-[#1F1D1A]">
          Forgot Password?
        </h2>
        <p className="mt-1 text-sm text-[#706A61]">
          Enter your email to get started
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#706A61]">
            Email
          </label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#B9833F] transition-transform group-focus-within:scale-110" />
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </div>
        </div>

        {/* Continue */}
        <button
          id="btn-reset-continue"
          type="submit"
          className={primaryButtonClass}
        >
          Continue
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#E6DED2]" />
        <span className="text-[10px] font-medium text-[#8A8175]">Remember your password?</span>
        <span className="h-px flex-1 bg-[#E6DED2]" />
      </div>

      <button
        id="btn-back-to-login"
        onClick={() => navigate('/login')}
        className={secondaryButtonClass}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </button>
    </div>
  );
};
