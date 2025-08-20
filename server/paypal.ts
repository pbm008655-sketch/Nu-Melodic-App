// server/paypal.ts - Complete PayPal Integration Fix

import axios from 'axios';

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

// PayPal Access Token Cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get PayPal Access Token - Fixes 401 Authentication Error
 */
export async function getPayPalAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  try {
    // Encode credentials properly - this is often where the 401 error originates
    const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials', // Form-encoded body
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const { access_token, expires_in } = response.data;
    
    // Cache the token with expiry buffer (subtract 5 minutes for safety)
    cachedToken = {
      token: access_token,
      expiresAt: Date.now() + (expires_in * 1000) - 300000, // expires_in is in seconds
    };

    console.log('PayPal access token obtained successfully');
    return access_token;

  } catch (error: any) {
    console.error('PayPal Authentication Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    // Clear cached token on auth failure
    cachedToken = null;
    
    throw new Error(`PayPal authentication failed: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Create PayPal Subscription Plan
 */
export async function createPayPalSubscriptionPlan() {
  const accessToken = await getPayPalAccessToken();
  
  const planData = {
    product_id: 'MELOSTREAM_PREMIUM', // You'll need to create this product first
    name: 'MeloStream Premium Monthly',
    description: 'Monthly subscription for MeloStream Premium features',
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // 0 = infinite
        pricing_scheme: {
          fixed_price: {
            value: '9.99',
            currency_code: 'GBP',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  try {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/billing/plans`,
      planData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('PayPal Plan Creation Error:', error.response?.data);
    throw new Error(`Failed to create PayPal subscription plan: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Create PayPal Product (prerequisite for subscription plan)
 */
export async function createPayPalProduct() {
  const accessToken = await getPayPalAccessToken();
  
  const productData = {
    id: 'MELOSTREAM_PREMIUM',
    name: 'MeloStream Premium',
    description: 'Premium music streaming service with unlimited access',
    type: 'SERVICE',
    category: 'SOFTWARE',
  };

  try {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/catalogs/products`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    // Product might already exist, check for specific error
    if (error.response?.data?.details?.[0]?.issue === 'DUPLICATE_RESOURCE_ID') {
      console.log('PayPal product already exists, continuing...');
      return { id: 'MELOSTREAM_PREMIUM' };
    }
    
    console.error('PayPal Product Creation Error:', error.response?.data);
    throw new Error(`Failed to create PayPal product: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Get Subscription Details
 */
export async function getPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();
  
  try {
    const response = await axios.get(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('PayPal Subscription Fetch Error:', error.response?.data);
    throw new Error(`Failed to fetch PayPal subscription: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Cancel PayPal Subscription
 */
export async function cancelPayPalSubscription(subscriptionId: string, reason: string = 'User requested cancellation') {
  const accessToken = await getPayPalAccessToken();
  
  try {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        reason: reason,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    return response.status === 204; // PayPal returns 204 No Content on successful cancellation
  } catch (error: any) {
    console.error('PayPal Subscription Cancellation Error:', error.response?.data);
    throw new Error(`Failed to cancel PayPal subscription: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Verify PayPal Webhook Signature (for production security)
 */
export async function verifyPayPalWebhook(headers: any, body: string, webhookId: string): Promise<boolean> {
  const accessToken = await getPayPalAccessToken();
  
  const verificationData = {
    auth_algo: headers['paypal-auth-algo'],
    cert_id: headers['paypal-cert-id'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: JSON.parse(body),
  };

  try {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
      verificationData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    return response.data.verification_status === 'SUCCESS';
  } catch (error: any) {
    console.error('PayPal Webhook Verification Error:', error.response?.data);
    return false;
  }
}

// Helper function to initialize PayPal products and plans
export async function initializePayPalPlans() {
  try {
    console.log('Initializing PayPal products and plans...');
    
    // Try to create product first, but handle if it already exists
    try {
      await createPayPalProduct();
      console.log('PayPal product created successfully');
    } catch (error: any) {
      if (error.message?.includes('DUPLICATE_RESOURCE_IDENTIFIER')) {
        console.log('PayPal product already exists, continuing with plan creation...');
      } else {
        throw error;
      }
    }
    
    // Create or get existing subscription plan
    let plan;
    try {
      plan = await createPayPalSubscriptionPlan();
      console.log('PayPal plan created successfully');
    } catch (error: any) {
      if (error.message?.includes('DUPLICATE_RESOURCE_IDENTIFIER')) {
        console.log('PayPal plan already exists, using existing plan ID...');
        // Return the known plan ID if it already exists
        const existingPlanId = process.env.PAYPAL_PLAN_ID || "P-61E45392RA019152XNCSJZ3Y";
        console.log('PayPal initialization complete. Using existing Plan ID:', existingPlanId);
        return existingPlanId;
      } else {
        throw error;
      }
    }
    
    console.log('PayPal initialization complete. Plan ID:', plan.id);
    return plan.id;
  } catch (error) {
    console.error('PayPal initialization failed:', error);
    // Fallback to using the known plan ID if initialization fails
    const fallbackPlanId = process.env.PAYPAL_PLAN_ID || "P-61E45392RA019152XNCSJZ3Y";
    console.log('Using fallback Plan ID:', fallbackPlanId);
    return fallbackPlanId;
  }
}