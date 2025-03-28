import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Album, Track } from "@shared/schema";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import Player from "@/components/player";
import { TrackListItem } from "@/components/track-list-item";
import { usePlayer } from "@/hooks/use-player";
import { Play, Pause, Clock3, Music2, Shuffle, PlayCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DownloadButton } from "@/components/download-button";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albumId = parseInt(params.id);
  
  const { currentTrack, isPlaying, togglePlay, playAlbum, playAll, playRandom } = usePlayer();
  
  const {
    data: albumData,
    isLoading,
    isError,
    error
  } = useQuery<{ album: Album; tracks: Track[] }>({
    queryKey: [`/api/albums/${albumId}`],
  });
  
  const isAlbumPlaying = () => {
    if (!currentTrack || !albumData) return false;
    return currentTrack.albumId === albumId && isPlaying;
  };
  
  const handlePlayPause = () => {
    if (isAlbumPlaying()) {
      togglePlay();
    } else if (albumData) {
      playAlbum(albumData.tracks, albumData.album);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 text-white">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto pb-24">
            <MobileMenu />
            
            <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-8">
              <div className="flex flex-col md:flex-row items-center mb-6">
                <Skeleton className="w-48 h-48 rounded-md" />
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
              <h2 className="text-2xl font-bold mb-2">Error Loading Album</h2>
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
  
  const { album, tracks } = albumData || { album: {} as Album, tracks: [] as Track[] };
  
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto pb-24">
          <MobileMenu />
          
          {/* Album Header */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 md:p-8">
            <div className="flex flex-col md:flex-row items-center">
              <img 
                src={album.coverUrl} 
                alt={album.title}
                className="w-40 h-40 md:w-48 md:h-48 rounded-md shadow-lg"
              />
              
              <div className="mt-4 md:mt-0 md:ml-8 text-center md:text-left">
                <span className="uppercase text-xs font-bold tracking-wider mb-1 block text-zinc-400">Album</span>
                <h1 className="text-3xl md:text-5xl font-heading font-bold mb-2">{album.title}</h1>
                <p className="text-zinc-300 mb-1">{album.artist}</p>
                {album.description && (
                  <p className="text-zinc-400 mb-4 text-sm md:text-base">{album.description}</p>
                )}
                {album.releaseDate && (
                  <p className="text-zinc-500 text-sm mb-4">
                    Released: {new Date(album.releaseDate).toLocaleDateString()}
                  </p>
                )}
                <div className="flex flex-wrap space-x-2 gap-y-2 justify-center md:justify-start">
                  <Button 
                    className={`${isAlbumPlaying() ? 'bg-primary' : 'bg-primary'} hover:bg-primary/90 text-black`}
                    onClick={handlePlayPause}
                  >
                    {isAlbumPlaying() ? (
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
                      // Convert tracks to enhanced tracks with album info
                      const enhancedTracks = tracks.map((track: Track) => ({ ...track, album }));
                      playAll(enhancedTracks);
                    }}
                    title="Play all tracks in order"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" /> Play All
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800 text-white"
                    onClick={() => {
                      if (tracks.length === 0) return;
                      // Convert tracks to enhanced tracks with album info
                      const enhancedTracks = tracks.map((track: Track) => ({ ...track, album }));
                      playRandom(enhancedTracks);
                    }}
                    title="Play a random track"
                  >
                    <Shuffle className="h-4 w-4 mr-2" /> Random
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800 text-white flex items-center"
                    onClick={() => {
                      // Let the DownloadButton component handle the download
                      // This is a wrapper around the actual download button
                      const downloadButton = document.getElementById('album-download-button');
                      if (downloadButton) {
                        downloadButton.click();
                      }
                    }}
                    title="Download entire album"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                  
                  {/* Hidden download button with proper handlers */}
                  <div className="hidden">
                    <DownloadButton
                      id="album-download-button"
                      album={album}
                      variant="ghost"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Track List */}
          <div className="p-4 md:p-8">
            <div className="mb-6 px-2 border-b border-zinc-800 pb-2 text-zinc-400 text-sm hidden md:grid grid-cols-[16px_1fr_auto] gap-4">
              <span className="w-8">#</span>
              <span>Title</span>
              <span className="flex items-center"><Clock3 className="h-4 w-4" /></span>
            </div>
            
            <div className="space-y-1">
              {tracks.map((track: Track, index: number) => (
                <TrackListItem 
                  key={track.id} 
                  track={track} 
                  album={album} 
                  index={index} 
                  showAlbum={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <Player />
    </div>
  );
}
