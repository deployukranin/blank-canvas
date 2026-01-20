import React, { createContext, useContext, useState, useCallback } from 'react';

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
  loginAsAdmin: (email: string, password: string, role: 'admin' | 'ceo') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('asmr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate Google OAuth flow
    // In the future, this will integrate with Supabase Auth
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock user from Google - regular user
    const mockUser: User = {
      id: `google-${Date.now()}`,
      email: 'user@example.com',
      username: 'Usuário',
      avatar: undefined,
      isVIP: false,
      isAdmin: false,
      isCEO: false,
      createdAt: new Date().toISOString(),
    };

    setUser(mockUser);
    localStorage.setItem('asmr_user', JSON.stringify(mockUser));
    setIsLoading(false);
    
    // Execute pending callback if any
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
    
    return { success: true };
  }, [pendingCallback]);

  const loginAsAdmin = useCallback(async (email: string, password: string, role: 'admin' | 'ceo') => {
    setIsLoading(true);
    
    // Simulate API authentication
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const adminUser: User = {
      id: `admin-${Date.now()}`,
      email,
      username: role === 'ceo' ? 'CEO' : 'Administrador',
      avatar: undefined,
      isVIP: true,
      isAdmin: true,
      isCEO: role === 'ceo',
      createdAt: new Date().toISOString(),
    };

    setUser(adminUser);
    localStorage.setItem('asmr_user', JSON.stringify(adminUser));
    setIsLoading(false);
    
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('asmr_user');
  }, []);

  const requireAuth = useCallback((callback: () => void) => {
    if (user) {
      callback();
    } else {
      setPendingCallback(() => callback);
      setShowAuthModal(true);
    }
  }, [user]);

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
      }}
    >
      {children}
      {/* Auth Modal will be rendered separately */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
