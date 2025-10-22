import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/request-password-reset", values);
      setIsSubmitted(true);
      toast({
        title: "Email sent",
        description: "If an account exists with that email, you'll receive password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img src="/nu-melodic-logo-new.jpg" alt="NU MELODIC" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            {isSubmitted 
              ? "Check your email for reset instructions" 
              : "Enter your email address and we'll send you a link to reset your password"}
          </CardDescription>
        </CardHeader>
        
        {!isSubmitted ? (
          <>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            data-testid="input-email"
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
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <Link href="/login">
                <Button 
                  variant="link" 
                  className="text-zinc-400 hover:text-white flex items-center gap-2"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          <CardContent className="space-y-4">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
              <p className="text-zinc-300">
                We've sent a password reset link to <strong className="text-white">{form.getValues("email")}</strong>
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                Please check your inbox and follow the instructions. The link will expire in 1 hour.
              </p>
            </div>
            
            <Link href="/login">
              <Button 
                variant="outline" 
                className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                data-testid="link-back-to-login-after-submit"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
