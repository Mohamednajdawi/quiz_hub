'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:8',message:'ProtectedRoute render',data:{isLoading,isAuthenticated,currentPath:typeof window!=='undefined'?window.location.pathname:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, [isLoading, isAuthenticated]);
  // #endregion

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:16',message:'Redirecting to login',data:{currentPath:typeof window!=='undefined'?window.location.pathname:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1221]">
        <div className="text-[#38BDF8] text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

