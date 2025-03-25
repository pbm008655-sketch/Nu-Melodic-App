import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, MusicIcon, HeadphonesIcon, Home } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  // Refresh user data on load to get updated subscription status
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 p-4">
      <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Payment Successful</CardTitle>
          <CardDescription className="text-zinc-400">
            Your premium subscription is now active
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-zinc-300 space-y-4">
          <p>
            Thank you for subscribing! You now have full access to all premium features and content.
          </p>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex flex-col items-center p-3 bg-zinc-800 rounded-lg">
              <MusicIcon className="h-6 w-6 mb-2 text-primary" />
              <span className="text-sm">Unlimited Music</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-zinc-800 rounded-lg">
              <HeadphonesIcon className="h-6 w-6 mb-2 text-primary" />
              <span className="text-sm">Premium Quality</span>
            </div>
          </div>
          
          <p className="text-sm text-zinc-400">
            Your subscription will automatically renew. You can manage your subscription in your account settings at any time.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full bg-primary text-black hover:bg-primary/90"
            onClick={() => setLocation('/')}
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setLocation('/subscriptions')}
          >
            Manage Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}