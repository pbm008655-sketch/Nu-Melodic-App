import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PayPalRestButtonProps {
  amount: string;
  currency?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PayPalRestButton({
  amount,
  currency = "USD",
  onSuccess,
  onError
}: PayPalRestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // Create PayPal order using REST API
      const createResponse = await fetch('/api/paypal-rest/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency
        })
      });

      const orderData = await createResponse.json();
      
      if (!createResponse.ok) {
        throw new Error(orderData.error || 'Failed to create PayPal order');
      }

      // Find the approval URL
      const approvalUrl = orderData.links?.find((link: any) => 
        link.rel === 'payer-action' || link.rel === 'approve'
      )?.href;

      if (!approvalUrl) {
        throw new Error('No approval URL found in PayPal response');
      }

      // Redirect to PayPal for payment approval
      window.location.href = approvalUrl;

    } catch (error: any) {
      console.error('PayPal REST payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process PayPal payment",
        variant: "destructive",
      });
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
    >
      {isLoading ? "Processing..." : `Pay $${amount} with PayPal Account`}
    </Button>
  );
}