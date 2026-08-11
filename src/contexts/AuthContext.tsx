import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getLocalProfile } from "@/lib/local-profile";
import { getPublicOrigin, publicUrl } from '@/lib/public-url';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isVIP: boolean;
  isAdmin: boolean;
  isCEO: boolean; // kept for backward compat
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, redirectTo?: string, metadata?: Record<string, unknown>) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean; alreadyRegistered?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requireAuth: (callback: () => void, authPath?: string) => void;
  applyLocalProfile: (patch: { displayName?: string; avatarDataUrl?: string }) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUserToUser = (supabaseUser: SupabaseUser): User | null => {
  // Anonymous users exist in the session but are not "authenticated app users".
  if (supabaseUser.is_anonymous) return null;

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


const getFriendlyAuthEmailError = (error?: string) => {
  const normalized = (error || "").toLowerCase();
  if (normalized.includes("weak") || normalized.includes("easy to guess") || normalized.includes("password")) {
    return "Essa senha é muito fraca ou já apareceu em vazamentos. Use letras, números e símbolos.";
  }
  return error || "Erro ao criar conta";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);


  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        const anon = newSession?.user?.is_anonymous ?? false;
        setSession(newSession);
        setIsAnonymous(anon);
        setUser(newSession?.user ? mapSupabaseUserToUser(newSession.user) : null);
        setIsLoading(false);

        // Execute pending callback if user just logged in
        if (event === "SIGNED_IN" && pendingCallback && !anon) {
          setTimeout(() => {
            pendingCallback();
            setPendingCallback(null);
          }, 0);
        }
      }
    );

    // THEN check for existing session and ensure guests always have an anonymous session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!existingSession) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          console.error('Anonymous sign-in failed:', anonError);
          setIsLoading(false);
          return;
        }
        const anonSession = anonData.session;
        setSession(anonSession);
        setIsAnonymous(anonSession?.user?.is_anonymous ?? false);
        setUser(anonSession?.user ? mapSupabaseUserToUser(anonSession.user) : null);
        setIsLoading(false);
      } else {
        const anon = existingSession.user?.is_anonymous ?? false;
        setSession(existingSession);
        setIsAnonymous(anon);
        setUser(existingSession.user ? mapSupabaseUserToUser(existingSession.user) : null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [pendingCallback]);


  const signUp = useCallback(async (email: string, password: string, redirectTo?: string, metadata?: Record<string, unknown>) => {
    try {
      const redirectUrl = redirectTo || `${getPublicOrigin()}/auth`;

      // If there is an anonymous session, sign it out first so the signup
      // creates a permanent account instead of converting the guest.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user.is_anonymous) {
        await supabase.auth.signOut();
      }

      // Email verification is enabled: signUp returns no session until the
      // user confirms via the emailed link.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });

      if (error) {
        if (/already.*registered|user already/i.test(error.message)) {
          return { success: false, alreadyRegistered: true, error: "Este email já está cadastrado" };
        }
        return { success: false, error: getFriendlyAuthEmailError(error.message) };
      }

      if (data.user && (data.user.identities?.length ?? 1) === 0) {
        return { success: false, alreadyRegistered: true, error: "Este email já está cadastrado" };
      }

      // Requires email confirmation when no session is returned.
      return { success: true, needsConfirmation: !data.session };
    } catch (err) {
      return { success: false, error: "Erro ao criar conta" };
    }
  }, []);



  const resetPassword = useCallback(async (email: string) => {
    try {
      const redirectUrl = `${getPublicOrigin()}/reset-password`;
      const { data, error } = await supabase.functions.invoke("send-auth-email", {
        body: {
          type: "recovery",
          email,
          redirect_to: redirectUrl,
        },
      });
      if (error) return { success: false, error: "Erro ao enviar email de recuperação" };
      if (!data?.success) return { success: false, error: data?.error || "Erro ao enviar email de recuperação" };
      return { success: true };
    } catch (err) {
      return { success: false, error: "Erro ao enviar email de recuperação" };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: "Erro ao atualizar senha" };
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

  const logout = useCallback(() => {
    signOut();
  }, [signOut]);

  const requireAuth = useCallback(
    (callback: () => void, authPath = "/auth") => {
      if (user) {
        callback();
      } else {
        setPendingCallback(() => callback);
        window.location.href = authPath;
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
        resetPassword,
        updatePassword,
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
      resetPassword: asyncNoop,
      updatePassword: asyncNoop,
      logout: noop,
      requireAuth: noop,
      applyLocalProfile: noop,
    };
  }
  return context;
};
