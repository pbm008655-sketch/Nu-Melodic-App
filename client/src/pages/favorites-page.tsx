import { useQuery } from "@tanstack/react-query";
import { Track } from "@shared/schema";
import { TrackListItem } from "@/components/track-list-item";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Music, Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { user } = useAuth();

  const { data: favorites = [], isLoading, error } = useQuery<Track[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-white">Your Favourites</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="text-zinc-400">Loading your favorite tracks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-white">Your Favourites</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="text-red-500">Failed to load your favorites. Please try again.</div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-white">Your Favourites</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="text-center py-16">
          <Music className="h-24 w-24 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-zinc-300 mb-2">No favorites yet</h2>
          <p className="text-zinc-500 mb-6">
            Start liking tracks by clicking the heart icon next to any song
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Heart className="h-8 w-8 text-red-500 mr-4 fill-current" />
          <div>
            <h1 className="text-4xl font-bold text-white">Your Favourites</h1>
            <p className="text-zinc-400 mt-2">
              {favorites.length} {favorites.length === 1 ? 'track' : 'tracks'} you love
            </p>
          </div>
        </div>
        <Link href="/">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="space-y-1">
        {favorites.map((track, index) => (
          <TrackListItem 
            key={track.id} 
            track={track} 
            index={index} 
            showAlbum={true}
            data-testid={`track-item-${track.id}`}
          />
        ))}
      </div>
    </div>
  );
}