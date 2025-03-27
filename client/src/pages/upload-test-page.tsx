import { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>File Upload Test</CardTitle>
          <CardDescription>
            Test uploading files to the server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="file">File</Label>
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
        </CardContent>
        {uploadResult && (
          <CardFooter className="flex flex-col items-start border-t pt-4">
            <h3 className="font-semibold mb-2">Upload Result:</h3>
            <pre className="text-xs bg-muted p-2 rounded w-full overflow-auto">
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}