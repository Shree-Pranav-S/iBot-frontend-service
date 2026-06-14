import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { RegisterForm } from "../../features/auth/components/RegisterForm";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { MainLayout } from "../../components/layout/MainLayout";
import { DashboardPage } from "../../features/dashboard/components/DashboardPage";
import { AssessmentsPage } from "../../features/dashboard/components/AssessmentsPage";
import { CandidatesPage } from "../../features/dashboard/components/CandidatesPage";
import { InterviewPage } from "../../features/dashboard/components/InterviewPage";
import { Loader2 } from "lucide-react";

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { warning } = useToast();
  const [view, setView] = useState<"login" | "register">("login");

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-indigo-100 blur-xl animate-pulse" />
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600 relative" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-500">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <AuthLayout>
              {view === "login" ? (
                <LoginForm onToggleView={() => setView("register")} />
              ) : (
                <RegisterForm onToggleView={() => setView("login")} />
              )}
            </AuthLayout>
          }
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="interview" element={<InterviewPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
