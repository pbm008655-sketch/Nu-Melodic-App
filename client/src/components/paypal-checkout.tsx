import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface PayPalCheckoutProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalCheckout({ amount, onSuccess, onError }: PayPalCheckoutProps) {
  const { toast } = useToast();
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPayPalScript = () => {
      if (window.paypal) {
        renderPayPalButton();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=sandbox&currency=USD&intent=subscription';
      script.onload = () => {
        setIsLoaded(true);
        renderPayPalButton();
      };
      script.onerror = () => {
        toast({
          title: "PayPal Loading Error",
          description: "Failed to load PayPal. Please refresh the page.",
          variant: "destructive",
        });
        onError?.("Failed to load PayPal SDK");
      };
      document.head.appendChild(script);
    };

    const renderPayPalButton = () => {
      if (!window.paypal || !paypalRef.current) return;

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'subscribe'
        },
        createSubscription: function(data: any, actions: any) {
          return actions.subscription.create({
            'plan_id': 'P-1234567890', // This would be your PayPal plan ID
            'subscriber': {
              'name': {
                'given_name': 'Music',
                'surname': 'Lover'
              }
            }
          });
        },
        onApprove: async function(data: any, actions: any) {
          try {
            // Call your backend to handle the subscription
            const response = await fetch('/api/paypal-subscription-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                subscriptionID: data.subscriptionID,
                orderID: data.orderID
              })
            });

            if (response.ok) {
              queryClient.invalidateQueries({ queryKey: ["/api/user"] });
              toast({
                title: "Subscription Activated!",
                description: "Welcome to Premium! You now have unlimited access.",
              });
              onSuccess?.();
            } else {
              throw new Error('Backend processing failed');
            }
          } catch (error) {
            console.error('PayPal subscription error:', error);
            toast({
              title: "Subscription Error", 
              description: "Failed to activate subscription. Please contact support.",
              variant: "destructive",
            });
            onError?.(error);
          }
        },
        onError: function(err: any) {
          console.error('PayPal error:', err);
          toast({
            title: "Payment Error",
            description: "There was an issue processing your payment. Please try again.",
            variant: "destructive",
          });
          onError?.(err);
        }
      }).render(paypalRef.current);
    };

    loadPayPalScript();
  }, [amount, onSuccess, onError, toast]);

  return (
    <div className="paypal-checkout-container">
      <div ref={paypalRef} className="paypal-button-container" />
      {!isLoaded && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
          <span className="ml-2 text-zinc-400">Loading PayPal...</span>
        </div>
      )}
    </div>
  );
}