import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import Player from "@/components/player";
import PayPalButton from "@/components/PayPalButton";
import { Crown, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function PayPalSubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium">("premium");

  const plans = {
    basic: {
      name: "Basic Plan",
      price: "1.75",
      period: "month",
      features: [
        "Ad-supported listening",
        "Standard audio quality",
        "Limited skips",
        "Basic playlists"
      ]
    },
    premium: {
      name: "Premium Plan", 
      price: "25.00",
      period: "year",
      features: [
        "Ad-free music listening",
        "Unlimited skips",
        "High-quality audio",
        "Offline listening",
        "Priority customer support"
      ]
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: `Your ${plans[selectedPlan].name} subscription has been activated!`,
    });
    
    // In a real implementation, you would update the user's subscription status
    // and redirect them to a success page
    window.location.href = "/subscription-success";
  };

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto pb-24">
        <MobileMenu />
        
        {/* Header */}
        <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center">
            <Crown className="h-6 w-6 mr-2 text-primary" /> 
            PayPal Subscription
          </h1>
          <p className="text-zinc-400 mt-2">Choose your plan and pay securely with PayPal</p>
        </div>
        
        {/* Subscription Plans */}
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Plan Selection */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {Object.entries(plans).map(([planKey, plan]) => (
                <Card 
                  key={planKey}
                  className={`cursor-pointer transition-all ${
                    selectedPlan === planKey 
                      ? 'border-primary bg-zinc-900/50' 
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                  onClick={() => setSelectedPlan(planKey as "basic" | "premium")}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {planKey === "premium" && <Crown className="h-5 w-5 mr-2 text-primary" />}
                        {plan.name}
                      </CardTitle>
                      {selectedPlan === planKey && (
                        <Badge className="bg-primary text-black">Selected</Badge>
                      )}
                    </div>
                    <CardDescription>
                      <span className="text-2xl font-bold text-white">${plan.price}</span>
                      <span className="text-zinc-400">/{plan.period}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="bg-zinc-800 my-8" />

            {/* Payment Section */}
            <div className="max-w-md mx-auto">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>
                    You're subscribing to the {plans[selectedPlan].name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Plan</span>
                      <span className="font-medium">{plans[selectedPlan].name}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-zinc-400">Billing Period</span>
                      <span className="font-medium">
                        {selectedPlan === "premium" ? "Annual" : "Monthly"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold">
                      <span>Total</span>
                      <span>${plans[selectedPlan].price}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="w-full">
                    <PayPalButton
                      amount={plans[selectedPlan].price}
                      currency="USD"
                      intent="CAPTURE"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-500">
                      Secure payment processing by PayPal
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="mt-8 text-center text-zinc-400 text-sm">
              <p>
                Your subscription will auto-renew. You can cancel anytime from your account settings.
              </p>
              <p className="mt-2">
                Questions? Contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Player />
    </div>
  );
}