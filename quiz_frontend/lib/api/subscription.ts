import apiClient from './client';

export interface SubscriptionInfo {
  plan_type: string;
  status: string;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
}

export interface UserSubscriptionResponse {
  has_subscription: boolean;
  plan_type?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  stripe_subscription_id?: string;
}

export const subscriptionApi = {
  getCurrentUserSubscription: async (): Promise<UserSubscriptionResponse> => {
    const response = await apiClient.get('/auth/me/subscription');
    return response.data;
  },
  cancelSubscription: async (subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<{ status: string; subscription_id: string; cancel_at_period_end: boolean }> => {
    const response = await apiClient.post(`/payments/subscriptions/${subscriptionId}/cancel?cancel_at_period_end=${cancelAtPeriodEnd}`);
    return response.data;
  },
};

