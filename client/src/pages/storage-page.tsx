import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
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
  AlertTriangle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  
  // Only admin (user with id 1) can access this page
  const isAdmin = user?.id === 1;
  
  // Redirect if not logged in or not admin
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

  // Fetch storage info
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['/api/admin/storage-info'],
    enabled: !!isAdmin  // Only fetch if user is admin
  });
  
  const storageInfo: StorageInfo | undefined = response?.data;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Storage Dashboard</h1>
      
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageInfo.files.map((file) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}