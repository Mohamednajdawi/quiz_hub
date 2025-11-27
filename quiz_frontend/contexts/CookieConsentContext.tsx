'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

interface CookieConsentContextValue {
  consent: ConsentPreferences | null;
  isBannerVisible: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  updateConsent: (prefs: Partial<Omit<ConsentPreferences, 'necessary'>>) => void;
}

const STORAGE_KEY = 'quizhub_cookie_consent_v1';
const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (stored) {
        setConsent(JSON.parse(stored) as ConsentPreferences);
      }
    } catch (error) {
      console.warn('Failed to parse stored cookie consent preferences', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!consent) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (error) {
      console.warn('Failed to persist cookie consent preferences', error);
    }
  }, [consent]);

  const acceptAll = useCallback(() => {
    setConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  }, []);

  const rejectNonEssential = useCallback(() => {
    setConsent({
      ...defaultPreferences,
      analytics: false,
      marketing: false,
    });
  }, []);

  const updateConsent = useCallback(
    (prefs: Partial<Omit<ConsentPreferences, 'necessary'>>) => {
      setConsent({
        ...defaultPreferences,
        ...prefs,
      });
    },
    []
  );

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      isBannerVisible: loaded && consent === null,
      acceptAll,
      rejectNonEssential,
      updateConsent,
    }),
    [acceptAll, consent, loaded, rejectNonEssential, updateConsent]
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}


