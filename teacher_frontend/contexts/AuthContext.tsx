'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, AuthResponse, RegisterRequest, UpdateProfileRequest, User } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Use a small timeout to ensure localStorage is available
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUserRaw = localStorage.getItem('user');

        if (storedToken && storedUserRaw) {
          setToken(storedToken);
          try {
            const parsedUser: User = JSON.parse(storedUserRaw);
            setUser(parsedUser);
            // Set loading to false immediately so queries can start
            setIsLoading(false);
            
            // Verify token in background (non-blocking) - don't wait for this
            authApi.getCurrentUser(storedToken)
              .then((freshUser) => {
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
              })
              .catch((err) => {
                // Only handle 401 errors - network errors shouldn't clear auth
                if (err?.response?.status === 401) {
                  // Token is invalid, clear it
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setToken(null);
                  setUser(null);
                }
                // For network errors, keep the stored token and let the interceptor handle it
              });
          } catch (error) {
            console.error('Failed to parse stored user', error);
            setIsLoading(false);
            // Clear invalid data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    // Small delay to ensure everything is ready
    if (document.readyState === 'complete') {
      initAuth();
    } else {
      window.addEventListener('load', initAuth);
      // Also try immediately in case load already fired
      setTimeout(initAuth, 0);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password });
      
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      router.push('/courses');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response: AuthResponse = await authApi.register(data);
      
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      
      router.push('/courses');
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const updatedUser = await authApi.updateProfile(token, data);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        updateProfile,
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

