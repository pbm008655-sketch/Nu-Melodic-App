import { useQuery } from "@tanstack/react-query";
import { Album, Track } from "@shared/schema";
import { Play, Music, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SimpleHome() {
  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
  });

  const { data: tracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  if (albumsLoading || tracksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-2">Loading Music Platform...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Music className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Music Streaming Platform
          </h1>
          <p className="text-xl text-zinc-300">Discover and enjoy premium music collection</p>
        </div>

        {/* Albums Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Music className="h-8 w-8" />
            Featured Albums
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums?.map((album) => (
              <Card key={album.id} className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50 transition-colors">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg mb-3 flex items-center justify-center">
                    <Music className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1 text-white">{album.title}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{album.artist}</p>
                  <Button size="sm" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Play Album
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Tracks */}
        <section>
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Heart className="h-8 w-8" />
            Latest Tracks
          </h2>
          <div className="space-y-3">
            {tracks?.slice(0, 8).map((track) => (
              <Card key={track.id} className="bg-zinc-800/30 border-zinc-700 hover:bg-zinc-700/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{track.title}</h4>
                        <p className="text-sm text-zinc-400">{track.artist}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-zinc-500">
          <p>Premium Music Streaming Platform</p>
        </footer>
      </div>
    </div>
  );
}