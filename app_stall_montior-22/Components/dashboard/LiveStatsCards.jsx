import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";

export default function LiveStatsCards({ stats, alerts, readings, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6">
              <div className="animate-pulse h-20 bg-slate-200 rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalVisitors = Object.values(stats.locations || {}).reduce(
    (sum, loc) => sum + (loc.current || 0),
    0
  );

  const peakEntry = readings.length
    ? readings.reduce((max, r) => (r.people_count > max.people_count ? r : max), readings[0])
    : null;

  const peakCapacity = peakEntry ? peakEntry.people_count : 0;
  const peakLocation = peakEntry ? peakEntry.location : "-";
  const peakTime = peakEntry
    ? new Date(peakEntry.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Visitors */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Visitors</p>
              <p className="text-3xl font-bold text-slate-900">{totalVisitors}</p>
              <div className="flex items-center gap-2 mt-2">
                <Users className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-slate-500">Across all locations</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 bg-opacity-20">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Locations */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Locations</p>
              <p className="text-3xl font-bold text-slate-900">{Object.keys(stats.locations || {}).length}</p>
              <div className="flex items-center gap-2 mt-2">
                <Activity className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-slate-500">Monitored areas</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500 bg-opacity-20">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peak Capacity */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Peak Capacity</p>
              <p className="text-3xl font-bold text-slate-900">{peakCapacity}</p>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-slate-500">
                  {peakLocation}, {peakTime}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-500 bg-opacity-20">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Alerts</p>
              <p className="text-3xl font-bold text-slate-900">{alerts.length}</p>
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-slate-500">Real-time notifications</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-500 bg-opacity-20">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}