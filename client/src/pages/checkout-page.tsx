import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/subscription-success`,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setPaymentMessage(error.message || "An unexpected error occurred.");
      toast({
        title: "Payment failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } else {
      setPaymentMessage("An unexpected error occurred.");
      toast({
        title: "Payment error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <PaymentElement />
      
      {paymentMessage && (
        <div className="text-sm text-red-500 mt-2">{paymentMessage}</div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
};

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // One-time payment amount in dollars
  const paymentAmount = 19.99;

  useEffect(() => {
    if (!user) return;

    // Create PaymentIntent as soon as the page loads
    const fetchPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount: paymentAmount
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error fetching payment intent:', err);
        setError('Could not initialize payment. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [user]);

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0055FF',
    },
  };
  
  // Only create the options when clientSecret is available
  const options = clientSecret ? {
    clientSecret,
    appearance,
  } : { appearance };

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Purchase</CardTitle>
          <CardDescription>
            Secure payment processing by Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 p-4 bg-slate-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Premium Access</span>
              <span className="text-sm font-bold">${paymentAmount.toFixed(2)}</span>
            </div>
            <div className="text-xs text-slate-500">
              Get full access to all premium tracks and features
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : clientSecret && stripePromise ? (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          ) : (
            <div className="p-6 text-center text-red-500">Failed to initialize payment system.</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-slate-500">
          Your payment information is processed securely by Stripe.
        </CardFooter>
      </Card>
    </div>
  );
}