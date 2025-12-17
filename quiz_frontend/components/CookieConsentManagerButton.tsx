'use client';

import { useState, useEffect } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Button } from '@/components/ui/Button';

interface PreferenceDraft {
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsentManagerButton() {
  const { consent, updateConsent } = useCookieConsent();
  const [open, setOpen] = useState(false);
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

  const handleSave = () => {
    updateConsent(draft);
    setOpen(false);
  };

  return (
    <>
      {/* Floating re-consent trigger */}
      {consent && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 left-4 z-[55] rounded-full bg-white/95 border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-700 shadow-md hover:bg-gray-50"
        >
          Cookie settings
        </button>
      )}

      {/* Small preferences modal */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Cookie preferences</h2>
              <p className="mt-1 text-xs text-gray-600">
                Adjust your analytics and marketing choices. Strictly necessary cookies remain active.
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <PreferenceToggle
                id="re-analytics-consent"
                label="Analytics"
                description="Help us understand how the site is used so we can improve it."
                checked={draft.analytics}
                onChange={(checked) => setDraft((prev) => ({ ...prev, analytics: checked }))}
              />
              <PreferenceToggle
                id="re-marketing-consent"
                label="Marketing"
                description="Allow personalized product updates and offers."
                checked={draft.marketing}
                onChange={(checked) => setDraft((prev) => ({ ...prev, marketing: checked }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSave}>
                Save preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
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
        <p className="text-gray-600 text-xs">{description}</p>
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


