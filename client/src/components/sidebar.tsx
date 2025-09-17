import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Home, Search, Heart, PlusCircle, Music, BarChart, Settings, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Playlist, insertPlaylistSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  const form = useForm<z.infer<typeof insertPlaylistSchema>>({
    resolver: zodResolver(insertPlaylistSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertPlaylistSchema>) => {
      return await apiRequest("POST", "/api/playlists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({
        title: "Playlist created",
        description: "Your new playlist has been created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertPlaylistSchema>) => {
    createPlaylistMutation.mutate(data);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="hidden md:flex flex-col w-60 bg-zinc-900 text-white h-screen">
      {/* Header Section - Fixed */}
      <div className="p-6 flex-shrink-0">
        <h1 className="font-heading font-bold text-2xl mb-8 flex items-center">
          <img src="/nu-melodic-logo.jpg" alt="NU MELODIC" className="h-14 w-auto mr-3" />
        </h1>
        
        <nav>
          <ul className="space-y-4">
            <li>
              <Link href="/">
                <div className={`flex items-center ${isActive("/") ? "text-primary" : "text-zinc-300 hover:text-white"} transition-colors cursor-pointer`}>
                  <Home className="h-5 w-5 mr-3" />
                  <span>Home</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="#">
                <div className="flex items-center text-zinc-300 hover:text-white transition-colors cursor-pointer">
                  <Search className="h-5 w-5 mr-3" />
                  <span>Search</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/favorites">
                <div className={`flex items-center ${isActive("/favorites") ? "text-primary" : "text-zinc-300 hover:text-white"} transition-colors cursor-pointer`}>
                  <Heart className="h-5 w-5 mr-3" />
                  <span>Your Favourites</span>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/analytics">
                <div className={`flex items-center ${isActive("/analytics") ? "text-primary" : "text-zinc-300 hover:text-white"} transition-colors cursor-pointer`}>
                  <BarChart className="h-5 w-5 mr-3" />
                  <span>Analytics</span>
                </div>
              </Link>
            </li>
            {user?.id === 1 && (
              <li>
                <Link href="/admin">
                  <div className={`flex items-center ${isActive("/admin") ? "text-primary" : "text-zinc-300 hover:text-white"} transition-colors cursor-pointer`}>
                    <Settings className="h-5 w-5 mr-3" />
                    <span>Admin</span>
                  </div>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Scrollable Playlists Section - Flexible */}
      <div className="flex-1 px-6 min-h-0">
        <div className="border-t border-zinc-800 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs uppercase text-zinc-500 tracking-wider">Your Playlists</h2>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-zinc-400 hover:text-white">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
          
          <ScrollArea className="h-full">
            <ul className="space-y-3 pr-4">
              {playlists?.map((playlist) => (
                <li key={playlist.id}>
                  <Link href={`/playlist/${playlist.id}`}>
                    <div className={`text-sm ${isActive(`/playlist/${playlist.id}`) ? "text-primary" : "text-zinc-400 hover:text-white"} transition-colors truncate block cursor-pointer`}>
                      {playlist.name}
                    </div>
                  </Link>
                </li>
              ))}
              
              <li>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="text-sm text-zinc-400 hover:text-white p-0 h-auto flex items-center"
                      data-testid="button-create-playlist"
                    >
                      <PlusCircle className="h-4 w-4 mr-2 text-zinc-500" />
                      Create Playlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Playlist</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Playlist Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter playlist name" 
                                  {...field} 
                                  className="bg-zinc-800 border-zinc-700 text-white"
                                  data-testid="input-playlist-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter playlist description" 
                                  {...field}
                                  value={field.value || ""}
                                  className="bg-zinc-800 border-zinc-700 text-white resize-none"
                                  data-testid="input-playlist-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                            data-testid="button-cancel-playlist"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createPlaylistMutation.isPending}
                            className="bg-primary hover:bg-primary/90 text-black"
                            data-testid="button-submit-playlist"
                          >
                            {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </ScrollArea>
        </div>
      </div>
      
      {/* Footer Section - Fixed */}
      <div className="p-6 border-t border-zinc-800 space-y-3 flex-shrink-0">
        {user && (
          <div className="flex items-center justify-between bg-zinc-800 p-2 rounded">
            <span className="text-xs text-zinc-300">Logged in as {user.username}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-white border-zinc-600 hover:bg-zinc-700 h-8 px-3 ml-2"
              title="Logout"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        )}
        
        <Link href="/subscriptions">
          <div className={`text-sm ${isActive("/subscriptions") ? "text-primary font-medium" : "text-zinc-300 hover:text-white"} transition-colors cursor-pointer block`}>
            {user?.isPremium ? "Manage Subscription" : "Upgrade to Premium"}
          </div>
        </Link>
      </div>
    </div>
  );
}
