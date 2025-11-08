import apiClient from './client';

export interface PricingCTA {
  label: string;
  href: string;
  variant?: 'primary' | 'outline';
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  price_suffix?: string;
  price_annual?: string;
  price_suffix_annual?: string;
  annual_savings?: string;
  tagline?: string;
  description?: string;
  features: string[];
  cta?: PricingCTA;
  highlighted?: boolean;
}

export interface PricingHero {
  title: string;
  subtitle?: string;
}

export interface PricingConfig {
  hero?: PricingHero;
  tiers: PricingTier[];
}

export interface AppConfigResponse {
  free_generation_quota: number;
  pricing: PricingConfig;
  [key: string]: unknown;
}

export const configApi = {
  async getAppConfig(): Promise<AppConfigResponse> {
    const response = await apiClient.get('/config/app');
    return response.data;
  },

  async getPricing(): Promise<PricingConfig> {
    const response = await apiClient.get('/config/pricing');
    return response.data;
  },
};

