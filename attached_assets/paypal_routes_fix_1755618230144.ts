// server/routes.ts - PayPal Route Integration
// Add these routes to your existing Express routes

import { 
  getPayPalAccessToken, 
  getPayPalSubscription, 
  cancelPayPalSubscription, 
  verifyPayPalWebhook,
  initializePayPalPlans 
} from './paypal.js';
import * as storage from './storage.js';

// Initialize PayPal plans on server start (call this once)
let PAYPAL_PLAN_ID: string | null = null;

async function initPayPal() {
  try {
    PAYPAL_PLAN_ID = await initializePayPalPlans();
    console.log('PayPal integration ready with plan ID:', PAYPAL_PLAN_ID);
  } catch (error) {
    console.error('PayPal initialization failed:', error);
  }
}

// Call this when your server starts
initPayPal();

// PayPal Routes
// ==============

/**
 * Get PayPal subscription plan ID for frontend
 */
app.get('/api/paypal/plan-id', (req, res) => {
  if (!PAYPAL_PLAN_ID) {
    return res.status(500).json({ error: 'PayPal plan not initialized' });
  }
  
  res.json({ planId: PAYPAL_PLAN_ID });
});

/**
 * Handle successful PayPal subscription creation
 */
app.post('/api/paypal/subscription-success', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { subscriptionId, orderID } = req.body;

  if (!subscriptionId) {
    return res.status(400).json({ error: 'Missing subscription ID' });
  }

  try {
    // Verify the subscription with PayPal
    const subscription = await getPayPalSubscription(subscriptionId);
    
    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({ 
        error: 'Subscription is not active', 
        status: subscription.status 
      });
    }

    // Update user to premium status
    const premiumExpiry = new Date();
    premiumExpiry.setFullYear(premiumExpiry.getFullYear() + 1); // 1 year from now

    await storage.updateUserPremium(req.user.id, {
      isPremium: true,
      premiumExpiry: premiumExpiry,
      paypalSubscriptionId: subscriptionId,
    });

    console.log(`User ${req.user.id} upgraded to premium via PayPal subscription ${subscriptionId}`);

    res.json({ 
      success: true, 
      subscription: {
        id: subscriptionId,
        status: subscription.status,
        expiryDate: premiumExpiry.toISOString(),
      }
    });

  } catch (error: any) {
    console.error('PayPal subscription verification failed:', error);
    res.status(500).json({ 
      error: 'Failed to verify PayPal subscription',
      details: error.message 
    });
  }
});

/**
 * Cancel PayPal subscription
 */
app.post('/api/paypal/cancel-subscription', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await storage.getUserById(req.user.id);
  if (!user?.paypalSubscriptionId) {
    return res.status(400).json({ error: 'No PayPal subscription found' });
  }

  try {
    // Cancel with PayPal
    const cancelled = await cancelPayPalSubscription(
      user.paypalSubscriptionId, 
      'User requested cancellation via MeloStream'
    );

    if (cancelled) {
      // Update user in database (keep premium until current period ends)
      await storage.updateUserPayPalSubscription(req.user.id, null);
      
      console.log(`PayPal subscription ${user.paypalSubscriptionId} cancelled for user ${req.user.id}`);
      
      res.json({ 
        success: true, 
        message: 'Subscription cancelled. Premium access continues until current billing period ends.' 
      });
    } else {
      res.status(500).json({ error: 'Failed to cancel PayPal subscription' });
    }

  } catch (error: any) {
    console.error('PayPal subscription cancellation failed:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    });
  }
});

/**
 * PayPal Webhook Handler (for subscription events)
 */
app.post('/api/paypal/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID; // You need to set this
  
  // Verify webhook signature in production
  if (process.env.NODE_ENV === 'production' && webhookId) {
    const isValid = await verifyPayPalWebhook(req.headers, req.body, webhookId);
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  const event = JSON.parse(req.body);
  console.log('PayPal Webhook Event:', event.event_type);

  try {
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(event);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event);
        break;
        
      default:
        console.log('Unhandled PayPal webhook event:', event.event_type);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook Event Handlers
// ======================

async function handleSubscriptionActivated(event: any) {
  const subscriptionId = event.resource.id;
  console.log('PayPal subscription activated:', subscriptionId);
  
  // Find user by subscription ID and ensure they're premium
  const user = await storage.getUserByPayPalSubscriptionId(subscriptionId);
  if (user && !user.isPremium) {
    const premiumExpiry = new Date();
    premiumExpiry.setFullYear(premiumExpiry.getFullYear() + 1);
    
    await storage.updateUserPremium(user.id, {
      isPremium: true,
      premiumExpiry: premiumExpiry,
    });
  }
}

async function handleSubscriptionCancelled(event: any) {
  const subscriptionId = event.resource.id;
  console.log('PayPal subscription cancelled:', subscriptionId);
  
  // Find user and remove PayPal subscription ID (but keep premium until expiry)
  const user = await storage.getUserByPayPalSubscriptionId(subscriptionId);
  if (user) {
    await storage.updateUserPayPalSubscription(user.id, null);
  }
}

async function handleSubscriptionSuspended(event: any) {
  const subscriptionId = event.resource.id;
  console.log('PayPal subscription suspended:', subscriptionId);
  
  // Could implement grace period or immediate suspension based on business rules
  const user = await storage.getUserByPayPalSubscriptionId(subscriptionId);
  if (user) {
    // For now, just log. You might want to send user a notification
    console.log(`User ${user.id} PayPal subscription suspended`);
  }
}

async function handlePaymentFailed(event: any) {
  const subscriptionId = event.resource.id;
  console.log('PayPal payment failed for subscription:', subscriptionId);
  
  // Could implement retry logic or user notification
  const user = await storage.getUserByPayPalSubscriptionId(subscriptionId);
  if (user) {
    console.log(`Payment failed for user ${user.id}`);
    // Send email notification, etc.
  }
}

async function handlePaymentCompleted(event: any) {
  const billingAgreementId = event.resource.billing_agreement_id;
  console.log('PayPal payment completed for subscription:', billingAgreementId);
  
  // Extend premium subscription period
  const user = await storage.getUserByPayPalSubscriptionId(billingAgreementId);
  if (user) {
    const newExpiry = new Date(user.premiumExpiry || new Date());
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    
    await storage.updateUserPremium(user.id, {
      isPremium: true,
      premiumExpiry: newExpiry,
    });
    
    console.log(`Extended premium for user ${user.id} until ${newExpiry}`);
  }
}

/**
 * Get current user's PayPal subscription status
 */
app.get('/api/paypal/subscription-status', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await storage.getUserById(req.user.id);
  if (!user?.paypalSubscriptionId) {
    return res.json({ hasSubscription: false });
  }

  try {
    const subscription = await getPayPalSubscription(user.paypalSubscriptionId);
    
    res.json({
      hasSubscription: true,
      subscriptionId: user.paypalSubscriptionId,
      status: subscription.status,
      nextBillingTime: subscription.billing_info?.next_billing_time,
      lastPaymentAmount: subscription.billing_info?.last_payment?.amount,
    });

  } catch (error: any) {
    console.error('Failed to fetch PayPal subscription status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription status',
      details: error.message 
    });
  }
});