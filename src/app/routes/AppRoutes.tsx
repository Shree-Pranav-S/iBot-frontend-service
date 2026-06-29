import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { RegisterForm } from "../../features/auth/components/RegisterForm";
import { ResetPasswordForm } from "../../features/auth/components/ResetPasswordForm";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { MainLayout } from "../../components/layout/MainLayout";
import { LandingPage } from "../../components/layout/LandingPage";
import { DashboardPage } from "../../features/dashboard/components/DashboardPage";
import { AssessmentsPage } from "../../features/dashboard/components/AssessmentsPage";
import { CandidatesPage } from "../../features/dashboard/components/CandidatesPage";
import { EvaluationsPage } from "../../features/dashboard/components/EvaluationsPage";
import { InterviewPage } from "../../features/dashboard/components/InterviewPage";
import { EvaluationReportPage } from "../../features/dashboard/components/EvaluationReportPage";
import { Loader2 } from "lucide-react";

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { warning } = useToast();

  // Show a toast whenever the gateway signals that the session has expired.
  useEffect(() => {
    const onExpired = () => {
      if (isAuthenticated) {
        warning(
          "Session Expired",
          "Your session has expired. Please sign in again.",
        );
      }
    };
    window.addEventListener("auth_session_expired", onExpired);
    return () => window.removeEventListener("auth_session_expired", onExpired);
  }, [warning, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center overflow-hidden bg-slate-50">
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-emerald-100 blur-xl animate-pulse" />
          <Loader2 className="relative h-9 w-9 animate-spin text-emerald-600" />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-500">
        Loading...
        </p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Interview Room for Candidates */}
      <Route path="interview" element={<InterviewPage />} />

      {/* Public Landing Page */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />

      {/* Auth Pages */}
      <Route
        path="login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <LoginForm />
            </AuthLayout>
          )
        }
      />
      <Route
        path="register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <RegisterForm />
            </AuthLayout>
          )
        }
      />
      <Route
        path="reset-password"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <ResetPasswordForm />
            </AuthLayout>
          )
        }
      />

      {/* Authenticated Application */}
      {isAuthenticated ? (
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="candidates" element={<CandidatesPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="candidates/:id/report" element={<EvaluationReportPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
};


