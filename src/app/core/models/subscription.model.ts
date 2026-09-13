export interface UserSubscription {
  planName: string;
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | string;
  daysRemaining: number;
  startDate?: string;
  endDate?: string;
  price?: number;
  currency?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  planId?: string;
  durationMonths?: number;
  isTrial?: boolean;
}

export interface ActivePlan {
  _id: string;
  planId?: string;
  name: string;
  slug?: string;
  durationMonths: number;
  durationDays?: number;
  price: number;
  currency?: string;
  isFree?: boolean;
  trialDays?: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

export interface SubscriptionMeResponse {
  success: boolean;
  message?: string;
  data: {
    user: any;
    currentPlan: any;
    subscription: any;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    status: string;
    isExpired: boolean;
    isExpiringSoon: boolean;
  };
}

export interface ActivePlansResponse {
  success: boolean;
  count?: number;
  data: ActivePlan[];
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    isFree?: boolean;
    subscription?: any;
    order?: {
      id: string;
      amount: number;
      currency: string;
    };
    key?: string;
    plan?: {
      id: string;
      name: string;
      price: number;
      currency: string;
      durationMonths: number;
    };
  };
}

export interface VerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
