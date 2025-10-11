import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, getToken, setToken, clearToken } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const userData = await api.get<User>("/api/v1/auth/me");
          setUser(userData);
          setTokenState(storedToken);
        } catch (error) {
          clearToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<{
      access_token: string;
      token_type: string;
      user: User;
    }>("/api/v1/auth/login", { email, password });

    setToken(response.access_token);
    setTokenState(response.access_token);
    setUser(response.user);
    localStorage.setItem("auth_user", JSON.stringify(response.user));
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setTokenState(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
