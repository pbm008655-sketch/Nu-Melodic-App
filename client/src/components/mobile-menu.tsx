import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { X, Home, Heart, Crown, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Playlist } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);
  
  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-zinc-900 p-4 flex justify-between items-center sticky top-0 z-10">
        <Link href="/">
          <div className="font-heading font-bold text-xl flex items-center cursor-pointer">
            <img src="/nu-melodic-logo.jpg" alt="NU MELODIC" className="h-10 w-auto" />
          </div>
        </Link>
        <button 
          className="text-white p-2" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <Menu />
        </button>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleMenu}
      />
      
      {/* Mobile Menu */}
      <div 
        className={`fixed inset-y-0 right-0 w-64 bg-zinc-900 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex justify-between items-center border-b border-zinc-800">
            <h2 className="font-heading font-bold text-xl">Menu</h2>
            <button 
              className="text-white" 
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <X />
            </button>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <nav>
              <ul className="space-y-6">
                <li>
                  <Link href="/">
                    <div className={`flex items-center text-lg ${isActive("/") ? "text-primary" : "text-white"} cursor-pointer`}>
                      <Home className="w-5 h-5 mr-3" />
                      <span>Home</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/favorites">
                    <div className={`flex items-center text-lg ${isActive("/favorites") ? "text-primary" : "text-white"} cursor-pointer`}>
                      <Heart className="w-5 h-5 mr-3" />
                      <span>Your Favourites</span>
                    </div>
                  </Link>
                </li>
                <li className="pt-6 border-t border-zinc-800">
                  <Link href="/subscriptions">
                    <div className={`flex items-center text-lg ${isActive("/subscriptions") ? "text-primary" : "text-primary"} cursor-pointer`}>
                      <Crown className="w-5 h-5 mr-3" />
                      <span>{user?.isPremium ? "Manage Subscription" : "Upgrade to Premium"}</span>
                    </div>
                  </Link>
                </li>
              </ul>

              {playlists && playlists.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <h2 className="text-sm uppercase text-zinc-500 tracking-wider mb-4">Your Playlists</h2>
                  <ul className="space-y-4">
                    {playlists.map((playlist) => (
                      <li key={playlist.id}>
                        <Link href={`/playlist/${playlist.id}`}>
                          <div className={`text-${isActive(`/playlist/${playlist.id}`) ? "primary" : "zinc-300"} cursor-pointer`}>
                            {playlist.name}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </nav>
          </ScrollArea>
          
          <div className="p-6 border-t border-zinc-800">
            {user && (
              <div className="flex items-center justify-between bg-zinc-800 p-3 rounded">
                <span className="text-sm text-zinc-300">Logged in as {user.username}</span>
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
          </div>
        </div>
      </div>
    </>
  );
}
