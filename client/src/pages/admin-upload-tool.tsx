import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Music, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function AdminUploadTool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [trackTitles, setTrackTitles] = useState<{ [key: string]: string }>({});
  const [albumTitle, setAlbumTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => ({
        ...prev,
        [fieldName]: e.target.files![0]
      }));
    }
  };

  // Function to handle the upload
  const handleUpload = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to upload files",
        variant: "destructive"
      });
      return;
    }

    if (!albumTitle || !artist) {
      toast({
        title: "Missing information",
        description: "Album title and artist are required",
        variant: "destructive"
      });
      return;
    }

    if (Object.keys(files).length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one track file",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('title', albumTitle);
      formData.append('artist', artist);
      
      // Add all files
      Object.entries(files).forEach(([fieldName, file]) => {
        formData.append(fieldName, file);
      });
      
      // Add all track titles
      Object.entries(trackTitles).forEach(([fieldName, title]) => {
        formData.append(fieldName, title);
      });

      // Post to our high-capacity endpoint
      const response = await fetch('/api/high-capacity-album-upload', {
        method: 'POST',
        body: formData,
        // Important: No content-type header, browser will set it with boundary
      });

      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        toast({
          title: "Upload successful",
          description: `Uploaded ${data.trackCount} tracks`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: data.message || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResult({ error: String(error) });
      toast({
        title: "Upload error",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if the user is admin (user id 1)
  const isAdmin = user && user.id === 1;

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be an admin to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">High-Capacity Album Upload Tool</h1>
      <p className="mb-8 text-muted-foreground">
        This tool allows uploading larger WAV files (up to 400MB per file) with extended timeout settings.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Album Information</CardTitle>
            <CardDescription>Enter the details about the album</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                <Label htmlFor="artist">Artist</Label>
                <Input 
                  id="artist" 
                  value={artist} 
                  onChange={(e) => setArtist(e.target.value)} 
                  placeholder="Enter artist name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cover">Album Cover</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="cover" 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'cover')}
                  />
                  {files['cover'] && (
                    <span className="text-sm text-muted-foreground">
                      {files['cover'].name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track Files</CardTitle>
            <CardDescription>Upload WAV files (up to 15 tracks)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Label htmlFor={`track-${i}`}>Track {i+1}</Label>
                  {files[`track-${i}`] && (
                    <div className="mb-2">
                      <Label htmlFor={`title-${i}`}>Track Title</Label>
                      <Input 
                        id={`title-${i}`} 
                        name={`title-${i}`}
                        value={trackTitles[`title-${i}`] || ''}
                        onChange={(e) => setTrackTitles(prev => ({
                          ...prev,
                          [`title-${i}`]: e.target.value
                        }))}
                        placeholder={`Track ${i+1} Title`}
                        className="mb-2"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input 
                      id={`track-${i}`} 
                      type="file" 
                      accept=".wav,audio/wav"
                      onChange={(e) => handleFileSelect(e, `track-${i}`)}
                    />
                    {files[`track-${i}`] && (
                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                        {files[`track-${i}`].name} ({(files[`track-${i}`].size / (1024 * 1024)).toFixed(2)}MB)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Album
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Upload Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}