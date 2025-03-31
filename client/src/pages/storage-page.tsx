import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  HardDrive,
  Music,
  Image,
  FileText,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Define the type of storage info we expect from the API
interface StorageInfo {
  totalSize: number;
  audioSize: number;
  imageSize: number;
  fileCount: number;
  audioCount: number;
  imageCount: number;
  formattedTotalSize: string;
  formattedAudioSize: string;
  formattedImageSize: string;
  files: {
    name: string;
    path: string;
    size: number;
    formattedSize: string;
    type: 'audio' | 'image' | 'other';
  }[];
}

export default function StoragePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Temporarily give access to everyone for testing
  const isAdmin = true; // user?.id === 1;
  
  // Disabled redirects for testing
  /*
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page. Only admin users can access storage information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  */

  // State to manually handle the API response
  const [storageResponse, setStorageResponse] = useState<{success: boolean; data: StorageInfo; message?: string} | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch storage info manually
  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/storage-info');
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        console.log('Storage API response:', result);
        setStorageResponse(result);
        setError(null);
      } catch (err: any) {
        console.error('Storage error:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchStorageInfo();
    }
  }, [isAdmin]);
  
  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const response = await apiRequest('POST', '/api/admin/delete-file', { filePath });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "File Deleted",
          description: "The file has been successfully deleted.",
        });
        // Fetch updated storage data
        (async () => {
          try {
            const response = await fetch('/api/admin/storage-info');
            if (!response.ok) {
              throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            setStorageResponse(result);
          } catch (err: any) {
            console.error('Error refreshing storage data:', err);
          }
        })();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete the file.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete the file: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete);
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };
  
  // Handle delete button click
  const handleDeleteClick = (filePath: string) => {
    setFileToDelete(filePath);
    setIsDeleteDialogOpen(true);
  };
  
  // Debug - log the response data
  useEffect(() => {
    console.log("Storage API response:", storageResponse);
    console.log("Storage data:", storageResponse?.data);
  }, [storageResponse]);
  
  // Get the storage info from the response
  const storageInfo = storageResponse?.data;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Storage Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Manage your audio and image files. You can delete unused files to free up storage space. Note that deleting files used by active albums may cause playback issues.
      </p>
      
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      )}
      
      {error && (
        <Card className="bg-red-50 mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Error Loading Storage Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              There was a problem loading storage information. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}
      
      {storageInfo && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total storage card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <span>Total Storage</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{storageInfo.formattedTotalSize}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {storageInfo.fileCount} files
                </div>
                <div className="mt-4">
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <Progress value={(storageInfo.totalSize / (1024 * 1024 * 1024)) * 100} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Using {((storageInfo.totalSize / (1024 * 1024 * 1024)) * 100).toFixed(2)}% of 1GB
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Audio storage card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Music className="h-5 w-5 text-blue-500" />
                  <span>Audio Files</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{storageInfo.formattedAudioSize}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {storageInfo.audioCount} audio files
                </div>
                <div className="mt-4">
                  <div className="bg-blue-100 rounded-full h-2 overflow-hidden">
                    <Progress value={(storageInfo.audioSize / storageInfo.totalSize) * 100} className="h-2 bg-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((storageInfo.audioSize / storageInfo.totalSize) * 100).toFixed(2)}% of total storage
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Image storage card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5 text-green-500" />
                  <span>Cover Images</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{storageInfo.formattedImageSize}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {storageInfo.imageCount} image files
                </div>
                <div className="mt-4">
                  <div className="bg-green-100 rounded-full h-2 overflow-hidden">
                    <Progress value={(storageInfo.imageSize / storageInfo.totalSize) * 100} className="h-2 bg-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((storageInfo.imageSize / storageInfo.totalSize) * 100).toFixed(2)}% of total storage
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Files table */}
          <Card>
            <CardHeader>
              <CardTitle>Files by Size</CardTitle>
              <CardDescription>
                Showing all files ordered by size (largest first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>List of all files in storage</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageInfo.files.map((file: any) => (
                    <TableRow key={file.path}>
                      <TableCell>
                        {file.type === 'audio' ? (
                          <Music className="h-4 w-4 text-blue-500" />
                        ) : file.type === 'image' ? (
                          <Image className="h-4 w-4 text-green-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>{file.type}</TableCell>
                      <TableCell className="text-right">{file.formattedSize}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDeleteClick(file.path)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          title={`Delete file: ${file.name}`}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending && fileToDelete === file.path ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Delete Confirmation Dialog */}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the file 
                      from your storage.
                      {fileToDelete && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <strong>File: </strong> {fileToDelete.split('/').pop()}
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDelete}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}