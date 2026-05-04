import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Users, TrendingUp, AlertTriangle, Clock } from "lucide-react";

export default function AnalyticsCards({ readings, timeRange, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalReadings = readings.length;
  const totalPeople = readings.reduce((sum, r) => sum + r.people_count, 0);
  const avgPeople = totalReadings > 0 ? Math.round(totalPeople / totalReadings) : 0;
  const alertsTriggered = readings.filter(r => r.alert_triggered).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Readings</p>
              <p className="text-2xl font-bold">{totalReadings}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Crowd</p>
              <p className="text-2xl font-bold">{avgPeople}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Peak Count</p>
              <p className="text-2xl font-bold">{Math.max(...readings.map(r => r.people_count), 0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Alerts</p>
              <p className="text-2xl font-bold">{alertsTriggered}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}