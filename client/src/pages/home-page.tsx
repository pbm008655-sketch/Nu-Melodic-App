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
import { ChevronLeft, ChevronRight, Bell, User, Play, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user } = useAuth();

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
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="rounded-full bg-zinc-900 hover:bg-zinc-800">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full bg-zinc-900 hover:bg-zinc-800">
                  <User className="h-5 w-5" />
                </Button>
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
                    <div className="flex space-x-4 justify-center md:justify-start">
                      <Button className="bg-primary hover:bg-primary/90 text-black">
                        <Play className="h-4 w-4 mr-2" /> Play
                      </Button>
                      <Button variant="outline" className="border-white hover:bg-white/10">
                        Save
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
              <h2 className="text-xl md:text-2xl font-heading font-bold mb-4">Featured Tracks</h2>
              
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
