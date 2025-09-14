import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function RealTimeChart({ readings, isLoading }) {
  if (isLoading) {
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

  const prepareChartData = () => {
    const last24Hours = readings.filter(reading => {
      const readingTime = new Date(reading.created_date);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return readingTime > oneDayAgo;
    });

    // Group by hour and location
    const hourlyData = {};
    
    last24Hours.forEach(reading => {
      const hour = format(new Date(reading.created_date), 'HH:mm');
      if (!hourlyData[hour]) {
        hourlyData[hour] = { time: hour };
      }
      hourlyData[hour][reading.location] = reading.people_count;
    });

    return Object.values(hourlyData).slice(-12); // Last 12 hours
  };

  const chartData = prepareChartData();
  
  const locationColors = {
    main_entrance: '#3B82F6',
    food_court: '#EF4444', 
    exhibition_hall: '#10B981',
    parking_area: '#F59E0B',
    emergency_exit: '#8B5CF6'
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Real-time Crowd Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No data available for the last 24 hours</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {Object.entries(locationColors).map(([location, color]) => (
                <Line
                  key={location}
                  type="monotone"
                  dataKey={location}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2 }}
                  name={location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}