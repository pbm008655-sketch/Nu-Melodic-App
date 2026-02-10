import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import Player from "@/components/player";
import PayPalCheckout from "@/components/paypal-checkout";
import { Check, Crown, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const cancelPaypalSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cancel-paypal-subscription");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "PayPal Subscription Cancelled",
        description: "Your PayPal subscription has been cancelled.",
      });
    },
    onError: (error) => {
      toast({
        title: "PayPal Cancellation Error",
        description: error.message || "Failed to cancel PayPal subscription",
        variant: "destructive",
      });
    }
  });

  const handleCancelPaypalSubscription = () => {
    cancelPaypalSubscriptionMutation.mutate();
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/auth");
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    }
  });

  // Format the expiry date if it exists
  const formatExpiryDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return format(date, "MMMM do, yyyy");
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Main layout */}
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
            {user?.paypalSubscriptionId ? (
              <div className="max-w-3xl mx-auto">
                <div className="bg-zinc-900 rounded-xl p-6 mb-8 border border-zinc-800">
                  <div className="flex items-center mb-4">
                    <div className={`${user.isPremium ? 'bg-primary/20' : 'bg-zinc-800'} p-3 rounded-full mr-4`}>
                      <Crown className={`h-6 w-6 ${user.isPremium ? 'text-primary' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-heading font-bold">
                        Premium Subscription
                      </h2>
                      <p className="text-zinc-400">
                        You're subscribed to the Premium plan via PayPal
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
                      <span className="font-medium">Premium</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Payment provider</span>
                      <span className="font-medium">PayPal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Billing period</span>
                      <span className="font-medium">Annual</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Price</span>
                      <span className="font-medium">$9.99 per year</span>
                    </div>
                    {user.premiumExpiry && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Expires on</span>
                        <span className="font-medium">{formatExpiryDate(user.premiumExpiry.toString())}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Cancel subscription section */}
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-xl font-heading font-bold mb-4">Cancel Subscription</h2>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                        Cancel your premium subscription
                      </CardTitle>
                      <CardDescription>
                        You will lose access to premium features when your current subscription expires.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-zinc-400 mb-4">
                        If you cancel now, you'll continue to have access to premium features until your subscription expires.
                      </p>
                      <ul className="text-sm text-zinc-400 space-y-1">
                        <li>• Unlimited music listening</li>
                        <li>• High-quality audio</li>
                        <li>• No ads</li>
                        <li>• Offline downloads</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelPaypalSubscription}
                        disabled={cancelPaypalSubscriptionMutation.isPending}
                      >
                        {cancelPaypalSubscriptionMutation.isPending ? "Cancelling..." : "Cancel PayPal Subscription"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-heading font-bold mb-4">Upgrade to Premium</h2>
                <Card className="bg-gradient-to-br from-blue-900 to-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Get More with Premium</CardTitle>
                    <CardDescription className="text-zinc-300">
                      $9.99 for a full year - Early adopter pricing!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                        <span>Unlimited music listening (no 30-second previews)</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                        <span>High-quality audio</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                        <span>No advertisements</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="text-primary mt-1 mr-3 h-4 w-4 flex-shrink-0" />
                        <span>Download tracks for offline listening</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter className="space-y-4">
                    <div className="w-full">
                      <PayPalCheckout />
                    </div>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>

          {/* Delete Account Section */}
          <div className="p-4 md:p-8 mt-8">
            <div className="max-w-3xl mx-auto">
              <Separator className="bg-zinc-800 mb-8" />
              <h2 className="text-xl font-heading font-bold mb-4 text-destructive">Danger Zone</h2>
              <Card className="bg-zinc-900 border-red-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-destructive">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete Account
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400 text-sm">
                    This will permanently remove your account, playlists, favorites, listening history, and all personal data.
                    {user?.paypalSubscriptionId && " Your active subscription will also be affected."}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will be deleted forever.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-400 mb-3">
              Type <span className="font-bold text-white">DELETE</span> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              disabled={deleteConfirmText !== "DELETE" || deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Player />
    </div>
  );
}