import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, UserRole } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  register: (params: {
    name: string;
    email: string;
    password: string;
    role: 'BUYER' | 'SELLER';
    companyName?: string;
    country?: string;
    registrationNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyEmail: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  loginDemo: (role: 'BUYER' | 'SELLER') => Promise<boolean>;
  unlockDeveloperAccess: (passcode: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
      setOrganization(data.organization);
    } catch {
      setUser(null);
      setOrganization(null);
      setStoredToken(null);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    try {
      const res = await api.auth.login(email, password, role);
      setStoredToken(res.sessionToken);
      setUser(res.user);
      setOrganization(res.organization);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const register = async (params: {
    name: string;
    email: string;
    password: string;
    role: 'BUYER' | 'SELLER';
    companyName?: string;
    country?: string;
    registrationNumber?: string;
  }) => {
    try {
      const res = await api.auth.register(params);
      setStoredToken(res.sessionToken);
      setUser(res.user);
      setOrganization(res.organization);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore
    } finally {
      setStoredToken(null);
      setUser(null);
      setOrganization(null);
    }
  };

  const verifyEmail = async () => {
    try {
      const res = await api.auth.verifyEmail();
      setUser(res.user);
      return true;
    } catch {
      return false;
    }
  };

  const loginDemo = async (role: 'BUYER' | 'SELLER') => {
    const email = role === 'BUYER' ? 'buyer.demo@meridian.test' : 'seller.demo@meridian.test';
    const res = await login(email, 'Password@123', role);
    return res.success;
  };

  const unlockDeveloperAccess = async (passcode: string) => {
    if (passcode.trim() === 'meridian-dev-2026' || passcode.trim() === 'admin2026') {
      const res = await login('internal-dev@meridian.system', 'meridian-dev-2026', 'DEVELOPER');
      return res;
    }
    return { success: false, error: 'Invalid internal authorization credential.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        refreshProfile,
        loginDemo,
        unlockDeveloperAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
