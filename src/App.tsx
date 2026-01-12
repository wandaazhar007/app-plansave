// src/App.tsx
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/login/LoginPage";
import SignupPage from "./pages/signup/SignupPage";
import ForgotPasswordPage from "./pages/forgot/ForgotPasswordPage";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./pages/app/AppLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";

import { ToastProvider } from "./components/toast/ToastProvider";

const APP_NAME = "PlanSave — Supportive budgeting for everyday life";
const APP_DESCRIPTION =
  "Secure budgeting app to track income, expenses, dialysis spending, budgets, and exports with calm, clear guidance.";
const APP_URL = "https://app.plansave.com";

function upsertMetaTag(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLinkTag(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setBaseMetadata() {
  document.title = APP_NAME;
  upsertMetaTag("name", "description", APP_DESCRIPTION);
  upsertMetaTag("name", "application-name", "PlanSave");
  upsertMetaTag("name", "theme-color", "#4C7DF0");

  upsertMetaTag("property", "og:title", APP_NAME);
  upsertMetaTag("property", "og:description", APP_DESCRIPTION);
  upsertMetaTag("property", "og:type", "website");
  upsertMetaTag("property", "og:url", APP_URL);

  upsertMetaTag("name", "twitter:card", "summary");
  upsertMetaTag("name", "twitter:title", APP_NAME);
  upsertMetaTag("name", "twitter:description", APP_DESCRIPTION);

  upsertLinkTag("canonical", APP_URL);
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="card" style={{ padding: "2.4rem" }}>
      <h1 style={{ fontSize: "2rem", margin: 0 }}>{title}</h1>
      <p className="text-muted" style={{ marginTop: "0.8rem" }}>
        One step at a time. This page is coming next.
      </p>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    setBaseMetadata();
  }, []);

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />

        {/* Protected App (layout + nested routes) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* ✅ Transactions module */}
          <Route path="transactions" element={<TransactionsPage />} />

          <Route path="budgets" element={<Placeholder title="Budgets" />} />
          <Route path="recurring" element={<Placeholder title="Recurring" />} />
          <Route path="analytics" element={<Placeholder title="Analytics" />} />
          <Route path="export" element={<Placeholder title="Export" />} />
          <Route path="profile" element={<Placeholder title="Profile" />} />
          <Route path="settings" element={<Placeholder title="Settings" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ToastProvider>
  );
}