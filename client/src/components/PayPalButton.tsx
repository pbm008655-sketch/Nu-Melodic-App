// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    console.log("PayPal onApprove", data);
    try {
      const orderData = await captureOrder(data.orderId);
      console.log("PayPal capture result", orderData);
      
      if (orderData.status === 'COMPLETED') {
        alert('Payment successful! Your subscription is now active.');
        window.location.href = '/subscription-success';
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      alert('Payment processing failed. Please try again.');
    }
  };

  const onCancel = async (data: any) => {
    console.log("PayPal onCancel", data);
    alert('Payment was cancelled. You can try again anytime.');
  };

  const onError = async (data: any) => {
    console.log("PayPal onError", data);
    alert('There was an error processing your payment. Please try again.');
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = "https://www.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, [amount, currency, intent]); // Re-initialize when props change
  const initPayPal = async () => {
    try {
      const clientToken: string = await fetch("/paypal/setup")
        .then((res) => res.json())
        .then((data) => {
          return data.clientToken;
        });
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
            sdkInstance.createPayPalOneTimePaymentSession({
              onApprove,
              onCancel,
              onError,
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay',
                tagline: false
              }
            });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { 
              paymentFlow: "auto"
            },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error("PayPal checkout error:", e);
          alert('Unable to start PayPal checkout. Please try again.');
        }
      };

      const paypalButton = document.getElementById("paypal-button");

      if (paypalButton) {
        // Remove any existing listeners before adding new one
        paypalButton.onclick = null;
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error(e);
    }
  };

  return <paypal-button id="paypal-button"></paypal-button>;
}
// <END_EXACT_CODE>