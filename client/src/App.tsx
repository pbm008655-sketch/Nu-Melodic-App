import { Route, Switch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth-bypass";
import { PlayerProvider } from "./hooks/use-player";
import { ProtectedRoute } from "./lib/protected-route";

import HomePage from "./pages/home-page";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import AlbumPage from "./pages/album-page";
import PlaylistPage from "./pages/playlist-page";
import SubscriptionsPage from "./pages/subscriptions-page";
import AnalyticsDashboardPage from "./pages/analytics-dashboard-page";
import AdminPage from "./pages/admin-page";
import MixerPage from "./pages/mixer-page";
import MixerTestPage from "./pages/mixer-test-page";
import CheckoutPage from "./pages/checkout-page";
import SubscriptionSuccessPage from "./pages/subscription-success-page";
import AdminUploadTool from "./pages/admin-upload-tool";
import UploadTestPage from "./pages/upload-test-page";
import ChunkedUploaderPage from "./pages/chunked-uploader-page";
import StoragePage from "./pages/storage-page";
import StorageTestPage from "./pages/storage-test-page";
import PayPalSubscriptionPage from "./pages/paypal-subscription-page";
import PayPalSuccessPage from "./pages/paypal-success-page";
import TestLogin from "./pages/test-login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/album/:id" component={AlbumPage} />
      <Route path="/playlist/:id" component={PlaylistPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/paypal-subscription" component={PayPalSubscriptionPage} />
      <Route path="/analytics" component={AnalyticsDashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin-upload" component={AdminUploadTool} />
      <Route path="/storage" component={StoragePage} />
      <Route path="/storage-test" component={StorageTestPage} />
      <Route path="/mixer/:id" component={MixerPage} />
      <Route path="/mixer-test" component={MixerTestPage} />
      <Route path="/upload-test" component={UploadTestPage} />
      <Route path="/chunked-upload" component={ChunkedUploaderPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/subscription-success" component={SubscriptionSuccessPage} />
      <Route path="/paypal-success" component={PayPalSuccessPage} />
      <Route path="/test-login" component={TestLogin} />
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
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
