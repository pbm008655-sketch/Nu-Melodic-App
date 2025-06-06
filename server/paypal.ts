import * as checkoutsdk from '@paypal/checkout-server-sdk';

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing required PayPal secrets: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
}

// Configure PayPal environment (sandbox for development, live for production)
const environment = process.env.NODE_ENV === 'production' 
  ? new checkoutsdk.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new checkoutsdk.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

export const paypalClient = new checkoutsdk.core.PayPalHttpClient(environment);

// Create a subscription plan for monthly premium access
export async function createSubscriptionPlan() {
  const request = new checkoutsdk.plans.PlansCreateRequest();
  request.requestBody({
    name: "Music Streaming Premium Plan",
    description: "Monthly subscription for premium music access",
    status: "ACTIVE",
    billing_cycles: [{
      frequency: {
        interval_unit: "MONTH",
        interval_count: 1
      },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0, // 0 means unlimited
      pricing_scheme: {
        fixed_price: {
          value: "9.99",
          currency_code: "USD"
        }
      }
    }],
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
  });

  try {
    const response = await paypalClient.execute(request);
    return response.result;
  } catch (error: any) {
    console.error('Error creating PayPal subscription plan:', error);
    throw error;
  }
}

// Create a subscription for a user
export async function createSubscription(planId: string, userEmail: string) {
  const request = new checkoutsdk.subscriptions.SubscriptionsCreateRequest();
  request.requestBody({
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
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/subscription-success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/subscriptions`
    }
  });

  try {
    const response = await paypalClient.execute(request);
    return response.result;
  } catch (error: any) {
    console.error('Error creating PayPal subscription:', error);
    throw error;
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  const request = new checkoutsdk.subscriptions.SubscriptionsGetRequest(subscriptionId);
  
  try {
    const response = await paypalClient.execute(request);
    return response.result;
  } catch (error: any) {
    console.error('Error getting PayPal subscription:', error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string, reason: string = "User requested cancellation") {
  const request = new checkoutsdk.subscriptions.SubscriptionsCancelRequest(subscriptionId);
  request.requestBody({
    reason: reason
  });

  try {
    const response = await paypalClient.execute(request);
    return response.result;
  } catch (error: any) {
    console.error('Error cancelling PayPal subscription:', error);
    throw error;
  }
}