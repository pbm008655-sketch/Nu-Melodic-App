import { Request, Response } from "express";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PayPal REST API credentials");
}

const PAYPAL_BASE_URL = process.env.NODE_ENV === "production" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

export async function createRestOrder(req: Request, res: Response) {
  try {
    const { amount, currency = 'USD' } = req.body;
    
    const accessToken = await getAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        }
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "Music Streaming Platform",
            locale: "en-US",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${req.protocol}://${req.get('host')}/subscription-success`,
            cancel_url: `${req.protocol}://${req.get('host')}/paypal-subscription`
          }
        }
      }
    };
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const order = await response.json();
    res.json(order);
  } catch (error: any) {
    console.error('PayPal REST order creation error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function captureRestOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const captureData = await response.json();
    res.json(captureData);
  } catch (error: any) {
    console.error('PayPal REST capture error:', error);
    res.status(500).json({ error: error.message });
  }
}