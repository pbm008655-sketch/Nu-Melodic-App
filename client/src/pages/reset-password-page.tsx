import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2 } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    
    if (!tokenFromUrl) {
      setIsValidToken(false);
      return;
    }
    
    setToken(tokenFromUrl);
    
    async function verifyToken() {
      try {
        const response = await fetch(`/api/auth/verify-reset-token/${tokenFromUrl}`);
        const data = await response.json();
        setIsValidToken(data.valid);
        
        if (!data.valid) {
          toast({
            title: "Invalid or Expired Link",
            description: data.error || "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setIsValidToken(false);
        toast({
          title: "Error",
          description: "Failed to verify reset link",
          variant: "destructive",
        });
      }
    }
    
    verifyToken();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) return;
    
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      });
      
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now login with your new password.",
      });
      
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-zinc-400 mt-4">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <img src="/nu-melodic-logo-new.jpg" alt="NU MELODIC" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-center text-zinc-400">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 text-center mb-4">
              Password reset links expire after 1 hour for security reasons.
            </p>
            <Link href="/forgot-password">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
                data-testid="button-request-new-link"
              >
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button 
                variant="link" 
                className="text-zinc-400 hover:text-white"
                data-testid="link-back-to-login"
              >
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">
              Password Reset Successful
            </CardTitle>
            <CardDescription className="text-center text-zinc-400">
              You can now login with your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 text-center mb-4">
              Redirecting you to login page...
            </p>
            <Link href="/login">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
                data-testid="button-go-to-login"
              >
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img src="/nu-melodic-logo-new.jpg" alt="NU MELODIC" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                        data-testid="input-new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                        data-testid="input-confirm-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Link href="/login">
            <Button 
              variant="link" 
              className="text-zinc-400 hover:text-white"
              data-testid="link-back-to-login"
            >
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
