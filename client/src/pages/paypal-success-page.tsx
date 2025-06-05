import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import Player from "@/components/player";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PayPalSuccessPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const payerID = urlParams.get('PayerID');

    if (token && payerID) {
      capturePayment(token);
    } else {
      setPaymentStatus('error');
      setIsProcessing(false);
    }
  }, []);

  const capturePayment = async (orderID: string) => {
    try {
      const response = await fetch(`/api/paypal-rest/capture/${orderID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.status === 'COMPLETED') {
        setPaymentStatus('success');
        toast({
          title: "Payment Successful",
          description: "Your subscription has been activated!",
        });
      } else {
        setPaymentStatus('error');
        toast({
          title: "Payment Failed",
          description: "There was an issue processing your payment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment capture error:', error);
      setPaymentStatus('error');
      toast({
        title: "Payment Error",
        description: "Failed to process payment completion.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileMenu />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {isProcessing ? (
                    <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                  ) : paymentStatus === 'success' ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl">
                      ✗
                    </div>
                  )}
                </div>
                
                <CardTitle className="text-2xl">
                  {isProcessing ? "Processing Payment..." : 
                   paymentStatus === 'success' ? "Payment Successful!" :
                   "Payment Failed"}
                </CardTitle>
                
                <CardDescription>
                  {isProcessing ? "Please wait while we confirm your payment." :
                   paymentStatus === 'success' ? "Your subscription has been activated and you can now enjoy premium features." :
                   "There was an issue processing your payment. Please try again."}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="text-center space-y-4">
                {!isProcessing && (
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setLocation('/')}
                      className="w-full"
                    >
                      {paymentStatus === 'success' ? "Continue to Music" : "Return to Home"}
                    </Button>
                    
                    {paymentStatus === 'error' && (
                      <Button 
                        onClick={() => setLocation('/paypal-subscription')}
                        variant="outline"
                        className="w-full"
                      >
                        Try Payment Again
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Player />
    </div>
  );
}