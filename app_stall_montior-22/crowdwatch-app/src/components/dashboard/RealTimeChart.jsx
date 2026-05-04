import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

// CSV Helpers
async function fetchCsvText() {
  const res = await fetch("/counts.csv?t=" + Date.now());
  if (!res.ok) throw new Error("Failed to fetch counts.csv: " + res.status);
  return await res.text();
}

function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 3) continue;

    const image = parts[0].trim();
    let ts = parts[1].trim();
    const countStr = parts[2].trim();

    if (!countStr) continue; // must have count

    if (ts) {
      try {
        // Fix "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS" for proper parsing
        if (ts.includes(" ") && !ts.includes("T")) {
          ts = ts.replace(" ", "T");
        }
        ts = new Date(ts).toISOString();
      } catch {
        console.warn("Invalid timestamp in CSV:", parts[1]);
        ts = null;
      }
    }

    const count = Number(countStr);
    if (Number.isFinite(count)) {
      // Use parsed timestamp, fallback to now only if missing
      rows.push({ image, time: ts || new Date().toISOString(), count });
    }
  }

  return rows;
}

export default function RealTimeChart({ isLoading }) {
  const [csvData, setCsvData] = useState([]);
  const [loadingCsv, setLoadingCsv] = useState(true);

  useEffect(() => {
    loadCsv();
    const interval = setInterval(loadCsv, 2000); // auto-refresh every 2s
    return () => clearInterval(interval);
  }, []);

  const loadCsv = async () => {
    try {
      const csvText = await fetchCsvText();
      const rows = parseCsvRows(csvText);

      // Map rows into chart-ready format
      const chartData = rows.map(r => ({
        time: new Date(r.time), // keep raw Date object
        people: r.count,
      }));

      // Keep only the last 30 data points for a smooth, uncluttered view
      const slicedData = chartData.slice(-30);

      setCsvData(slicedData);
    } catch (e) {
      console.error("CSV load error:", e);
      setCsvData([]);
    } finally {
      setLoadingCsv(false);
    }
  };

  if (isLoading || loadingCsv) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Crowd Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Real-time Crowd Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {csvData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No CSV data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={csvData}>
              <defs>
                <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(time) =>
                  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(time) =>
                  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                }
                formatter={(value) => [`${value} people`, "Count"]}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  color: "#1e293b"
                }}
              />
              <Area
                type="monotone"
                dataKey="people"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPeople)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}