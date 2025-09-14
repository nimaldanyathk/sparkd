
import React, { useState, useEffect, useCallback } from "react";
import { CrowdReading } from "../entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  BarChart3, 
  Download, 
  Clock, 
  Users,
  TrendingUp,
  Calendar,
  MapPin
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, subWeeks } from "date-fns";

import AnalyticsCards from "../components/analytics/AnalyticsCards";
import TimeRangeSelector from "../components/analytics/TimeRangeSelector";
import LocationBreakdown from "../components/analytics/LocationBreakdown";
import PeakHoursChart from "../components/analytics/PeakHoursChart";

export default function Analytics() {
  const [readings, setReadings] = useState([]);
  const [timeRange, setTimeRange] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      let startDate;
      const now = new Date();

      switch (timeRange) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
        case 'quarter':
          startDate = subDays(now, 90);
          break;
        default:
          startDate = startOfDay(now);
      }

      const allReadings = await CrowdReading.list('-created_date');
      const filteredReadings = allReadings.filter(reading => 
        new Date(reading.created_date) >= startDate
      );
      
      setReadings(filteredReadings);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]); // Dependency: timeRange, because it's used inside the function

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]); // Dependency: loadAnalytics, as it's a stable function due to useCallback

  const exportData = async () => {
    setIsExporting(true);
    try {
      const exportData = readings.map(reading => ({
        Timestamp: format(new Date(reading.created_date), "yyyy-MM-dd HH:mm:ss"),
        Location: reading.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        'People Count': reading.people_count,
        'Confidence Score': Math.round(reading.confidence_score * 100) + '%',
        Temperature: reading.temperature + '°C',
        Humidity: reading.humidity + '%',
        'Alert Triggered': reading.alert_triggered ? 'Yes' : 'No',
        'Device ID': reading.device_id
      }));

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `crowd-analytics-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
    setIsExporting(false);
  };

  const getHourlyTrends = () => {
    const hourlyData = {};
    
    readings.forEach(reading => {
      const hour = format(new Date(reading.created_date), 'HH:00');
      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour, total: 0, count: 0 };
      }
      hourlyData[hour].total += reading.people_count;
      hourlyData[hour].count += 1;
    });

    return Object.values(hourlyData)
      .map(data => ({
        hour: data.hour,
        average: Math.round(data.total / data.count)
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  };

  const getLocationData = () => {
    const locationStats = {};
    
    readings.forEach(reading => {
      if (!locationStats[reading.location]) {
        locationStats[reading.location] = {
          name: reading.location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          total: 0,
          peak: 0,
          average: 0,
          count: 0
        };
      }
      
      locationStats[reading.location].total += reading.people_count;
      locationStats[reading.location].count += 1;
      locationStats[reading.location].peak = Math.max(locationStats[reading.location].peak, reading.people_count);
    });

    return Object.values(locationStats).map(stat => ({
      ...stat,
      average: Math.round(stat.total / stat.count)
    }));
  };

  const hourlyTrends = getHourlyTrends();
  const locationData = getLocationData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-2">
              Analytics & Reports
            </h1>
            <p className="text-slate-600">Detailed insights into crowd patterns and trends</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <TimeRangeSelector 
              value={timeRange} 
              onChange={setTimeRange}
              className="flex-1 md:flex-none"
            />
            <Button
              onClick={exportData}
              disabled={isExporting || readings.length === 0}
              variant="outline"
              className="gap-2 flex-1 md:flex-none"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <AnalyticsCards 
          readings={readings}
          timeRange={timeRange}
          isLoading={isLoading}
        />

        {/* Charts Section */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="trends">Hourly Trends</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="peaks">Peak Analysis</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Average Crowd by Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hourlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={hourlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="hour" 
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
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        name="Average People"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No data available for the selected time range</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationBreakdown 
              locationData={locationData}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="peaks" className="space-y-6">
            <PeakHoursChart 
              readings={readings}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Report Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-slate-900 mb-3">Key Metrics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Readings:</span>
                        <span className="font-medium">{readings.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peak Crowd:</span>
                        <span className="font-medium">{Math.max(...readings.map(r => r.people_count), 0)} people</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Crowd:</span>
                        <span className="font-medium">
                          {readings.length > 0 ? Math.round(readings.reduce((sum, r) => sum + r.people_count, 0) / readings.length) : 0} people
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Alerts Triggered:</span>
                        <span className="font-medium text-red-600">{readings.filter(r => r.alert_triggered).length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-slate-900 mb-3">Busiest Locations</h3>
                    <div className="space-y-2">
                      {locationData
                        .sort((a, b) => b.peak - a.peak)
                        .slice(0, 3)
                        .map((location, index) => (
                          <div key={location.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                {index + 1}
                              </Badge>
                              <span>{location.name}</span>
                            </div>
                            <span className="font-medium">{location.peak} peak</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-2">Recommendations</h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    {readings.filter(r => r.alert_triggered).length > 0 && (
                      <div>• Consider increasing capacity or implementing crowd control measures</div>
                    )}
                    <div>• Monitor peak hours for better resource allocation</div>
                    <div>• Review alert thresholds based on actual crowd patterns</div>
                    <div>• Consider additional monitoring points in high-traffic areas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
