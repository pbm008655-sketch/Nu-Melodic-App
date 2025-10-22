import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Music, Check, Headphones, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

// Extend the insert schema with password confirmation
const registerSchema = insertUserSchema.extend({
  passwordConfirm: z.string().min(6).max(100),
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords do not match",
  path: ["passwordConfirm"],
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    // Remove passwordConfirm as it's not part of the API
    const { passwordConfirm, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Return after all the hook calls to avoid violating rules of hooks
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center p-8">
        <div className="max-w-lg text-center md:text-left">
          <div className="flex justify-center md:justify-start mb-6">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Music className="h-8 w-8 text-black" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-white">
            Your Personal Music Streaming Experience
          </h1>
          <p className="text-zinc-300 text-lg mb-8">
            Subscribe to MeloStream for unlimited access to original music and exclusive content.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mt-1 mr-3 text-primary">
                <Check />
              </div>
              <div>
                <h3 className="font-medium text-white">Premium Quality Audio</h3>
                <p className="text-zinc-400 text-sm">Enjoy crystal clear sound with our high-quality audio streams</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mt-1 mr-3 text-primary">
                <Check />
              </div>
              <div>
                <h3 className="font-medium text-white">Create Custom Playlists</h3>
                <p className="text-zinc-400 text-sm">Organize your favorite tracks into personal playlists</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mt-1 mr-3 text-primary">
                <Check />
              </div>
              <div>
                <h3 className="font-medium text-white">Exclusive Content</h3>
                <p className="text-zinc-400 text-sm">Access premium content and new releases before anyone else</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-heading">
              {activeTab === "login" ? "Sign in to your account" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {activeTab === "login"
                ? "Enter your credentials to access your account"
                : "Fill in the form to create your MeloStream account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username or Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username or email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
                <div className="mt-6 pt-4 border-t border-zinc-700 text-center">
                  <Link href="/forgot-password">
                    <a className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer">
                      Forgot your password?
                    </a>
                  </Link>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Create a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="passwordConfirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-6 border-t border-zinc-800 text-center text-zinc-400 text-sm">
              <p>
                {activeTab === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Button 
                  variant="link" 
                  className="p-0 text-primary h-auto" 
                  onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
                >
                  {activeTab === "login" ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
