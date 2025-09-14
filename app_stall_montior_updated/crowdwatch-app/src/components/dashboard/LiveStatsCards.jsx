import React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  MapPin
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function LiveStatsCards({ stats, alerts, isLoading }) {
  const getOverallStatus = () => {
    const statuses = Object.values(stats.locations).map(loc => loc.status);
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'normal';
  };

  const statusColors = {
    normal: "bg-green-500",
    warning: "bg-yellow-500", 
    critical: "bg-red-500"
  };

  const overallStatus = getOverallStatus();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total People */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total People</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[overallStatus]} animate-pulse`}></div>
                <span className="text-xs text-slate-500 capitalize">{overallStatus} levels</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl bg-blue-500 bg-opacity-20`}>
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
              <p className="text-3xl font-bold text-slate-900">{Object.keys(stats.locations).length}</p>
              <div className="flex items-center gap-2 mt-2">
                <Activity className="w-3 h-3 text-green-500" />
                <span className="text-xs text-slate-500">All systems operational</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500 bg-opacity-20">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Recent Alerts</p>
              <p className="text-3xl font-bold text-slate-900">{alerts.length}</p>
              <div className="flex items-center gap-2 mt-2">
                {alerts.length > 0 ? (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    Last hour
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-500">No recent alerts</span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500 bg-opacity-20">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peak Detection */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Peak Capacity</p>
              <p className="text-3xl font-bold text-slate-900">
                {Math.max(...Object.values(stats.locations).map(l => l.current)) || 0}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-slate-500">Highest location</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-500 bg-opacity-20">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}