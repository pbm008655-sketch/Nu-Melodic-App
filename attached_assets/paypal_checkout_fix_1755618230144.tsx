import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';

// PayPal SDK types
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => { render: (selector: string) => void };
    };
  }
}

export default function PayPalCheckout() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPayPalLoaded, setIsPayPalLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch PayPal Plan ID from server
  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ['/api/paypal/plan-id'],
    queryFn: async () => {
      const res = await fetch('/api/paypal/plan-id');
      if (!res.ok) throw new Error('Could not fetch PayPal plan.');
      return res.json();
    },
    enabled: !!user && !user.isPremium,
  });

  // Get subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/paypal/subscription-status'],
     queryFn: async () => {
      const res = await fetch('/api/paypal/subscription-status');
      if (!res.ok) throw new Error('Could not fetch subscription status.');
      return res.json();
    },
    enabled: !!user?.isPremium,
  });

  // Subscription success mutation
  const subscriptionMutation = useMutation({
    mutationFn: async (data: { subscriptionId: string; orderID?: string }) => {
      const response = await fetch('/api/paypal/subscription-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Subscription failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Welcome to MeloStream Premium! You now have unlimited access.',
      });
      // Invalidate queries to refetch user and subscription data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/paypal/subscription-status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Subscription Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsProcessing(false);
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Cancellation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Subscription Cancelled',
        description: data.message,
      });
       // Invalidate queries to refetch user and subscription data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/paypal/subscription-status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Load PayPal SDK
  useEffect(() => {
    if (!planData?.planId || isPayPalLoaded || user?.isPremium) return;

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.async = true;
    
    script.onload = () => setIsPayPalLoaded(true);
    
    script.onerror = () => {
      toast({
        title: 'PayPal Loading Error',
        description: 'Failed to load PayPal SDK. Please refresh and try again.',
        variant: 'destructive',
      });
    };

    document.body.appendChild(script);

    return () => {
      // Check if script is still in the body before trying to remove
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [planData?.planId, isPayPalLoaded, toast, user?.isPremium]);

  // Initialize PayPal Buttons
  useEffect(() => {
    if (!isPayPalLoaded || !window.paypal || !planData?.planId) return;

    const paypalButtonContainer = document.getElementById('paypal-button-container');
    if (paypalButtonContainer && paypalButtonContainer.childElementCount === 0) {
      try {
        window.paypal.Buttons({
          createSubscription: (data: any, actions: any) => {
            return actions.subscription.create({
              'plan_id': planData.planId,
            });
          },
          onApprove: async (data: any, actions: any) => {
            setIsProcessing(true);
            toast({ title: 'Processing Subscription...', description: 'Please wait while we confirm your payment.' });
            subscriptionMutation.mutate({
              subscriptionId: data.subscriptionID,
              orderID: data.orderID,
            });
          },
          onError: (err: any) => {
            console.error('PayPal Button Error:', err);
            toast({
              title: 'Payment Error',
              description: 'An error occurred with PayPal. Please try again.',
              variant: 'destructive',
            });
            setIsProcessing(false);
          },
        }).render('#paypal-button-container');
      } catch (error) {
        console.error("Failed to render PayPal Buttons:", error);
      }
    }
  }, [isPayPalLoaded, planData?.planId, subscriptionMutation, toast]);

  if (user?.isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal Subscription</CardTitle>
          <CardDescription>Manage your MeloStream Premium subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading subscription status...</span>
            </div>
          ) : subscriptionStatus?.hasSubscription ? (
            <div>
              <div className="flex items-center text-green-600 mb-4">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p>Your subscription is active.</p>
              </div>
              <p className="text-sm text-gray-500 mb-1">Status: <span className="font-medium text-black">{subscriptionStatus.status}</span></p>
              <p className="text-sm text-gray-500">Subscription ID: <span className="font-medium text-black">{subscriptionStatus.subscriptionId}</span></p>
              <Button
                variant="destructive"
                className="w-full mt-6"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Cancel Subscription
              </Button>
            </div>
          ) : (
             <div className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                <p>Your Premium access is active (via another payment method).</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade with PayPal</CardTitle>
        [cite_start]<CardDescription>Get unlimited, ad-free listening for $25/year. [cite: 31]</CardDescription>
      </CardHeader>
      <CardContent>
        {planLoading || isProcessing ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg">
              {isProcessing ? 'Finalizing your subscription...' : 'Preparing checkout...'}
            </p>
          </div>
        ) : (
          <div id="paypal-button-container" className="min-h-[100px]">
            {!isPayPalLoaded && (
               <div className="flex justify-center items-center h-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg">Loading PayPal...</p>
               </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}