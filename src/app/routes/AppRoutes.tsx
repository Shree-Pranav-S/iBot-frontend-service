import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { RegisterForm } from "../../features/auth/components/RegisterForm";
import { ResetPasswordForm } from "../../features/auth/components/ResetPasswordForm";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { MainLayout } from "../../components/layout/MainLayout";
import { LandingPage } from "../../components/layout/LandingPage";
import { Loader2 } from "lucide-react";

const DashboardPage = lazy(() =>
  import("../../features/dashboard/components/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);
const AssessmentsPage = lazy(() =>
  import("../../features/dashboard/components/AssessmentsPage").then((m) => ({
    default: m.AssessmentsPage,
  })),
);
const CandidatesPage = lazy(() =>
  import("../../features/dashboard/components/CandidatesPage").then((m) => ({
    default: m.CandidatesPage,
  })),
);
const EvaluationsPage = lazy(() =>
  import("../../features/dashboard/components/EvaluationsPage").then((m) => ({
    default: m.EvaluationsPage,
  })),
);
const InterviewPage = lazy(() =>
  import("../../features/dashboard/components/InterviewPage").then((m) => ({
    default: m.InterviewPage,
  })),
);
const EvaluationReportPage = lazy(() =>
  import("../../features/dashboard/components/EvaluationReportPage").then((m) => ({
    default: m.EvaluationReportPage,
  })),
);

const RouteFallback = () => (
  <div className="flex h-full min-h-[200px] flex-col items-center justify-center">
    <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
  </div>
);

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { warning } = useToast();

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
        <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
        <p className="mt-4 text-sm font-bold text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="interview" element={<InterviewPage />} />

        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
          }
        />

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
    </Suspense>
  );
};
