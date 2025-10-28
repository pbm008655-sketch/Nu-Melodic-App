import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Album, Track } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import Player from "@/components/player";
import { AlbumCard } from "@/components/album-card";
import { TrackListItem } from "@/components/track-list-item";
import { useAuth } from "@/hooks/use-auth";
import { usePlayer } from "@/hooks/use-player";
import { ChevronLeft, ChevronRight, Home, Play, Pause, Crown, Shuffle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user } = useAuth();
  const { currentTrack, isPlaying, togglePlay, playAlbum, playAll, playRandom } = usePlayer();
  
  const isPreviewMode = !user?.isPremium;

  const { 
    data: featuredAlbums,
    isLoading: isLoadingFeatured
  } = useQuery<Album[]>({
    queryKey: ["/api/featured-albums"],
  });

  const { 
    data: recentAlbums,
    isLoading: isLoadingRecent
  } = useQuery<Album[]>({
    queryKey: ["/api/recent-albums"],
  });

  const {
    data: featuredTracks,
    isLoading: isLoadingTracks
  } = useQuery<(Track & { album?: Album })[]>({
    queryKey: ["/api/featured-tracks"],
  });

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto pb-24">
          <MobileMenu />

          {/* Preview Mode Banner */}
          {isPreviewMode && (
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 mx-4 my-4 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h3 className="text-yellow-100 font-medium">Preview Mode Active</h3>
                    <p className="text-yellow-200/80 text-sm">You can listen to 30-second previews of all tracks. Subscribe for unlimited access.</p>
                  </div>
                </div>
                <Link href="/subscriptions">
                  <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white">
                    <Crown className="h-4 w-4 mr-2" />
                    Subscribe
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Header with gradient */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="hidden md:flex space-x-4 mr-8">
                  <button className="bg-black bg-opacity-40 rounded-full h-8 w-8 flex items-center justify-center text-zinc-300 hover:text-white">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button className="bg-black bg-opacity-40 rounded-full h-8 w-8 flex items-center justify-center text-zinc-300 hover:text-white">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold">Home</h2>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 md:p-8">
            {/* Featured Album */}
            {featuredAlbums && featuredAlbums.length > 0 && (
              <section className="mb-8">
                <div className="flex md:flex-row items-center bg-gradient-to-r from-purple-900 to-zinc-900 p-4 md:p-6 rounded-xl">
                  <img 
                    src={featuredAlbums[0].coverUrl} 
                    alt={featuredAlbums[0].title} 
                    className="w-32 h-32 md:w-48 md:h-48 rounded-md shadow-lg" 
                  />
                  
                  <div className="ml-0 md:ml-8 mt-4 md:mt-0 text-center md:text-left">
                    <span className="uppercase text-xs font-bold tracking-wider mb-1 block text-zinc-300">Featured Album</span>
                    <h3 className="text-2xl md:text-4xl font-heading font-bold mb-2">{featuredAlbums[0].title}</h3>
                    <p className="text-zinc-300 mb-4">{featuredAlbums[0].description}</p>
                    <div className="flex flex-wrap space-x-2 gap-y-2 justify-center md:justify-start">
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-black"
                        onClick={async () => {
                          // We need to fetch the tracks for this album first
                          const response = await fetch(`/api/albums/${featuredAlbums[0].id}`);
                          const data = await response.json();
                          if (data.tracks && data.tracks.length > 0) {
                            playAlbum(data.tracks, featuredAlbums[0]);
                          }
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" /> Play
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="border-zinc-700 hover:bg-zinc-800 text-white"
                        onClick={async () => {
                          // We need to fetch the tracks for this album first
                          const response = await fetch(`/api/albums/${featuredAlbums[0].id}`);
                          const data = await response.json();
                          if (data.tracks && data.tracks.length > 0) {
                            // Convert tracks to enhanced tracks with album info
                            const enhancedTracks = data.tracks.map((track: Track) => ({ ...track, album: featuredAlbums[0] }));
                            playAll(enhancedTracks);
                          }
                        }}
                        title="Play all tracks in order"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" /> Play All
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="border-zinc-700 hover:bg-zinc-800 text-white"
                        onClick={async () => {
                          // We need to fetch the tracks for this album first
                          const response = await fetch(`/api/albums/${featuredAlbums[0].id}`);
                          const data = await response.json();
                          if (data.tracks && data.tracks.length > 0) {
                            // Convert tracks to enhanced tracks with album info
                            const enhancedTracks = data.tracks.map((track: Track) => ({ ...track, album: featuredAlbums[0] }));
                            playRandom(enhancedTracks);
                          }
                        }}
                        title="Play a random track"
                      >
                        <Shuffle className="h-4 w-4 mr-2" /> Random
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Subscription Banner */}
            {!user?.isPremium && (
              <section className="mb-8">
                <div className="bg-gradient-to-r from-blue-900 to-zinc-900 rounded-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <h3 className="text-xl font-heading font-bold mb-2">Upgrade to Premium</h3>
                    <p className="text-zinc-300">Get unlimited skips, no ads, and exclusive content</p>
                  </div>
                  <Link href="/subscriptions">
                    <a>
                      <Button className="bg-white text-black hover:bg-zinc-200">
                        <Crown className="h-4 w-4 mr-2" /> Try Free for 1 Month
                      </Button>
                    </a>
                  </Link>
                </div>
              </section>
            )}

            {/* Featured Albums */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-heading font-bold">Featured Albums</h2>
                <Link href="#">
                  <a className="text-zinc-400 text-sm hover:text-primary">See All</a>
                </Link>
              </div>
              
              {isLoadingFeatured ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-md" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {featuredAlbums?.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              )}
            </section>

            {/* Recently Added */}
            <section className="mb-10">
              <h2 className="text-xl md:text-2xl font-heading font-bold mb-4">Recently Added</h2>
              
              {isLoadingRecent ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-square w-full rounded-md" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {recentAlbums?.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              )}
            </section>

            {/* New Releases - Track List */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-heading font-bold">Featured Tracks</h2>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={() => {
                      if (featuredTracks?.length) {
                        playAll(featuredTracks);
                      }
                    }}
                    disabled={!featuredTracks?.length}
                    title="Play all tracks in order"
                  >
                    <PlayCircle className="h-3 w-3 mr-1" /> Play All
                  </Button>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={() => {
                      if (featuredTracks?.length) {
                        playRandom(featuredTracks);
                      }
                    }}
                    disabled={!featuredTracks?.length}
                    title="Play a random track"
                  >
                    <Shuffle className="h-3 w-3 mr-1" /> Shuffle
                  </Button>
                </div>
              </div>
              
              {isLoadingTracks ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center p-2">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="ml-3 space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  {featuredTracks?.map((track, index) => (
                    <TrackListItem 
                      key={track.id} 
                      track={track} 
                      album={track.album} 
                      index={index} 
                      showAlbum={true}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      
      <Player />
    </div>
  );
}
