import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Playlist, Track, Album } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import Player from "@/components/player";
import { TrackListItem } from "@/components/track-list-item";
import { usePlayer } from "@/hooks/use-player";
import { Play, Pause, Clock3, Music2, Shuffle, PlayCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistPage() {
  const params = useParams<{ id: string }>();
  const playlistId = parseInt(params.id);
  
  const { currentTrack, isPlaying, togglePlay, playPlaylist, playAll, playRandom } = usePlayer();
  
  const {
    data: playlistData,
    isLoading,
    isError,
    error
  } = useQuery<{ playlist: Playlist; tracks: (Track & { album?: Album })[] }>({
    queryKey: [`/api/playlists/${playlistId}`],
  });
  
  const isPlaylistPlaying = () => {
    if (!currentTrack || !playlistData?.tracks.length) return false;
    
    // Check if current track is in this playlist
    return playlistData.tracks.some(track => track.id === currentTrack.id) && isPlaying;
  };
  
  const handlePlayPause = () => {
    if (isPlaylistPlaying()) {
      togglePlay();
    } else if (playlistData?.tracks.length) {
      playPlaylist(playlistData.tracks);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 text-white">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-8">
              <div className="flex flex-col md:flex-row items-center mb-6">
                <Skeleton className="w-40 h-40 rounded-md" />
                <div className="mt-4 md:mt-0 md:ml-8 text-center md:text-left flex-1">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
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
            </div>
          </div>
        </div>
        <Player />
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 text-white">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto pb-24 flex items-center justify-center">
            <div className="text-center p-8">
              <Music2 className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Error Loading Playlist</h2>
              <p className="text-zinc-400">
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </p>
            </div>
          </div>
        </div>
        <Player />
      </div>
    );
  }
  
  const { playlist, tracks } = playlistData || { playlist: {} as Playlist, tracks: [] as (Track & { album?: Album })[] };
  
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Playlist Header */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 md:p-8">
            <div className="flex justify-end mb-4 md:hidden">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full bg-zinc-900 hover:bg-zinc-800">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-40 h-40 bg-zinc-800 rounded-md flex items-center justify-center shadow-lg">
                {playlist.coverUrl ? (
                  <img 
                    src={playlist.coverUrl} 
                    alt={playlist.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <Music2 className="h-16 w-16 text-zinc-600" />
                )}
              </div>
              
              <div className="mt-4 md:mt-0 md:ml-8 text-center md:text-left">
                <span className="uppercase text-xs font-bold tracking-wider mb-1 block text-zinc-400">Playlist</span>
                <h1 className="text-3xl md:text-5xl font-heading font-bold mb-2">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-zinc-300 mb-4">{playlist.description}</p>
                )}
                <div className="flex flex-wrap space-x-2 gap-y-2 justify-center md:justify-start">
                  <Button 
                    className={`${isPlaylistPlaying() ? 'bg-primary' : 'bg-primary'} hover:bg-primary/90 text-black`}
                    onClick={handlePlayPause}
                    disabled={tracks.length === 0}
                  >
                    {isPlaylistPlaying() ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Play
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={() => {
                      if (tracks.length === 0) return;
                      playAll(tracks);
                    }}
                    disabled={tracks.length === 0}
                    title="Play all tracks in order"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" /> Play All
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={() => {
                      if (tracks.length === 0) return;
                      playRandom(tracks);
                    }}
                    disabled={tracks.length === 0}
                    title="Play a random track"
                  >
                    <Shuffle className="h-4 w-4 mr-2" /> Random
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Track List */}
          <div className="p-4 md:p-8">
            {tracks.length === 0 ? (
              <div className="text-center py-12">
                <Music2 className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                <h2 className="text-xl font-medium mb-2">This playlist is empty</h2>
                <p className="text-zinc-400">Add tracks to get started</p>
              </div>
            ) : (
              <>
                <div className="mb-6 px-2 border-b border-zinc-800 pb-2 text-zinc-400 text-sm hidden md:grid grid-cols-[16px_1fr_auto] gap-4">
                  <span className="w-8">#</span>
                  <span>Title</span>
                  <span className="flex items-center"><Clock3 className="h-4 w-4" /></span>
                </div>
                
                <div className="space-y-1">
                  {tracks.map((track: Track & { album?: Album }, index: number) => (
                    <TrackListItem 
                      key={track.id} 
                      track={track} 
                      album={track.album} 
                      index={index} 
                      showAlbum={true}
                      playlistId={playlistId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Player />
    </div>
  );
}
