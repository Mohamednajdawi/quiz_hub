'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Button } from '@/components/ui/Button';

interface PreferenceDraft {
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsentBanner() {
  const { consent, isBannerVisible, acceptAll, rejectNonEssential, updateConsent } =
    useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [draft, setDraft] = useState<PreferenceDraft>({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });

  useEffect(() => {
    setDraft({
      analytics: consent?.analytics ?? false,
      marketing: consent?.marketing ?? false,
    });
  }, [consent]);

  if (!isBannerVisible) {
    return null;
  }

  const handleSavePreferences = () => {
    updateConsent(draft);
    setShowPreferences(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Your privacy choices</h2>
            <p className="mt-1 text-sm text-gray-600">
              We use cookies to provide essential site functionality and, with your permission,
              improve analytics and marketing. See our{' '}
              <Link href="/privacy" className="text-indigo-600 underline">
                Privacy Policy
              </Link>{' '}
              for details.
            </p>
          </div>

          {showPreferences && (
            <div className="rounded-lg bg-gray-50 p-4 space-y-3 text-sm text-gray-700">
              <PreferenceToggle
                id="analytics-consent"
                label="Analytics"
                description="Help us understand how you use Progrezz so we can improve the product."
                checked={draft.analytics}
                onChange={(checked) => setDraft((prev) => ({ ...prev, analytics: checked }))}
              />
              <PreferenceToggle
                id="marketing-consent"
                label="Marketing"
                description="Allow personalized offers and product announcements."
                checked={draft.marketing}
                onChange={(checked) => setDraft((prev) => ({ ...prev, marketing: checked }))}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowPreferences(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSavePreferences}>
                  Save preferences
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences((prev) => !prev)}
            >
              {showPreferences ? 'Hide settings' : 'Manage settings'}
            </Button>
            <Button variant="secondary" size="sm" onClick={rejectNonEssential}>
              Essential only
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-medium text-gray-900">
          {label}
        </label>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-200" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}


