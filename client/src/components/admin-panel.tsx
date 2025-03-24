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
  const [albumArtist, setAlbumArtist] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [albumReleaseDate, setAlbumReleaseDate] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  // Track form state
  const [isDraggingTracks, setIsDraggingTracks] = useState(false);
  const trackInputRef = useRef<HTMLInputElement>(null);
  const [tracks, setTracks] = useState<Array<{
    file: File;
    title: string;
    trackNumber: number;
    duration: number;
  }>>([]);
  
  // Bulk import state
  const [bulkAlbumTitle, setBulkAlbumTitle] = useState("");
  const [bulkAlbumArtist, setBulkAlbumArtist] = useState("");
  const [bulkAlbumDescription, setBulkAlbumDescription] = useState("");
  const [bulkTrackPattern, setBulkTrackPattern] = useState("");
  const [bulkCustomCover, setBulkCustomCover] = useState("");
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Reset form
  const resetAlbumForm = () => {
    setAlbumTitle("");
    setAlbumArtist("");
    setAlbumDescription("");
    setAlbumReleaseDate("");
    setCoverUrl("");
    setCoverPreview(null);
    setCoverFile(null);
    setTracks([]);
  };
  
  // Reset bulk import form
  const resetBulkImportForm = () => {
    setBulkAlbumTitle("");
    setBulkAlbumArtist("");
    setBulkAlbumDescription("");
    setBulkTrackPattern("");
    setBulkCustomCover("");
  };
  
  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      return new Promise<Album>((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/albums", true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };
        
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            setIsUploading(false);
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error("Failed to parse server response"));
            }
          } else {
            setIsUploading(false);
            reject(new Error(`Server returned ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function () {
          setIsUploading(false);
          reject(new Error("Request failed"));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      toast({
        title: "Album created",
        description: `Album "${data.title}" has been created successfully.`,
      });
      resetAlbumForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create album",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!albumTitle || !albumArtist) {
      toast({
        title: "Missing fields",
        description: "Album title and artist are required.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("title", albumTitle);
    formData.append("artist", albumArtist);
    formData.append("description", albumDescription);
    
    if (albumReleaseDate) {
      formData.append("releaseDate", new Date(albumReleaseDate).toISOString());
    }
    
    if (coverFile) {
      formData.append("cover", coverFile);
    } else if (coverUrl) {
      formData.append("coverUrl", coverUrl);
    }
    
    // Add tracks
    if (tracks.length > 0) {
      tracks.forEach((track, index) => {
        formData.append(`track-${index}`, track.file);
        formData.append(`trackTitle-${index}`, track.title);
        formData.append(`trackNumber-${index}`, track.trackNumber.toString());
      });
      formData.append("trackCount", tracks.length.toString());
    }
    
    createAlbumMutation.mutate(formData);
  };
  
  // Handle cover file change
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCoverUpload(file);
    }
  };
  
  // Handle cover upload
  const handleCoverUpload = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Cover image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Set cover file and preview
    setCoverFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCoverPreview(result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle cover input click
  const handleCoverInputClick = () => {
    coverInputRef.current?.click();
  };
  
  // Handle cover drag events
  const handleCoverDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(true);
  };
  
  const handleCoverDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDraggingCover(true);
  };
  
  const handleCoverDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(false);
  };
  
  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleCoverUpload(files[0]);
    }
  };
  
  // Handle track file change
  const handleTrackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleTrackFiles(Array.from(files));
    }
  };
  
  // Extract track name from filename
  const extractTrackName = (filename: string): string => {
    // Remove extension
    let name = filename.replace(/\.[^/.]+$/, "");
    
    // Remove track number prefixes like "01 - " or "01."
    name = name.replace(/^\d+[\s.-]+/, "");
    
    // Capitalize first letter of each word
    name = name.split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    
    return name;
  };
  
  // Handle track files
  const handleTrackFiles = async (files: File[]) => {
    const audioFiles = files.filter(file => file.type === "audio/wav");
    
    if (audioFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload WAV audio files.",
        variant: "destructive",
      });
      return;
    }
    
    // Sort files by name
    audioFiles.sort((a, b) => a.name.localeCompare(b.name));
    
    // Process each track
    const newTracks = await Promise.all(audioFiles.map(async (file, index) => {
      // Create track object
      return {
        file,
        title: extractTrackName(file.name),
        trackNumber: tracks.length + index + 1,
        duration: 180, // Default duration in seconds
      };
    }));
    
    // Add new tracks to the list
    setTracks(prev => [...prev, ...newTracks]);
    
    toast({
      title: "Tracks added",
      description: `${newTracks.length} tracks added to the album.`,
    });
  };
  
  // Handle track input click
  const handleTrackInputClick = () => {
    trackInputRef.current?.click();
  };
  
  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      return new Promise<{ album: Album, trackCount: number }>((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/albums/import", true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };
        
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            setIsUploading(false);
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error("Failed to parse server response"));
            }
          } else {
            setIsUploading(false);
            reject(new Error(`Server returned ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function () {
          setIsUploading(false);
          reject(new Error("Request failed"));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      toast({
        title: "Album imported",
        description: `Album "${data.album.title}" has been imported with ${data.trackCount} tracks.`,
      });
      resetBulkImportForm();
      setIsBulkImporting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to import album",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });
  
  // Handle bulk import submission
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkAlbumTitle || !bulkAlbumArtist || !bulkTrackPattern) {
      toast({
        title: "Missing fields",
        description: "Album title, artist, and track pattern are required.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("title", bulkAlbumTitle);
    formData.append("artist", bulkAlbumArtist);
    formData.append("description", bulkAlbumDescription);
    formData.append("trackPattern", bulkTrackPattern);
    
    if (bulkCustomCover) {
      formData.append("coverUrl", bulkCustomCover);
    }
    
    bulkImportMutation.mutate(formData);
  };
  
  // Handle drag enter for bulk import
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  // Handle drag over for bulk import
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  }, []);
  
  // Handle drag leave for bulk import
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  // Handle drop for bulk import
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFolder = e.dataTransfer.items;
    if (!droppedFolder || droppedFolder.length === 0) return;
    
    // Extract folder name for album title suggestion
    const folderPath = droppedFolder[0].webkitGetAsEntry()?.fullPath || "";
    const folderName = folderPath.split('/').filter(Boolean).pop() || "";
    
    if (folderName && !bulkAlbumTitle) {
      setBulkAlbumTitle(folderName.replace(/[_-]/g, ' '));
    }
    
    toast({
      title: "Folder detected",
      description: "Enter the track pattern that matches the files in this folder.",
    });
  }, [bulkAlbumTitle]);
  
  // Handle track drag events
  const handleTrackDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTracks(true);
  };
  
  const handleTrackDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDraggingTracks(true);
  };
  
  const handleTrackDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTracks(false);
  };
  
  const handleTrackDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTracks(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleTrackFiles(files);
    }
  };
  
  // Remove track
  const removeTrack = (index: number) => {
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks.splice(index, 1);
      
      // Update track numbers
      return newTracks.map((track, i) => ({
        ...track,
        trackNumber: i + 1,
      }));
    });
  };
  
  // Update track title
  const updateTrackTitle = (index: number, title: string) => {
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[index] = {
        ...newTracks[index],
        title,
      };
      return newTracks;
    });
  };
  
  return (
    <div>
      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Album</TabsTrigger>
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Album</CardTitle>
              <CardDescription>
                Fill in the details below to create a new album.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="albumTitle">Album Title</Label>
                    <Input
                      id="albumTitle"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      placeholder="Enter album title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="albumArtist">Artist</Label>
                    <Input
                      id="albumArtist"
                      value={albumArtist}
                      onChange={(e) => setAlbumArtist(e.target.value)}
                      placeholder="Enter artist name"
                      required
                    />
                  </div>
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
                  <Label htmlFor="albumReleaseDate">Release Date</Label>
                  <Input
                    id="albumReleaseDate"
                    type="date"
                    value={albumReleaseDate}
                    onChange={(e) => setAlbumReleaseDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="coverUrl">Cover Image</Label>
                  <div className="flex flex-col gap-4">
                    <Input
                      id="coverUrl"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="Enter cover image URL (optional)"
                      disabled={!!coverFile}
                    />
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Or</p>
                      <input
                        type="file"
                        ref={coverInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverChange}
                      />
                      
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                          isDraggingCover
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25"
                        } ${coverPreview ? "cursor-pointer" : ""}`}
                        onClick={handleCoverInputClick}
                        onDragEnter={handleCoverDragEnter}
                        onDragOver={handleCoverDragOver}
                        onDragLeave={handleCoverDragLeave}
                        onDrop={handleCoverDrop}
                      >
                        {coverPreview ? (
                          <div className="relative w-full h-40 md:h-60">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="w-full h-full object-contain rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCoverPreview(null);
                                setCoverFile(null);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              Drag and drop a cover image or click to browse
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Tracks</Label>
                  <div className="flex flex-col gap-4">
                    <input
                      type="file"
                      ref={trackInputRef}
                      className="hidden"
                      accept="audio/wav"
                      multiple
                      onChange={handleTrackChange}
                    />
                    
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                        isDraggingTracks
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25"
                      }`}
                      onClick={handleTrackInputClick}
                      onDragEnter={handleTrackDragEnter}
                      onDragOver={handleTrackDragOver}
                      onDragLeave={handleTrackDragLeave}
                      onDrop={handleTrackDrop}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileAudio className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Drag and drop WAV files or click to browse
                        </p>
                      </div>
                    </div>
                    
                    {tracks.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          {tracks.length} track{tracks.length !== 1 ? "s" : ""} added
                        </div>
                        <div className="space-y-2">
                          {tracks.map((track, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                              <div className="flex-shrink-0 text-center w-6">
                                {track.trackNumber}.
                              </div>
                              <div className="flex-grow">
                                <Input
                                  value={track.title}
                                  onChange={(e) => updateTrackTitle(index, e.target.value)}
                                  placeholder="Track title"
                                />
                              </div>
                              <div className="flex-shrink-0 text-sm text-muted-foreground">
                                {track.file.name}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTrack(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="text-sm">Uploading... {uploadProgress}%</div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAlbumForm}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={createAlbumMutation.isPending || isUploading}
                  >
                    {createAlbumMutation.isPending ? "Creating..." : "Create Album"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import</CardTitle>
              <CardDescription>
                Import multiple audio files at once by specifying a pattern.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Bulk Import Instructions</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    To import multiple tracks, specify a pattern that matches the WAV files 
                    in your project's <code>/public/audio</code> directory.
                  </p>
                  <p className="mb-2">
                    Example: <code>custom-album-*</code> will import all files that begin with 
                    "custom-album-" such as custom-album-1.wav, custom-album-2.wav, etc.
                  </p>
                  <p>
                    Tracks will be automatically sorted by filename.
                  </p>
                </AlertDescription>
              </Alert>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors mb-4 ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drag and drop a folder to suggest a track pattern
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleBulkImport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkAlbumTitle">Album Title</Label>
                    <Input
                      id="bulkAlbumTitle"
                      value={bulkAlbumTitle}
                      onChange={(e) => setBulkAlbumTitle(e.target.value)}
                      placeholder="Enter album title"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bulkAlbumArtist">Artist</Label>
                    <Input
                      id="bulkAlbumArtist"
                      value={bulkAlbumArtist}
                      onChange={(e) => setBulkAlbumArtist(e.target.value)}
                      placeholder="Enter artist name"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulkAlbumDescription">Description</Label>
                  <Textarea
                    id="bulkAlbumDescription"
                    value={bulkAlbumDescription}
                    onChange={(e) => setBulkAlbumDescription(e.target.value)}
                    placeholder="Enter album description"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulkTrackPattern">Track Pattern</Label>
                  <Input
                    id="bulkTrackPattern"
                    value={bulkTrackPattern}
                    onChange={(e) => setBulkTrackPattern(e.target.value)}
                    placeholder="Enter track pattern (e.g., my-album-*)"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulkCustomCover">Custom Cover URL (Optional)</Label>
                  <Input
                    id="bulkCustomCover"
                    value={bulkCustomCover}
                    onChange={(e) => setBulkCustomCover(e.target.value)}
                    placeholder="Enter cover image URL"
                  />
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="text-sm">Processing... {uploadProgress}%</div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetBulkImportForm}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={bulkImportMutation.isPending || isUploading}
                  >
                    {bulkImportMutation.isPending ? "Importing..." : "Import Album"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}