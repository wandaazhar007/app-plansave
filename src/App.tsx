// // src/App.tsx
// import { useEffect } from "react";
// import { Navigate, Route, Routes } from "react-router-dom";
// import { Toaster } from "react-hot-toast";

// import LoginPage from "./pages/login/LoginPage";
// import SignupPage from "./pages/signup/SignupPage";
// import ForgotPasswordPage from "./pages/forgot/ForgotPasswordPage";

// import ProtectedRoute from "./components/auth/ProtectedRoute";

// // Layout components you already have
// import Navbar from "./components/navbar/Navbar";
// import Sidebar from "./components/sidebar/Sidebar";
// import Footer from "./components/footer/Footer";

// const APP_NAME = "PlanSave — Budgeting That Feels Supportive";
// const APP_DESCRIPTION =
//   "Secure budgeting app to track income, expenses, and dialysis spending with clear insights and supportive guidance.";
// const APP_URL = "https://app.plansave.com";

// function upsertMetaTag(attr: "name" | "property", key: string, content: string) {
//   const selector = `meta[${attr}="${key}"]`;
//   let el = document.head.querySelector<HTMLMetaElement>(selector);
//   if (!el) {
//     el = document.createElement("meta");
//     el.setAttribute(attr, key);
//     document.head.appendChild(el);
//   }
//   el.setAttribute("content", content);
// }

// function upsertLinkTag(rel: string, href: string) {
//   const selector = `link[rel="${rel}"]`;
//   let el = document.head.querySelector<HTMLLinkElement>(selector);
//   if (!el) {
//     el = document.createElement("link");
//     el.setAttribute("rel", rel);
//     document.head.appendChild(el);
//   }
//   el.setAttribute("href", href);
// }

// function setBaseMetadata() {
//   document.title = APP_NAME;
//   upsertMetaTag("name", "description", APP_DESCRIPTION);
//   upsertMetaTag("name", "application-name", "PlanSave");
//   upsertMetaTag("name", "theme-color", "#4C7DF0");

//   upsertMetaTag("property", "og:title", APP_NAME);
//   upsertMetaTag("property", "og:description", APP_DESCRIPTION);
//   upsertMetaTag("property", "og:type", "website");
//   upsertMetaTag("property", "og:url", APP_URL);

//   upsertMetaTag("name", "twitter:card", "summary");
//   upsertMetaTag("name", "twitter:title", APP_NAME);
//   upsertMetaTag("name", "twitter:description", APP_DESCRIPTION);

//   upsertLinkTag("canonical", APP_URL);
// }

// function AppShellPlaceholder() {
//   // Step 4 nanti kita isi real pages dashboard dsb.
//   return (
//     <div className="appShell">
//       <Navbar />
//       <div style={{ display: "flex", minHeight: "calc(100dvh - var(--ps-navbar-h))" }}>
//         <div style={{ flex: "0 0 auto" }}>
//           <Sidebar />
//         </div>
//         <main className="appMain" style={{ width: "100%" }}>
//           <div className="container page">
//             <div className="card" style={{ padding: "2rem" }}>
//               <h1 style={{ fontSize: "2rem", lineHeight: "1.3" }}>You’re signed in.</h1>
//               <p className="text-muted" style={{ marginTop: "0.8rem" }}>
//                 Small steps—keep going. Next we’ll build your dashboard.
//               </p>
//             </div>
//           </div>
//           <Footer />
//         </main>
//       </div>
//     </div>
//   );
// }

// export default function App() {
//   useEffect(() => {
//     setBaseMetadata();
//   }, []);

//   return (
//     <>
//       <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

//       <Routes>
//         <Route path="/" element={<Navigate to="/login" replace />} />

//         {/* Public Auth */}
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/signup" element={<SignupPage />} />
//         <Route path="/forgot" element={<ForgotPasswordPage />} />

//         {/* Protected App */}
//         <Route
//           path="/app"
//           element={
//             <ProtectedRoute>
//               <AppShellPlaceholder />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/app/dashboard"
//           element={
//             <ProtectedRoute>
//               <AppShellPlaceholder />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/app/transactions"
//           element={
//             <ProtectedRoute>
//               <AppShellPlaceholder />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/app/budgets"
//           element={
//             <ProtectedRoute>
//               <AppShellPlaceholder />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/app/recurring"
//           element={
//             <ProtectedRoute>
//               <AppShellPlaceholder />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/app/analytics"
//           element={
//             <ProtectedRoute>
//               <AppShellPlaceholder />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/app/export"
//           element={
//             <ProtectedRoute>
//               <AppShellPlaceholder />
//             </ProtectedRoute>
//           }
//         />

//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </>
//   );
// }









// src/App.tsx
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LoginPage from "./pages/login/LoginPage";
import SignupPage from "./pages/signup/SignupPage";
import ForgotPasswordPage from "./pages/forgot/ForgotPasswordPage";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./pages/app/AppLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";

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
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

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

          <Route path="transactions" element={<Placeholder title="Transactions" />} />
          <Route path="budgets" element={<Placeholder title="Budgets" />} />
          <Route path="recurring" element={<Placeholder title="Recurring" />} />
          <Route path="analytics" element={<Placeholder title="Analytics" />} />
          <Route path="export" element={<Placeholder title="Export" />} />
          <Route path="profile" element={<Placeholder title="Profile" />} />
          <Route path="settings" element={<Placeholder title="Settings" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}