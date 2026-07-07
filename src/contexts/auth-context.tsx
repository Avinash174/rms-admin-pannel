"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, logout, refreshToken, getStoredUser, isAuthenticated } from '@/lib/api/auth';
import { LoginRequest } from '@/lib/types/auth';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is already authenticated on mount (client-side only)
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (data: LoginRequest) => {
    const response = await login(data);
    setUser(response.user);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  // Prevent hydration mismatch by providing default values before mount
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || !mounted,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
