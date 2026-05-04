import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";

export default function LiveStatsCards({ stats, alerts, readings, isLoading }) {
  const [peakCapacity, setPeakCapacity] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);
  const [peakLocation, setPeakLocation] = useState("-");
  const [peakTime, setPeakTime] = useState("-");
  function formatFilenameDate(filename) {
    // Extract the timestamp from the filename
    const match = filename.match(/capture_(.+)\.jpg/);
    if (!match) return "Invalid Date";

    const dateStr = match[1]; // "2025-09-22T19:05:43.496Z"
    const date = new Date(dateStr);
    if (isNaN(date)) return "Invalid Date";

    // Format as "dd-mm-yy at HH:MM:SS"
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // 0-indexed
    const year = date.getUTCFullYear() % 100; // last 2 digits
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${day}-${month}-${year} at ${hours}:${minutes}:${seconds}`;
  }
  useEffect(() => {
    const fetchData = () => {
      fetch("/counts.csv")
        .then(res => res.text())
        .then(text => {
          const rows = text.split("\n").filter(Boolean); // Split into non-empty lines
          let max = 0;
          let location = "-";
          let time = "-";

          rows.forEach(row => {
            const cols = row.split(","); // CSV columns
            const value = Number(cols[2]) || 0;
            if (value > max) {
              max = value;
              location = cols[0] || "-";

              time = formatFilenameDate(cols[0]);
            }
          });

          // Get the last row for current count
          const lastRow = rows[rows.length - 1];
          const lastCols = lastRow ? lastRow.split(",") : [];
          const currentData = lastCols.length > 2 ? Number(lastCols[2]) : 0;

          setPeakCapacity(max);
          setCurrentCount(currentData);
          setPeakLocation(location);
          setPeakTime(time);
        })
        .catch(err => {
          console.error("Error reading CSV:", err);
          setPeakCapacity(0);
          setCurrentCount(0);
          setPeakLocation("-");
          setPeakTime("-");
        });
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 2000); // Poll every 2 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 h-full">
            <CardContent className="p-6">
              <div className="animate-pulse h-20 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalVisitors = currentCount;
  // Calculate Active Alerts dynamically
  const activeAlertsCount = totalVisitors > 400 ? 1 : 0;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Visitors */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Visitors</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalVisitors}</p>
              <div className="flex items-center gap-2 mt-2">
                <Users className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Across all locations</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 bg-opacity-20 dark:bg-opacity-10">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Active Locations */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Active Locations</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{Object.keys(stats.locations || {}).length}</p>
              <div className="flex items-center gap-2 mt-2">
                <Activity className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Monitored areas</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500 bg-opacity-20 dark:bg-opacity-10">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peak Capacity */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Peak Capacity</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{peakCapacity}</p>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {peakTime}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-500 bg-opacity-20 dark:bg-opacity-10">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800 hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Active Alerts</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeAlertsCount}</p>              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Real-time notifications</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-red-500 bg-opacity-20 dark:bg-opacity-10">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}