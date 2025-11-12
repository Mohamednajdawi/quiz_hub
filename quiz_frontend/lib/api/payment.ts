import apiClient from './client';

export interface CreateCheckoutSessionRequest {
  plan_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutSessionResponse {
  session_id: string;
  url: string;
}

export const paymentApi = {
  createCheckoutSession: async (data: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
    const response = await apiClient.post('/payments/checkout-session', data);
    return response.data;
  },
};

