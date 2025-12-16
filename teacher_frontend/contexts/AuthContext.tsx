'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  const isInitializedRef = useRef(false);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:34',message:'AuthContext useEffect started',data:{windowDefined:typeof window!=='undefined',readyState:typeof window!=='undefined'?document.readyState:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:38',message:'Window undefined, setting isLoading false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setIsLoading(false);
      return;
    }

    // Use a small timeout to ensure localStorage is available
    const initAuth = () => {
      // Prevent multiple initializations
      if (isInitializedRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:46',message:'initAuth already initialized, skipping',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return;
      }
      isInitializedRef.current = true;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:51',message:'initAuth function called',data:{readyState:document.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:47',message:'Attempting localStorage access',data:{localStorageAvailable:typeof localStorage!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const storedToken = localStorage.getItem('token');
        const storedUserRaw = localStorage.getItem('user');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:50',message:'localStorage read complete',data:{hasToken:!!storedToken,hasUser:!!storedUserRaw,tokenLength:storedToken?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        if (storedToken && storedUserRaw) {
          setToken(storedToken);
          try {
            const parsedUser: User = JSON.parse(storedUserRaw);
            setUser(parsedUser);
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:57',message:'Setting isLoading to false',data:{userId:parsedUser.id,isAuthenticated:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // Set loading to false immediately so queries can start
            setIsLoading(false);
            
            // Verify token in background (non-blocking) - don't wait for this
            authApi.getCurrentUser(storedToken)
              .then((freshUser) => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:66',message:'Token verification success',data:{userId:freshUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
              })
              .catch((err) => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:72',message:'Token verification failed',data:{status:err?.response?.status,is401:err?.response?.status===401,message:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:84',message:'Failed to parse user JSON',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            console.error('Failed to parse stored user', error);
            setIsLoading(false);
            // Clear invalid data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:92',message:'No stored auth, setting isLoading false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          setIsLoading(false);
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:97',message:'Error in initAuth catch block',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    // Initialize auth immediately - no need for complex timing logic
    // localStorage is always available in useEffect on client side
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:106',message:'Calling initAuth immediately',data:{readyState:document.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    initAuth();
    
    // Cleanup function (though this effect should only run once)
    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:112',message:'AuthContext cleanup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    };
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

