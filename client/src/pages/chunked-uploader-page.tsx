import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, X, Upload, Music, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// A component for the chunked uploader
export default function ChunkedUploaderPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Album metadata
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumArtist, setAlbumArtist] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  
  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverProgress, setCoverProgress] = useState(0);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  
  // Tracks
  type TrackUpload = {
    id: number;
    file: File;
    title: string;
    progress: number;
    isUploading: boolean;
    isDone: boolean;
    error: string | null;
    audioUrl: string | null;
  };
  
  const [tracks, setTracks] = useState<TrackUpload[]>([]);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  
  // Cleanup function to revoke object URLs
  const cleanupObjectUrls = () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
  };
  
  // Handle cover file selection
  const handleCoverSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Cleanup previous object URL
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
      
      // Create preview
      const preview = URL.createObjectURL(file);
      setCoverFile(file);
      setCoverPreview(preview);
      setCoverUrl(null);
      setCoverProgress(0);
    }
  };
  
  // Handle track file selection
  const handleTrackSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const trackId = Date.now();
      
      // Create a default title from the filename (remove extension)
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
      
      // Add the track to our list
      setTracks(prev => [
        ...prev,
        {
          id: trackId,
          file,
          title: defaultTitle,
          progress: 0,
          isUploading: false,
          isDone: false,
          error: null,
          audioUrl: null
        }
      ]);
      
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };
  
  // Update track title
  const updateTrackTitle = (id: number, title: string) => {
    setTracks(prev => 
      prev.map(track => 
        track.id === id ? { ...track, title } : track
      )
    );
  };
  
  // Remove a track
  const removeTrack = (id: number) => {
    setTracks(prev => prev.filter(track => track.id !== id));
  };
  
  // Upload a file in chunks
  const uploadFileInChunks = async (
    file: File, 
    onProgress: (progress: number) => void,
    isTrack: boolean = false,
    isCover: boolean = false,
    albumId: number = 0,
    trackNumber: number = 0
  ) => {
    try {
      // Initialize the chunked upload
      const initResponse = await apiRequest('POST', '/api/chunked-upload/init', {
        filename: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      if (!initResponse.ok) {
        throw new Error(`Failed to initialize upload: ${initResponse.statusText}`);
      }
      
      const { uploadId, chunkSize } = await initResponse.json();
      
      // Calculate the number of chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      // Upload each chunk
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        
        const chunkResponse = await fetch(`/api/chunked-upload/chunk?uploadId=${uploadId}&chunkIndex=${i}&totalChunks=${totalChunks}`, {
          method: 'POST',
          body: chunk,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });
        
        if (!chunkResponse.ok) {
          throw new Error(`Failed to upload chunk ${i}: ${chunkResponse.statusText}`);
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        onProgress(progress);
      }
      
      // Complete the upload
      const completeResponse = await apiRequest('POST', '/api/chunked-upload/complete', {
        uploadId,
        fileType: file.type,
        isTrack,
        isCover,
        albumId,
        trackNumber
      });
      
      if (!completeResponse.ok) {
        throw new Error(`Failed to complete upload: ${completeResponse.statusText}`);
      }
      
      const result = await completeResponse.json();
      
      return result.fileUrl;
    } catch (error: any) {
      console.error("Chunk upload error:", error);
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Upload the cover image
  const uploadCover = async () => {
    if (!coverFile) return null;
    
    try {
      setUploadingCover(true);
      
      // Create a temporary albumId for the cover
      // We'll use a consistent albumId for all files, which will be assigned when creating the album
      const tempAlbumId = Date.now();
      
      const fileUrl = await uploadFileInChunks(
        coverFile,
        (progress) => setCoverProgress(progress),
        false, // Not a track
        true,  // Is a cover
        tempAlbumId
      );
      
      setCoverUrl(fileUrl);
      return fileUrl;
    } catch (error) {
      return null;
    } finally {
      setUploadingCover(false);
    }
  };
  
  // Upload a track
  const uploadTrack = async (track: TrackUpload, albumId: number, trackNumber: number) => {
    try {
      // Update track status
      setTracks(prev => 
        prev.map(t => 
          t.id === track.id 
            ? { ...t, isUploading: true, error: null } 
            : t
        )
      );
      
      const fileUrl = await uploadFileInChunks(
        track.file,
        (progress) => {
          setTracks(prev => 
            prev.map(t => 
              t.id === track.id 
                ? { ...t, progress } 
                : t
            )
          );
        },
        true, // Is a track
        false, // Not a cover
        albumId,
        trackNumber
      );
      
      // Update track status
      setTracks(prev => 
        prev.map(t => 
          t.id === track.id 
            ? { ...t, isUploading: false, isDone: true, audioUrl: fileUrl } 
            : t
        )
      );
      
      return { title: track.title, audioUrl: fileUrl, trackNumber };
    } catch (error: any) {
      // Update track status with error
      setTracks(prev => 
        prev.map(t => 
          t.id === track.id 
            ? { ...t, isUploading: false, error: error.message } 
            : t
        )
      );
      
      throw error;
    }
  };
  
  // Create the album with all tracks
  const createAlbum = async () => {
    if (!albumTitle || !albumArtist) {
      toast({
        title: "Missing Information",
        description: "Album title and artist are required",
        variant: "destructive"
      });
      return;
    }
    
    if (tracks.length === 0) {
      toast({
        title: "No Tracks",
        description: "You need to add at least one track",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCreatingAlbum(true);
      
      // Step 1: Upload the cover if one is selected
      let albumCoverUrl = coverUrl;
      if (coverFile && !coverUrl) {
        albumCoverUrl = await uploadCover();
      }
      
      // Step 2: Upload all tracks
      // For now we'll use a temporary albumId - this will be replaced when the album is created
      const tempAlbumId = Date.now();
      const trackPromises = tracks.map((track, index) => 
        uploadTrack(track, tempAlbumId, index + 1)
      );
      
      const uploadedTracks = await Promise.all(trackPromises);
      
      // Step 3: Create the album with all track information
      const albumResponse = await apiRequest('POST', '/api/chunked-upload/create-album', {
        title: albumTitle,
        artist: albumArtist,
        description: albumDescription,
        coverUrl: albumCoverUrl,
        trackInfo: uploadedTracks
      });
      
      if (!albumResponse.ok) {
        throw new Error(`Failed to create album: ${albumResponse.statusText}`);
      }
      
      const albumResult = await albumResponse.json();
      
      // Success!
      toast({
        title: "Album Created",
        description: `Successfully created "${albumTitle}" with ${tracks.length} tracks`
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
      
      // Navigate to the album page after a short delay
      setTimeout(() => {
        setLocation('/');
      }, 1500);
      
    } catch (error: any) {
      console.error("Album creation error:", error);
      toast({
        title: "Album Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreatingAlbum(false);
    }
  };
  
  // Component cleanup
  // We set cleanup in the component unmount using the useCallback hook
  const cleanupFn = useCallback(() => {
    cleanupObjectUrls();
  }, [coverPreview]);
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Chunked Uploader</h1>
        <p className="text-muted-foreground">
          Upload large WAV or MP3 files in small chunks to prevent timeouts
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Album Information</CardTitle>
          <CardDescription>
            Enter the details for your new album
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="albumTitle">Album Title</Label>
            <Input 
              id="albumTitle"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="Enter album title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="albumArtist">Artist</Label>
            <Input
              id="albumArtist"
              value={albumArtist}
              onChange={(e) => setAlbumArtist(e.target.value)}
              placeholder="Enter artist name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="albumDescription">Description</Label>
            <Textarea
              id="albumDescription"
              value={albumDescription}
              onChange={(e) => setAlbumDescription(e.target.value)}
              placeholder="Enter album description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 bg-muted rounded-md overflow-hidden flex items-center justify-center relative">
                {coverPreview ? (
                  <img 
                    src={coverPreview} 
                    alt="Cover preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="w-12 h-12 text-muted-foreground" />
                )}
                
                {uploadingCover && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Progress value={coverProgress} className="w-16" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <Input
                  type="file"
                  id="coverUpload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleCoverSelect}
                />
                <Label 
                  htmlFor="coverUpload"
                  className="mb-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                >
                  Select Cover Image
                </Label>
                {coverFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {coverFile.name} ({Math.round(coverFile.size / 1024)}KB)
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tracks</CardTitle>
              <CardDescription>
                Add WAV or MP3 audio tracks to your album
              </CardDescription>
            </div>
            
            <div>
              <Input
                type="file"
                id="trackUpload"
                className="hidden"
                accept=".wav,audio/wav,.mp3,audio/mpeg,audio/*"
                onChange={handleTrackSelect}
              />
              <Label 
                htmlFor="trackUpload"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Track
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="mx-auto h-12 w-12 mb-2" />
              <p>No tracks added yet. Click "Add Track" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tracks.map((track, index) => (
                <div key={track.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Input
                      value={track.title}
                      onChange={(e) => updateTrackTitle(track.id, e.target.value)}
                      placeholder="Track title"
                    />
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Music className="h-4 w-4 mr-1" />
                      <span>{track.file.name} ({Math.round(track.file.size / (1024 * 1024))}MB)</span>
                    </div>
                    
                    {track.isUploading && (
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Uploading...</span>
                          <span>{track.progress}%</span>
                        </div>
                        <Progress value={track.progress} className="h-2" />
                      </div>
                    )}
                    
                    {track.isDone && (
                      <p className="text-sm text-green-600">Upload complete!</p>
                    )}
                    
                    {track.error && (
                      <p className="text-sm text-red-600">{track.error}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTrack(track.id)}
                    disabled={track.isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-6">
          <Button 
            onClick={createAlbum} 
            disabled={isCreatingAlbum || tracks.length === 0 || !albumTitle || !albumArtist}
            className="w-full"
          >
            {isCreatingAlbum ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Album...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create Album
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}