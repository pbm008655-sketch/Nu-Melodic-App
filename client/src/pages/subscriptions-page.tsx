import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import Player from "@/components/player";
import { Check, Crown, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const subscribeMutation = useMutation({
    mutationFn: async (data?: { plan: string }) => {
      setIsProcessing(true);
      const res = await apiRequest("POST", "/api/create-subscription", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsProcessing(false);
      
      if (data.success) {
        toast({
          title: "Subscription Successful",
          description: "Your premium subscription has been activated!",
        });
      } else {
        // Redirect to checkout page if payment is needed
        window.location.href = "/checkout";
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cancel-subscription", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubscribe = () => {
    subscribeMutation.mutate({ plan: 'premium' });
  };
  
  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };
  
  // Format the expiry date if it exists
  const formatExpiryDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return format(date, "MMMM do, yyyy");
  };
  
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto pb-24">
          <MobileMenu />
          
          {/* Header */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center">
              <Crown className="h-6 w-6 mr-2 text-primary" /> 
              Subscription
            </h1>
          </div>
          
          {/* Subscription Info */}
          <div className="p-4 md:p-8">
            {user?.stripeSubscriptionId ? (
              <div className="max-w-3xl mx-auto">
                <div className="bg-zinc-900 rounded-xl p-6 mb-8 border border-zinc-800">
                  <div className="flex items-center mb-4">
                    <div className={`${user.isPremium ? 'bg-primary/20' : 'bg-zinc-800'} p-3 rounded-full mr-4`}>
                      <Crown className={`h-6 w-6 ${user.isPremium ? 'text-primary' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-heading font-bold">
                        {user.isPremium ? 'Premium' : 'Basic'} Subscription
                      </h2>
                      <p className="text-zinc-400">
                        You're subscribed to the {user.isPremium ? 'Premium' : 'Basic'} plan
                      </p>
                    </div>
                    <div className="ml-auto bg-primary/20 px-3 py-1 rounded-full">
                      <span className="text-primary text-sm font-medium">Active</span>
                    </div>
                  </div>
                  
                  <Separator className="bg-zinc-800 my-4" />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Subscription type</span>
                      <span className="font-medium">{user.isPremium ? 'Premium' : 'Basic'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Billing period</span>
                      <span className="font-medium">{user.isPremium ? 'Annual' : 'Monthly'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Price</span>
                      <span className="font-medium">
                        {user.isPremium ? '$25.00 per year' : '$1.75 per month'}
                      </span>
                    </div>
                    {user.premiumExpiry && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">
                          {user.isPremium ? 'Expires on' : 'Next billing date'}
                        </span>
                        <span className="font-medium">{formatExpiryDate(user.premiumExpiry.toString())}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Upgrade section for Basic users */}
                {!user.isPremium && (
                  <div className="max-w-3xl mx-auto mb-8">
                    <h2 className="text-xl font-heading font-bold mb-4">Upgrade to Premium</h2>
                    <Card className="bg-gradient-to-br from-blue-900 to-zinc-900 border-zinc-800">
                      <CardHeader>
                        <CardTitle>Get More with Premium</CardTitle>
                        <CardDescription className="text-zinc-300">
                          $25.00 for a full year
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                            <span>Ad-free music listening</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                            <span>Unlimited skips</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                            <span>High-quality audio</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                            <span>Offline listening</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 text-black"
                          onClick={handleSubscribe}
                          disabled={isProcessing || subscribeMutation.isPending}
                        >
                          {isProcessing || subscribeMutation.isPending ? "Processing..." : "Upgrade to Premium"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                )}
                
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-xl font-heading font-bold mb-4">Cancel Subscription</h2>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                        Cancel your {user.isPremium ? 'premium' : 'basic'} subscription
                      </CardTitle>
                      <CardDescription>
                        You will lose access to {user.isPremium ? 'premium' : 'basic'} features 
                        {user.isPremium ? ' when your current subscription expires.' : ' at the end of your current billing period.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-zinc-400 mb-4">
                        By cancelling, you'll lose these benefits:
                      </p>
                      <ul className="space-y-2">
                        {user.isPremium ? (
                          <>
                            <li className="flex items-start">
                              <XCircle className="h-5 w-5 mr-2 text-destructive flex-shrink-0" />
                              <span>Ad-free music listening</span>
                            </li>
                            <li className="flex items-start">
                              <XCircle className="h-5 w-5 mr-2 text-destructive flex-shrink-0" />
                              <span>Unlimited skips</span>
                            </li>
                            <li className="flex items-start">
                              <XCircle className="h-5 w-5 mr-2 text-destructive flex-shrink-0" />
                              <span>High-quality audio</span>
                            </li>
                            <li className="flex items-start">
                              <XCircle className="h-5 w-5 mr-2 text-destructive flex-shrink-0" />
                              <span>Offline listening</span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start">
                              <XCircle className="h-5 w-5 mr-2 text-destructive flex-shrink-0" />
                              <span>Ad-supported listening</span>
                            </li>
                            <li className="flex items-start">
                              <XCircle className="h-5 w-5 mr-2 text-destructive flex-shrink-0" />
                              <span>Limited skips</span>
                            </li>
                            <li className="flex items-start">
                              <XCircle className="h-5 w-5 mr-2 text-destructive flex-shrink-0" />
                              <span>Basic audio quality</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelSubscription}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-heading font-bold mb-6">Choose Your Plan</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Plan */}
                  <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                    <CardHeader>
                      <CardTitle>Basic</CardTitle>
                      <CardDescription>$1.75 / month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>Ad-supported listening</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>Limited skips</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>Basic audio quality</span>
                        </li>
                        <li className="flex items-start text-zinc-500">
                          <XCircle className="text-zinc-600 mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>No offline listening</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => subscribeMutation.mutate({ plan: 'basic' })}
                        disabled={isProcessing || subscribeMutation.isPending}
                      >
                        {isProcessing || subscribeMutation.isPending ? "Processing..." : "Subscribe to Basic"}
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Premium Plan */}
                  <Card className="bg-gradient-to-br from-blue-900 to-zinc-900 border-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold py-1 px-3 rounded-bl-lg">
                      RECOMMENDED
                    </div>
                    
                    <CardHeader>
                      <CardTitle>Premium</CardTitle>
                      <CardDescription className="text-zinc-300">
                        $25.00 / year
                      </CardDescription>
                      <p className="text-zinc-400 text-sm">One-time payment for 12 months</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>Ad-free music listening</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>Unlimited skips</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>High-quality audio</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>Download music for offline listening</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                          <span>Exclusive content access</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-black"
                        onClick={handleSubscribe}
                        disabled={isProcessing || subscribeMutation.isPending}
                      >
                        {isProcessing || subscribeMutation.isPending ? (
                          "Processing..."
                        ) : (
                          "Get Premium Access"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <p className="text-zinc-400 text-sm text-center mt-6">
                  Basic plan renews monthly. Premium plan is a one-time payment for 12 months of access.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Player />
    </div>
  );
}
