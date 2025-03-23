import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, Library, PlusCircle, Music, BarChart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Playlist } from "@shared/schema";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="hidden md:flex flex-col w-60 bg-zinc-900 text-white h-screen">
      <div className="p-6">
        <h1 className="font-heading font-bold text-2xl mb-8 flex items-center">
          <Music className="h-6 w-6 mr-2 text-primary" /> MeloStream
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
              <Link href="#">
                <div className="flex items-center text-zinc-300 hover:text-white transition-colors cursor-pointer">
                  <Library className="h-5 w-5 mr-3" />
                  <span>Your Library</span>
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
          </ul>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs uppercase text-zinc-500 tracking-wider">Your Playlists</h2>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-zinc-400 hover:text-white">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-280px)]">
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
                  <Button 
                    variant="ghost" 
                    className="text-sm text-zinc-400 hover:text-white p-0 h-auto flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2 text-zinc-500" />
                    Create Playlist
                  </Button>
                </li>
              </ul>
            </ScrollArea>
          </div>
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-zinc-800">
        <Link href="/subscriptions">
          <div className={`text-sm ${isActive("/subscriptions") ? "text-primary font-medium" : "text-zinc-300 hover:text-white"} transition-colors cursor-pointer`}>
            {user?.isPremium ? "Manage Subscription" : "Upgrade to Premium"}
          </div>
        </Link>
      </div>
    </div>
  );
}
