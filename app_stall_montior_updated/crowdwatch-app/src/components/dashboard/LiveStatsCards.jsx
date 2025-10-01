import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

// CSV Helpers
async function fetchCsvText() {
  const res = await fetch("/counts.csv");
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
        ts = new Date(ts).toISOString();
      } catch {
        ts = null;
      }
    }

    const count = Number(countStr);
    if (Number.isFinite(count)) {
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
    const interval = setInterval(loadCsv, 30000); // auto-refresh
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

      setCsvData(chartData);
    } catch (e) {
      console.error("CSV load error:", e);
      setCsvData([]);
    } finally {
      setLoadingCsv(false);
    }
  };

  if (isLoading || loadingCsv) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
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
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Real-time Crowd Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {csvData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No CSV data available</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={csvData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
<XAxis
  dataKey="time"
  stroke="#64748b"
  tick={{ fontSize: 12 }}
  tickFormatter={(time) => 
    new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
/>

<Tooltip
  labelFormatter={(time) =>
    new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }
  formatter={(value) => [`${value} people`, "Count"]}
  contentStyle={{
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
  }}
/>
              <Legend />
              <Line
                type="monotone"
                dataKey="people"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", strokeWidth: 2 }}
                name="People Count"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
