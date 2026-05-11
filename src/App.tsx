import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import RemoveBgPage from "@/pages/RemoveBgPage";
import ResizePage from "@/pages/ResizePage";
import ConvertPage from "@/pages/ConvertPage";
import PDFToolsPage from "@/pages/PDFToolsPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/remove-bg" element={<RemoveBgPage />} />
          <Route path="/resize" element={<ResizePage />} />
          <Route path="/convert" element={<ConvertPage />} />
          <Route path="/pdf-tools" element={<PDFToolsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
