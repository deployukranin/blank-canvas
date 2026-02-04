import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getLocalProfile } from "@/lib/local-profile";
import { storeAdminSession, getAdminSessionInfo, hasAdminSession, clearAdminSession } from "@/lib/admin-session";
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
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsAdmin: (email: string, password: string, role: "admin" | "ceo") => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requireAuth: (callback: () => void) => void;
  applyLocalProfile: (patch: { displayName?: string; avatarDataUrl?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUserToUser = (supabaseUser: SupabaseUser): User => {
  const baseUser: User = {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    username: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "Usuário",
    avatar: supabaseUser.user_metadata?.avatar_url,
    isVIP: false,
    isAdmin: false,
    isCEO: false,
    createdAt: supabaseUser.created_at,
  };

  // Apply local profile overrides
  const local = getLocalProfile(baseUser.id);
  if (local) {
    return {
      ...baseUser,
      username: local.displayName || baseUser.username,
      avatar: local.avatarDataUrl || baseUser.avatar,
    };
  }

  return baseUser;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ? mapSupabaseUserToUser(newSession.user) : null);
        setIsLoading(false);

        // Execute pending callback if user just logged in
        if (event === "SIGNED_IN" && pendingCallback) {
          setTimeout(() => {
            pendingCallback();
            setPendingCallback(null);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ? mapSupabaseUserToUser(existingSession.user) : null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [pendingCallback]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { success: false, error: "Este email já está cadastrado" };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Erro ao criar conta" };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { success: false, error: "Email ou senha incorretos" };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Erro ao fazer login" };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const loginAsAdmin = useCallback(async (email: string, password: string, role: "admin" | "ceo") => {
    try {
      // Call the edge function to validate and get token
      const { data, error } = await supabase.functions.invoke('validate-admin-login', {
        body: { email, password }
      });

      if (error || !data?.success) {
        return { success: false, error: data?.error || 'Credenciais inválidas' };
      }

      // Store the admin session token
      if (data.admin_token) {
        storeAdminSession(data.admin_token, { email: data.email, role: data.role });
      }

      // Set user state for admin
      const adminUser: User = {
        id: `admin-${data.role}-${Date.now()}`,
        email: data.email,
        username: data.role === 'ceo' ? 'CEO' : 'Admin',
        isVIP: true,
        isAdmin: true,
        isCEO: data.role === 'ceo',
        createdAt: new Date().toISOString(),
      };
      setUser(adminUser);
      return { success: true };
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    signOut();
  }, [signOut]);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user) {
        callback();
      } else {
        setPendingCallback(() => callback);
        // Navigate to auth page
        window.location.href = "/auth";
      }
    },
    [user]
  );

  const applyLocalProfile = useCallback(
    (patch: { displayName?: string; avatarDataUrl?: string }) => {
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          username: patch.displayName?.trim() || prev.username,
          avatar: patch.avatarDataUrl || prev.avatar,
        };
      });
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        signUp,
        signIn,
        signOut,
        loginAsAdmin,
        logout,
        requireAuth,
        applyLocalProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("useAuth used outside AuthProvider");

    const noop = () => {};
    const asyncNoop = async () => ({ success: false, error: "AuthProvider não inicializado" });

    return {
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      signUp: asyncNoop,
      signIn: asyncNoop,
      signOut: async () => {},
      loginAsAdmin: asyncNoop,
      logout: noop,
      requireAuth: noop,
      applyLocalProfile: noop,
    };
  }
  return context;
};
