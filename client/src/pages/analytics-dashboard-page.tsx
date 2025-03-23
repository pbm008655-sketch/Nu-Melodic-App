import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts";
import { ArrowUpRight, Music, Play, Calendar, Users, Headphones } from "lucide-react";
import { Track, Album } from "@shared/schema";
import Sidebar from "@/components/sidebar";

interface TopTrack {
  track: Track;
  album: Album;
  plays: number;
}

interface PlaysByDate {
  date: string;
  plays: number;
}

interface PlaysByAlbum {
  album: Album;
  albumId: number;
  plays: number;
}

interface ListeningHistory {
  track: Track;
  album: Album;
  playedAt: Date;
}

const timeRanges = {
  "7days": { label: "Last 7 Days", days: 7 },
  "30days": { label: "Last 30 Days", days: 30 },
  "90days": { label: "Last 90 Days", days: 90 },
};

export default function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const today = startOfToday();

  // Get top tracks
  const { data: topTracks, isLoading: isLoadingTopTracks } = useQuery<TopTrack[]>({
    queryKey: ["/api/analytics/top-tracks"],
    enabled: !!user,
  });

  // Get play data by date (last 30 days by default)
  const { data: playsByDate, isLoading: isLoadingPlaysByDate } = useQuery<{ startDate: Date; endDate: Date; data: PlaysByDate[] }>({
    queryKey: ["/api/analytics/plays-by-date"],
    enabled: !!user,
  });

  // Get user's listening history
  const { data: listeningHistory, isLoading: isLoadingHistory } = useQuery<ListeningHistory[]>({
    queryKey: ["/api/analytics/listening-history"],
    enabled: !!user,
  });

  // Calculate total plays
  const totalPlays = playsByDate?.data.reduce((sum, item) => sum + item.plays, 0) || 0;

  // Format data for charts
  const formatPlaysByDateForChart = (data?: PlaysByDate[]) => {
    if (!data) return [];
    return data.map(item => ({
      date: format(new Date(item.date), "MMM dd"),
      plays: item.plays
    }));
  };

  // Get data for album distribution chart
  const getAlbumDistribution = () => {
    if (!topTracks) return [];
    
    // Group plays by album
    const albumPlays = new Map<number, { name: string; plays: number }>();
    
    topTracks.forEach(({ track, album, plays }) => {
      const existing = albumPlays.get(album.id);
      if (existing) {
        albumPlays.set(album.id, { name: album.title, plays: existing.plays + plays });
      } else {
        albumPlays.set(album.id, { name: album.title, plays });
      }
    });
    
    return Array.from(albumPlays.values()).map(item => ({
      name: item.name,
      value: item.plays
    }));
  };

  // Stats summary data
  const statCards = [
    { title: "Total Plays", value: totalPlays, icon: Play, color: "text-blue-500" },
    { title: "Unique Tracks", value: topTracks?.length || 0, icon: Music, color: "text-purple-500" },
    { title: "Active Days", value: playsByDate?.data.length || 0, icon: Calendar, color: "text-green-500" },
    { title: "Daily Average", value: Math.round(totalPlays / (playsByDate?.data.length || 1)), icon: ArrowUpRight, color: "text-amber-500" },
  ];

  // Colors for charts
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00C49F"];

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      
      <main className="flex-1 p-6">
        <div className="flex flex-col max-w-screen-xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-zinc-400 mb-8">Track play count and user engagement with your music</p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-medium text-zinc-400">{stat.title}</CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Play Trends Chart */}
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Play Trends</CardTitle>
                <CardDescription className="text-zinc-400">Track plays over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoadingPlaysByDate ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatPlaysByDateForChart(playsByDate?.data)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#333", border: "none" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="plays" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Album Distribution Chart */}
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardHeader>
                <CardTitle>Album Distribution</CardTitle>
                <CardDescription className="text-zinc-400">Plays by album</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoadingTopTracks ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getAlbumDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {getAlbumDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#333", border: "none" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Top Tracks */}
          <Card className="bg-zinc-900 border-zinc-800 text-white mb-8">
            <CardHeader>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription className="text-zinc-400">Your most played tracks</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTopTracks ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {topTracks && topTracks.length > 0 ? (
                    <div className="space-y-4">
                      {topTracks.slice(0, 5).map((item, index) => (
                        <div key={item.track.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center bg-zinc-800 w-10 h-10 rounded-md mr-4 text-lg font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-medium">{item.track.title}</h3>
                              <p className="text-zinc-400 text-sm">{item.album.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Headphones className="h-4 w-4 mr-2 text-zinc-400" />
                            <span>{item.plays} plays</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      <Headphones className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No track play data available yet. Start playing tracks to see analytics.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription className="text-zinc-400">Latest plays</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {listeningHistory && listeningHistory.length > 0 ? (
                    <div className="space-y-4">
                      {listeningHistory.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-10 h-10 rounded-md mr-4 bg-cover bg-center" 
                              style={{ backgroundImage: `url(${item.album.coverUrl})` }}
                            />
                            <div>
                              <h3 className="font-medium">{item.track.title}</h3>
                              <p className="text-zinc-400 text-sm">{item.album.title}</p>
                            </div>
                          </div>
                          <div className="text-zinc-400 text-sm">
                            {format(new Date(item.playedAt), "MMM dd, h:mm a")}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No listening history yet. Start playing tracks to see your activity.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}