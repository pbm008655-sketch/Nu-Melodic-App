import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import Player from "@/components/player";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/auth");
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 overflow-y-auto pb-24">
          <MobileMenu />
          
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center">
              <Settings className="h-6 w-6 mr-2 text-primary" /> 
              Account Settings
            </h1>
          </div>
          
          <div className="p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <Card className="bg-zinc-900 border-zinc-800 mb-8">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Username</span>
                      <span className="font-medium">{user?.username}</span>
                    </div>
                    {user?.email && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Email</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator className="bg-zinc-800 mb-8" />
              <h2 className="text-xl font-heading font-bold mb-4 text-destructive">Danger Zone</h2>
              <Card className="bg-zinc-900 border-red-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-destructive">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete Account
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400 text-sm">
                    This will permanently remove your account, playlists, favorites, listening history, and all personal data.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will be deleted forever.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-400 mb-3">
              Type <span className="font-bold text-white">DELETE</span> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              disabled={deleteConfirmText !== "DELETE" || deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Player />
    </div>
  );
}
