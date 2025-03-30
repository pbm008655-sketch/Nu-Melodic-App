import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AdminPanel } from "@/components/admin-panel";
import { Loader2, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isClearingAlbums, setIsClearingAlbums] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Only admin users can access this page (in this case, the demo user)
  useEffect(() => {
    if (!isLoading && (!user || user.id !== 1)) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);
  
  // Function to clear all albums and tracks
  const handleClearAlbums = async () => {
    if (!confirm("Are you absolutely sure you want to clear ALL albums and tracks? This cannot be undone!")) {
      return;
    }
    
    setIsClearingAlbums(true);
    
    try {
      const response = await apiRequest('POST', '/api/admin/clear-albums');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Albums cleared",
          description: "All albums and tracks have been removed from the system.",
        });
        
        // Invalidate all album-related queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
        queryClient.invalidateQueries({ queryKey: ["/api/recent-albums"] });
        queryClient.invalidateQueries({ queryKey: ["/api/featured-albums"] });
        queryClient.invalidateQueries({ queryKey: ["/api/featured-tracks"] });
        
        // Hide the confirm UI
        setShowClearConfirm(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to clear albums",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error clearing albums:", error);
      toast({
        title: "Error",
        description: "There was a problem clearing the albums and tracks",
        variant: "destructive",
      });
    } finally {
      setIsClearingAlbums(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || user.id !== 1) {
    // Will redirect via useEffect
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="mb-8">
        <AdminPanel />
      </div>
      
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Admin Tools</h2>
        <div className="rounded-md bg-muted p-6">
          <p className="mb-4">
            Manage your music collection with our specialized admin tools:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            <a 
              href="/admin-upload" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-center"
            >
              High-Capacity Upload Tool
            </a>
            <a
              href="/chunked-upload"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-center"
            >
              Chunked Uploader (70MB+ Files)
            </a>
            <a
              href="/storage"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              Storage Dashboard
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            The High-Capacity tool supports larger files (up to 400MB per file) with extended timeout settings.
            For even larger files (70MB+), use the Chunked Uploader which can handle files of any size by breaking
            them into smaller pieces during upload, preventing timeouts.
            The Storage Dashboard provides detailed information about your storage usage and file sizes.
          </p>
        </div>
      </div>
      
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Using the Add Personal Tracks Script</h2>
        <div className="rounded-md bg-muted p-6">
          <p className="mb-4">
            You can also use the server script to add personal tracks in bulk:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Upload your WAV files to the <code className="text-primary">public/audio</code> directory</li>
            <li>Name them with the prefix <code className="text-primary">my-track-</code> followed by a number (e.g., <code className="text-primary">my-track-1.wav</code>)</li>
            <li>Edit the <code className="text-primary">server/add-personal-tracks.ts</code> file to customize your album details</li>
            <li>Run the script with <code className="text-primary">npx tsx server/add-personal-tracks.ts</code></li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            The script will create a new album and add all tracks matching the naming pattern.
            It will automatically rename the files to match the application's naming convention.
          </p>
        </div>
      </div>
      
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Database Management</h2>
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-yellow-800 dark:text-yellow-400 mb-2">Clear All Content</h3>
              <p className="mb-4 text-yellow-700 dark:text-yellow-300">
                This option will permanently remove all albums and tracks from the system.
                Use this when you want to start fresh with your own content.
              </p>
              
              {showClearConfirm ? (
                <div className="bg-white dark:bg-gray-900 rounded-md p-4 border border-yellow-300 dark:border-yellow-700 mb-4">
                  <p className="font-semibold text-red-600 dark:text-red-400 mb-3">
                    Are you absolutely sure?
                  </p>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    This action cannot be undone. It will permanently delete all albums, tracks, and play history.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleClearAlbums}
                      disabled={isClearingAlbums}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClearingAlbums ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2 inline-block" />
                          Clearing...
                        </>
                      ) : (
                        "Yes, Clear Everything"
                      )}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      disabled={isClearingAlbums}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Clear All Albums & Tracks
                </button>
              )}
              
              <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
                Note: This will only remove the database entries. Audio files in the public/audio directory
                will remain and can be reused for new uploads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}