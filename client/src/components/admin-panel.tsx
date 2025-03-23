import { useState, useRef, useCallback } from "react";
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
import { AlertCircle, Upload, Music, FileAudio, File } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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
  
  // State for import tracks form
  const [importAlbumTitle, setImportAlbumTitle] = useState("Sample Album");
  const [importAlbumArtist, setImportAlbumArtist] = useState("Demo Artist");
  const [importAlbumDescription, setImportAlbumDescription] = useState("A collection of imported tracks");
  const [importAlbumCoverUrl, setImportAlbumCoverUrl] = useState("");
  
  // State for file upload
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Mutation for importing tracks (batch operation)
  const importTracksMutation = useMutation({
    mutationFn: async (albumData: {
      albumTitle?: string;
      albumArtist?: string;
      albumDescription?: string;
      albumCoverUrl?: string;
    }) => {
      const res = await apiRequest("POST", "/api/admin/import-personal-tracks", albumData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tracks imported successfully",
        description: `Created album "${data.album.title}" with ${data.tracks.length} tracks`,
      });
      
      // Reset form
      setImportAlbumTitle("Sample Album");
      setImportAlbumArtist("Demo Artist");
      setImportAlbumDescription("A collection of imported tracks");
      setImportAlbumCoverUrl("");
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-albums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-albums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-tracks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sample-albums"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to import tracks",
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
  
  const handleImportTracks = (e: React.FormEvent) => {
    e.preventDefault();
    
    // All fields are optional but we'll use them if provided
    importTracksMutation.mutate({
      albumTitle: importAlbumTitle || undefined,
      albumArtist: importAlbumArtist || undefined,
      albumDescription: importAlbumDescription || undefined,
      albumCoverUrl: importAlbumCoverUrl || undefined,
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="album">Add Album</TabsTrigger>
            <TabsTrigger value="track">Add Track</TabsTrigger>
            <TabsTrigger value="import">Import Tracks</TabsTrigger>
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
          
          <TabsContent value="import">
            <div className="pt-4">
              <Alert className="mb-6">
                <FileAudio className="h-4 w-4" />
                <AlertTitle>Bulk Import Tracks</AlertTitle>
                <AlertDescription>
                  This feature automatically imports all WAV files from the <code>/public/audio</code> directory 
                  that follow the naming pattern <code>track-<i>number</i>-<i>number</i>.wav</code>. 
                  The files will be organized into a new album.
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleImportTracks} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="importAlbumTitle">Album Title</Label>
                  <Input
                    id="importAlbumTitle"
                    value={importAlbumTitle}
                    onChange={(e) => setImportAlbumTitle(e.target.value)}
                    placeholder="Enter album title for imported tracks"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave blank to use default ("Sample Album")
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="importAlbumArtist">Artist</Label>
                  <Input
                    id="importAlbumArtist"
                    value={importAlbumArtist}
                    onChange={(e) => setImportAlbumArtist(e.target.value)}
                    placeholder="Enter artist name"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave blank to use default ("Demo Artist")
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="importAlbumCoverUrl">Cover Image URL</Label>
                  <Input
                    id="importAlbumCoverUrl"
                    value={importAlbumCoverUrl}
                    onChange={(e) => setImportAlbumCoverUrl(e.target.value)}
                    placeholder="https://example.com/album-cover.jpg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave blank to use default cover
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="importAlbumDescription">Description</Label>
                  <Textarea
                    id="importAlbumDescription"
                    value={importAlbumDescription}
                    onChange={(e) => setImportAlbumDescription(e.target.value)}
                    placeholder="Enter album description"
                    rows={3}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={importTracksMutation.isPending}
                >
                  {importTracksMutation.isPending ? "Importing..." : "Import Tracks"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 rounded-md bg-muted p-4">
          <h3 className="font-medium">Adding Personal Audio Files</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            1. Upload your WAV files to the <code className="text-primary">/public/audio</code> directory<br />
            2. Name them in the format <code className="text-primary">track-{'{albumId}'}-{'{trackNumber}'}.wav</code><br />
            3. For a new album, create the album first to get its ID<br />
            4. Then add tracks, matching the filename pattern<br />
            5. Or use the "Import Tracks" tab to bulk import all matching files
          </p>
        </div>
      </CardContent>
    </Card>
  );
}