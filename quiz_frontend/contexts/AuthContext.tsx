'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, AuthResponse, User } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored token and user
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUserEmail = localStorage.getItem('userEmail');

    if (storedToken && storedUserId && storedUserEmail) {
      setToken(storedToken);
      setUser({
        id: storedUserId,
        email: storedUserEmail,
        is_active: true,
      });
      
      // Verify token is still valid
      authApi.getCurrentUser(storedToken).catch(() => {
        // Token invalid, clear storage
        logout();
      });
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password });
      
      // Store auth data
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('userId', response.user_id);
      localStorage.setItem('userEmail', response.email);
      
      setToken(response.access_token);
      setUser({
        id: response.user_id,
        email: response.email,
        is_active: true,
      });
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.register({ email, password });
      
      // Store auth data
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('userId', response.user_id);
      localStorage.setItem('userEmail', response.email);
      
      setToken(response.access_token);
      setUser({
        id: response.user_id,
        email: response.email,
        is_active: true,
      });
      
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
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

