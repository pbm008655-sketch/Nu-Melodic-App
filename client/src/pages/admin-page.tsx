import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AdminPanel } from "@/components/admin-panel";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Only admin users can access this page (in this case, the demo user)
  useEffect(() => {
    if (!isLoading && (!user || user.id !== 1)) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);
  
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
        <h2 className="text-2xl font-bold mb-4">High-Capacity Upload Tool</h2>
        <div className="rounded-md bg-muted p-6">
          <p className="mb-4">
            For larger WAV files or bulk uploads, use our specialized upload tool:
          </p>
          <div className="flex justify-center my-4">
            <a 
              href="/admin-upload" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Open High-Capacity Upload Tool
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            This tool supports much larger files (up to 2GB per file) and has extended timeout settings.
            Great for high-definition WAV files and albums with many tracks.
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
    </div>
  );
}