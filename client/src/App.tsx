import { Route, Switch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
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

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/album/:id" component={AlbumPage} />
      <ProtectedRoute path="/playlist/:id" component={PlaylistPage} />
      <ProtectedRoute path="/subscriptions" component={SubscriptionsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboardPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
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
