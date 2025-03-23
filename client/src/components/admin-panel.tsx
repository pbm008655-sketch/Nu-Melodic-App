import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Album } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Album form state
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumArtist, setAlbumArtist] = useState("MeloStream Artist");
  const [albumCoverUrl, setAlbumCoverUrl] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  
  // Track form state
  const [trackTitle, setTrackTitle] = useState("");
  const [trackAlbumId, setTrackAlbumId] = useState("");
  const [trackNumber, setTrackNumber] = useState("");
  const [trackDuration, setTrackDuration] = useState("180");
  const [trackAudioUrl, setTrackAudioUrl] = useState("");
  const [trackIsFeatured, setTrackIsFeatured] = useState(false);
  
  // Mutation for adding an album
  const addAlbumMutation = useMutation({
    mutationFn: async (albumData: {
      title: string;
      artist: string;
      coverUrl: string;
      description: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/add-album", albumData);
      const data = await res.json();
      return data as Album;
    },
    onSuccess: () => {
      toast({
        title: "Album created successfully",
        description: "Your new album has been added to the library",
      });
      
      // Reset form
      setAlbumTitle("");
      setAlbumArtist("MeloStream Artist");
      setAlbumCoverUrl("");
      setAlbumDescription("");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-albums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-albums"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create album",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for adding a track
  const addTrackMutation = useMutation({
    mutationFn: async (trackData: {
      title: string;
      albumId: number;
      trackNumber: number;
      duration: number;
      audioUrl: string;
      isFeatured: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/admin/add-track", trackData);
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Track created successfully",
        description: "Your new track has been added to the album",
      });
      
      // Reset form
      setTrackTitle("");
      setTrackNumber("");
      setTrackDuration("180");
      setTrackAudioUrl("");
      setTrackIsFeatured(false);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/albums", variables.albumId] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-tracks"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create track",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!albumTitle || !albumArtist) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    addAlbumMutation.mutate({
      title: albumTitle,
      artist: albumArtist,
      coverUrl: albumCoverUrl,
      description: albumDescription,
    });
  };
  
  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackTitle || !trackAlbumId || !trackNumber) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    addTrackMutation.mutate({
      title: trackTitle,
      albumId: parseInt(trackAlbumId),
      trackNumber: parseInt(trackNumber),
      duration: parseInt(trackDuration),
      audioUrl: trackAudioUrl || `/audio/track-${trackAlbumId}-${trackNumber}.wav`,
      isFeatured: trackIsFeatured,
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>Add your personal music to the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="album" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="album">Add Album</TabsTrigger>
            <TabsTrigger value="track">Add Track</TabsTrigger>
          </TabsList>
          
          <TabsContent value="album">
            <form onSubmit={handleAddAlbum} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="albumTitle">Album Title*</Label>
                <Input
                  id="albumTitle"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  placeholder="Enter album title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="albumArtist">Artist*</Label>
                <Input
                  id="albumArtist"
                  value={albumArtist}
                  onChange={(e) => setAlbumArtist(e.target.value)}
                  placeholder="Enter artist name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="albumCoverUrl">Cover Image URL</Label>
                <Input
                  id="albumCoverUrl"
                  value={albumCoverUrl}
                  onChange={(e) => setAlbumCoverUrl(e.target.value)}
                  placeholder="https://example.com/album-cover.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank to use default cover
                </p>
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
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={addAlbumMutation.isPending}
              >
                {addAlbumMutation.isPending ? "Creating..." : "Create Album"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="track">
            <form onSubmit={handleAddTrack} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="trackTitle">Track Title*</Label>
                <Input
                  id="trackTitle"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="Enter track title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trackAlbumId">Album ID*</Label>
                <Input
                  id="trackAlbumId"
                  value={trackAlbumId}
                  onChange={(e) => setTrackAlbumId(e.target.value)}
                  placeholder="Enter album ID"
                  type="number"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The ID of the album this track belongs to
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trackNumber">Track Number*</Label>
                <Input
                  id="trackNumber"
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                  placeholder="Enter track number"
                  type="number"
                  min="1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trackDuration">Duration (seconds)</Label>
                <Input
                  id="trackDuration"
                  value={trackDuration}
                  onChange={(e) => setTrackDuration(e.target.value)}
                  placeholder="Enter duration in seconds"
                  type="number"
                  min="1"
                />
                <p className="text-sm text-muted-foreground">
                  Defaults to 180 seconds (3 minutes)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trackAudioUrl">Audio URL</Label>
                <Input
                  id="trackAudioUrl"
                  value={trackAudioUrl}
                  onChange={(e) => setTrackAudioUrl(e.target.value)}
                  placeholder="/audio/my-track.wav"
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank to use default naming pattern: /audio/track-{'{albumId}'}-{'{trackNumber}'}.wav
                </p>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="trackIsFeatured"
                  type="checkbox"
                  checked={trackIsFeatured}
                  onChange={(e) => setTrackIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="trackIsFeatured" className="text-sm font-normal">
                  Feature this track on the homepage
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={addTrackMutation.isPending}
              >
                {addTrackMutation.isPending ? "Creating..." : "Create Track"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 rounded-md bg-muted p-4">
          <h3 className="font-medium">Adding Personal Audio Files</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            1. Upload your WAV files to the <code className="text-primary">/public/audio</code> directory<br />
            2. Name them in the format <code className="text-primary">track-{'{albumId}'}-{'{trackNumber}'}.wav</code><br />
            3. For a new album, create the album first to get its ID<br />
            4. Then add tracks, matching the filename pattern
          </p>
        </div>
      </CardContent>
    </Card>
  );
}