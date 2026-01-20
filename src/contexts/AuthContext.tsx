import React, { createContext, useContext, useState, useCallback } from "react";

import { getLocalProfile } from "@/lib/local-profile";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isVIP: boolean;
  isAdmin: boolean;
  isCEO: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginAsAdmin: (
    email: string,
    password: string,
    role: "admin" | "ceo"
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requireAuth: (callback: () => void) => void;
  applyLocalProfile: (patch: { displayName?: string; avatarDataUrl?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const applyLocalProfileToUser = (base: User): User => {
  const local = getLocalProfile(base.id);
  if (!local) return base;

  return {
    ...base,
    username: local.displayName || base.username,
    avatar: local.avatarDataUrl || base.avatar,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("asmr_user");
    const parsed = saved ? (JSON.parse(saved) as User) : null;
    return parsed ? applyLocalProfileToUser(parsed) : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const persistUser = (next: User | null) => {
    if (!next) {
      localStorage.removeItem("asmr_user");
      return;
    }
    localStorage.setItem("asmr_user", JSON.stringify(next));
  };

  const applyLocalProfile = useCallback(
    (patch: { displayName?: string; avatarDataUrl?: string }) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next: User = {
          ...prev,
          username: patch.displayName?.trim() || prev.username,
          avatar: patch.avatarDataUrl || prev.avatar,
        };
        persistUser(next);
        return next;
      });
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);

    // Simulate Google OAuth flow (mock)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock user from Google - regular user
    const mockUser: User = applyLocalProfileToUser({
      id: `google-${Date.now()}`,
      email: "user@example.com",
      username: "Usuário",
      avatar: undefined,
      isVIP: false,
      isAdmin: false,
      isCEO: false,
      createdAt: new Date().toISOString(),
    });

    setUser(mockUser);
    persistUser(mockUser);
    setIsLoading(false);

    // Execute pending callback if any
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }

    return { success: true };
  }, [pendingCallback]);

  const loginAsAdmin = useCallback(
    async (email: string, password: string, role: "admin" | "ceo") => {
      setIsLoading(true);

      // Simulate API authentication
      await new Promise((resolve) => setTimeout(resolve, 500));

      const adminUser: User = applyLocalProfileToUser({
        id: `admin-${Date.now()}`,
        email,
        username: role === "ceo" ? "CEO" : "Administrador",
        avatar: undefined,
        isVIP: true,
        isAdmin: true,
        isCEO: role === "ceo",
        createdAt: new Date().toISOString(),
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      void password;

      setUser(adminUser);
      persistUser(adminUser);
      setIsLoading(false);

      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
  }, []);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user) {
        callback();
      } else {
        setPendingCallback(() => callback);
        setShowAuthModal(true);
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginAsAdmin,
        logout,
        requireAuth,
        applyLocalProfile,
      }}
    >
      {children}
      {/* Auth Modal will be rendered separately */}
      {/* showAuthModal is intentionally kept for future wiring */}
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {showAuthModal && null}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Resilience: during HMR or edge render paths, avoid blank screens.
    console.error("useAuth used outside AuthProvider");

    const noop = () => {};

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithGoogle: async () => ({ success: false, error: "AuthProvider não inicializado" }),
      loginAsAdmin: async () => ({ success: false, error: "AuthProvider não inicializado" }),
      logout: noop,
      requireAuth: noop,
      applyLocalProfile: noop,
    };
  }
  return context;
};

