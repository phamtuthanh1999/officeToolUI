import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, tokenStore, type User, type AuthTokens } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (tokens: AuthTokens) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUserState] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    tokenStore.getAccess()
  );
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount if token exists
  useEffect(() => {
    const token = tokenStore.getAccess();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: User }>("/auth/me")
      .then((res) => {
        setUserState(res.user);
        setAccessToken(token);
      })
      .catch(() => {
        tokenStore.clear();
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (tokens: AuthTokens) => {
    tokenStore.setAccess(tokens.accessToken);
    tokenStore.setRefresh(tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    // Fetch user info after sign in
    try {
      const res = await apiFetch<{ user: User }>("/auth/me");
      setUserState(res.user);
    } catch {
      setUserState(null);
    }
  }, []);

  const setUser = useCallback((u: User) => {
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem("google_access_token");
    setUserState(null);
    setAccessToken(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken,
        loading,
        signIn,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
