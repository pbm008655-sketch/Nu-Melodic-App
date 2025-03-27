import { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtist, setAlbumArtist] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumId, setAlbumId] = useState('1');
  const [trackNumber, setTrackNumber] = useState('1');
  const [trackFiles, setTrackFiles] = useState<{ [key: string]: File }>({});
  const [trackTitles, setTrackTitles] = useState<{ [key: string]: string }>({});
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  // Generic file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Audio file upload
  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  // Cover file upload
  const handleCoverFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  // Track file upload
  const handleTrackFileChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTrackFiles(prev => ({
        ...prev,
        [`track${index}`]: e.target.files![0]
      }));
    }
  };

  // Track title change
  const handleTrackTitleChange = (index: number, title: string) => {
    setTrackTitles(prev => ({
      ...prev,
      [`track${index}`]: title
    }));
  };

  // Generic file upload
  const handleGenericSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setUploadResult(result);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'File uploaded successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Upload failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Audio file upload
  const handleAudioSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast({
        title: 'Error',
        description: 'Please select an audio file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    if (!albumId || !trackNumber) {
      toast({
        title: 'Error',
        description: 'Album ID and Track Number are required',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('albumId', albumId);
      formData.append('trackNumber', trackNumber);
      
      const response = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setUploadResult(result);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Audio file uploaded successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Upload failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Audio upload error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during audio upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Cover file upload
  const handleCoverSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!coverFile) {
      toast({
        title: 'Error',
        description: 'Please select a cover image to upload',
        variant: 'destructive',
      });
      return;
    }
    
    if (!albumId) {
      toast({
        title: 'Error',
        description: 'Album ID is required',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('cover', coverFile);
      formData.append('albumId', albumId);
      
      const response = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setUploadResult(result);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Cover image uploaded successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Upload failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Cover upload error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during cover upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Album with tracks upload
  const handleAlbumSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(trackFiles).length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one track',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      
      // Add album metadata
      const albumData = {
        title: albumTitle || 'New Album',
        artist: albumArtist || 'Unknown Artist',
        description: albumDescription || ''
      };
      formData.append('albumData', JSON.stringify(albumData));
      
      // Add cover if available
      if (coverFile) {
        formData.append('cover', coverFile);
      }
      
      // Add all track files
      Object.entries(trackFiles).forEach(([key, file]) => {
        formData.append(key, file);
        
        // Add track title if available
        if (trackTitles[key]) {
          formData.append(`${key}Title`, trackTitles[key]);
        }
      });
      
      const response = await fetch('/api/upload/album', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setUploadResult(result);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Album uploaded successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Upload failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Album upload error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during album upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const checkDiagnostics = async () => {
    try {
      const response = await fetch('/api/diagnostics');
      const result = await response.json();
      setUploadResult(result);
      
      toast({
        title: 'Diagnostics',
        description: 'Server diagnostics retrieved',
      });
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast({
        title: 'Error',
        description: 'Failed to retrieve server diagnostics',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto mb-8">
        <CardHeader>
          <CardTitle>File Upload Testing Tool</CardTitle>
          <CardDescription>
            Test various file upload endpoints with different file types and sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generic">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="generic">Generic</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="cover">Cover</TabsTrigger>
              <TabsTrigger value="album">Album</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            </TabsList>
            
            {/* Generic File Upload */}
            <TabsContent value="generic">
              <form onSubmit={handleGenericSubmit}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="file">File (Any Type)</Label>
                    <Input 
                      id="file" 
                      type="file" 
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Audio File Upload */}
            <TabsContent value="audio">
              <form onSubmit={handleAudioSubmit}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="audioFile">Audio File (WAV)</Label>
                    <Input 
                      id="audioFile" 
                      type="file" 
                      accept=".wav"
                      onChange={handleAudioFileChange}
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="albumId">Album ID</Label>
                      <Input 
                        id="albumId" 
                        type="number" 
                        value={albumId}
                        onChange={(e) => setAlbumId(e.target.value)}
                        disabled={isUploading}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="trackNumber">Track Number</Label>
                      <Input 
                        id="trackNumber" 
                        type="number" 
                        value={trackNumber}
                        onChange={(e) => setTrackNumber(e.target.value)}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading Audio...' : 'Upload Audio File'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Cover Image Upload */}
            <TabsContent value="cover">
              <form onSubmit={handleCoverSubmit}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="coverFile">Cover Image</Label>
                    <Input 
                      id="coverFile" 
                      type="file" 
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="coverAlbumId">Album ID</Label>
                    <Input 
                      id="coverAlbumId" 
                      type="number" 
                      value={albumId}
                      onChange={(e) => setAlbumId(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading Cover...' : 'Upload Cover Image'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Album with Tracks Upload */}
            <TabsContent value="album">
              <form onSubmit={handleAlbumSubmit}>
                <div className="grid w-full items-center gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="albumTitle">Album Title</Label>
                      <Input 
                        id="albumTitle" 
                        value={albumTitle}
                        onChange={(e) => setAlbumTitle(e.target.value)}
                        placeholder="Album Title"
                        disabled={isUploading}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="albumArtist">Artist</Label>
                      <Input 
                        id="albumArtist" 
                        value={albumArtist}
                        onChange={(e) => setAlbumArtist(e.target.value)}
                        placeholder="Artist Name"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="albumDescription">Description</Label>
                    <Textarea 
                      id="albumDescription" 
                      value={albumDescription}
                      onChange={(e) => setAlbumDescription(e.target.value)}
                      placeholder="Album description"
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="albumCover">Cover Image</Label>
                    <Input 
                      id="albumCover" 
                      type="file" 
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="border-t my-4 pt-4">
                    <h3 className="font-semibold mb-4">Tracks</h3>
                    
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 mb-4 items-start">
                        <div className="col-span-2">
                          <Label htmlFor={`track${index}`} className="mb-2 block">Track {index}</Label>
                          <Input 
                            id={`track${index}`} 
                            type="file" 
                            accept=".wav"
                            onChange={(e) => handleTrackFileChange(index, e)}
                            disabled={isUploading}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`trackTitle${index}`} className="mb-2 block">Title</Label>
                          <Input 
                            id={`trackTitle${index}`} 
                            placeholder={`Track ${index}`}
                            value={trackTitles[`track${index}`] || ''}
                            onChange={(e) => handleTrackTitleChange(index, e.target.value)}
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading Album...' : 'Upload Album with Tracks'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Diagnostics */}
            <TabsContent value="diagnostics">
              <div className="grid w-full items-center gap-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Check server diagnostics to verify upload limits and directory configurations.
                </p>
                <Button onClick={checkDiagnostics}>
                  Check Server Diagnostics
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        {uploadResult && (
          <CardFooter className="flex flex-col items-start border-t pt-4">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-xs bg-muted p-2 rounded w-full overflow-auto">
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}