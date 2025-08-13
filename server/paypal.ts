// Using PayPal REST API directly instead of SDK due to import issues

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing required PayPal secrets: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
}

// PayPal API base URL
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  console.log('PayPal API Base URL:', PAYPAL_API_BASE);
  console.log('PayPal Client ID exists:', !!process.env.PAYPAL_CLIENT_ID);
  console.log('PayPal Secret exists:', !!process.env.PAYPAL_CLIENT_SECRET);
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal auth error response:', errorText);
    throw new Error(`Failed to get PayPal access token: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Create a product first (required for plans)
export async function createProduct() {
  const accessToken = await getPayPalAccessToken();
  
  const productData = {
    name: "Music Streaming Service",
    description: "Premium music streaming subscription service",
    type: "SERVICE",
    category: "DIGITAL_MEDIA_BOOKS_MOVIES_MUSIC"
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal product: ${error}`);
  }

  return await response.json();
}

// Create a subscription plan (this would typically be done once)
export async function createSubscriptionPlan() {
  const accessToken = await getPayPalAccessToken();
  
  // First create a product
  const product = await createProduct();
  
  const planData = {
    product_id: product.id,
    name: "Music Streaming Premium Plan",
    description: "Monthly premium music streaming subscription",
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: "9.99",
            currency_code: "USD"
          }
        }
      }
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: "0",
        currency_code: "USD"
      },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3
    },
    taxes: {
      percentage: "0",
      inclusive: false
    }
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(planData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal plan: ${error}`);
  }

  return await response.json();
}

// Create a subscription for a user
export async function createSubscription(planId: string, userEmail: string) {
  const accessToken = await getPayPalAccessToken();
  
  const subscriptionData = {
    plan_id: planId,
    subscriber: {
      email_address: userEmail
    },
    application_context: {
      brand_name: "Music Streaming Platform",
      locale: "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
      },
      return_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/subscription-success`,
      cancel_url: `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000'}/subscriptions`
    }
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(subscriptionData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PayPal subscription: ${error}`);
  }

  return await response.json();
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get PayPal subscription: ${error}`);
  }

  return await response.json();
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string, reason: string = "User requested cancellation") {
  const accessToken = await getPayPalAccessToken();
  
  const cancelData = {
    reason: reason
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(cancelData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to cancel PayPal subscription: ${error}`);
  }

  return response.status === 204; // PayPal returns 204 No Content on successful cancellation
}