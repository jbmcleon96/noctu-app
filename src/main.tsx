import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerOnboarding from "./pages/OwnerOnboarding";
import OwnerQRScanner from "./pages/OwnerQRScanner";
import OwnerSignInPage from "./pages/OwnerSignInPage";
import OwnerSignUpPage from "./pages/OwnerSignUpPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { AuthProvider } from "./providers/AuthProvider";

function AdminPlaceholder() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07010a",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div>
        <h1 style={{ marginBottom: 12 }}>Admin</h1>
        <p>Admin route is loading.</p>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/owner-signin" element={<OwnerSignInPage />} />
          <Route path="/owner-signup" element={<OwnerSignUpPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          <Route path="/owner-onboarding" element={<OwnerOnboarding />} />
          <Route path="/owner-qr-scanner" element={<OwnerQRScanner clubId="demo-club" />} />
          <Route path="/admin" element={<AdminPlaceholder />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);