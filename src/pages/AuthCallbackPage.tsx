import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/context/AuthContext";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, isAuthenticated } = useAuth();
  const [hasError, setHasError] = useState(false);

  // Step 1: process tokens from URL and call signIn
  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const googleAccessToken = searchParams.get("googleAccessToken");
    const error = searchParams.get("error");

    if (error || !accessToken || !refreshToken) {
      navigate("/login?error=google_failed", { replace: true });
      return;
    }

    if (googleAccessToken) {
      localStorage.setItem("google_access_token", googleAccessToken);
    }

    signIn({ accessToken, refreshToken }).catch(() => setHasError(true));
  }, [searchParams, signIn, navigate]);

  // Step 2: navigate AFTER React has committed isAuthenticated = true
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (hasError) {
      navigate("/login?error=google_failed", { replace: true });
    }
  }, [hasError, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#ff7a18] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Đang xác thực...</p>
      </div>
    </div>
  );
}
