import { Route, Switch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { PlayerProvider } from "./hooks/use-player";
import { ProtectedRoute } from "./lib/protected-route";
import InstallPWAPrompt from "./components/install-pwa-prompt";

import HomePage from "./pages/home-page";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import AlbumPage from "./pages/album-page";
import PlaylistPage from "./pages/playlist-page";
import FavoritesPage from "./pages/favorites-page";
import SubscriptionsPage from "./pages/subscriptions-page";
import AnalyticsDashboardPage from "./pages/analytics-dashboard-page";
import AdminPage from "./pages/admin-page";
import ForgotPasswordPage from "./pages/forgot-password-page";
import ResetPasswordPage from "./pages/reset-password-page";

import CheckoutPage from "./pages/checkout-page";
import SubscriptionSuccessPage from "./pages/subscription-success-page";
import AdminUploadTool from "./pages/admin-upload-tool";
import UploadTestPage from "./pages/upload-test-page";
import ChunkedUploaderPage from "./pages/chunked-uploader-page";
import StoragePage from "./pages/storage-page";
import StorageTestPage from "./pages/storage-test-page";
import PrivacyPolicy from "./pages/privacy-policy";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <ProtectedRoute path="/album/:id" component={AlbumPage} />
      <ProtectedRoute path="/playlist/:id" component={PlaylistPage} />
      <ProtectedRoute path="/favorites" component={FavoritesPage} />
      <ProtectedRoute path="/subscriptions" component={SubscriptionsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboardPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/admin-upload" component={AdminUploadTool} />
      <ProtectedRoute path="/storage" component={StoragePage} />
      <ProtectedRoute path="/storage-test" component={StorageTestPage} />

      <ProtectedRoute path="/upload-test" component={UploadTestPage} />
      <ProtectedRoute path="/chunked-upload" component={ChunkedUploaderPage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
          <Router />
          <Toaster />
          <InstallPWAPrompt />
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
