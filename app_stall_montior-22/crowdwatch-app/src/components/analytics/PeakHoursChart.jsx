import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function PeakHoursChart({ readings, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
        <CardContent className="p-6 h-64 flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-slate-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Aggregate data by hour
  const hours = Array(24).fill(0).map((_, i) => ({
    hour: i.toString().padStart(2, '0') + ':00',
    total: 0,
    count: 0
  }));

  readings.forEach(r => {
    const d = new Date(r.created_date);
    const h = d.getHours();
    if (hours[h]) {
      hours[h].total += r.people_count;
      hours[h].count += 1;
    }
  });

  const chartData = hours.map(h => ({
    hour: h.hour,
    average: h.count > 0 ? Math.round(h.total / h.count) : 0
  }));

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Peak Hours Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              interval={2}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Bar
              dataKey="average"
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              name="Avg People"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}