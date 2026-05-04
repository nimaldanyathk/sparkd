
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import AnalyticsCards from "../components/analytics/AnalyticsCards";
import TimeRangeSelector from "../components/analytics/TimeRangeSelector";
import LocationBreakdown from "../components/analytics/LocationBreakdown";
import PeakHoursChart from "../components/analytics/PeakHoursChart";

export default function Analytics() {
  const [readings, setReadings] = useState([]);
  const [timeRange, setTimeRange] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // === CSV Helpers (embedded for now) ===
  async function fetchCsvText() {
    const res = await fetch('/counts.csv');
    if (!res.ok) throw new Error('Failed to fetch counts.csv');
    return await res.text();
  }

  function parseCsvRows(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const rows = [];
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 3) continue;

      let ts = parts[1].trim();
      const countStr = parts[2].trim();
      if (!countStr) continue;

      if (ts && ts.includes(" ") && !ts.includes("T")) {
        ts = ts.replace(" ", "T"); // Fix format for new Date()
      }

      const count = Number(countStr);
      if (Number.isFinite(count)) {
        rows.push({
          created_date: ts ? new Date(ts).toISOString() : new Date().toISOString(),
          people_count: count,
          location: 'main_entrance', // Defaulting to main_entrance for CSV data
          confidence_score: 1,
          alert_triggered: count > 400, // Simple threshold logic
          temperature: 24, // Mock
          humidity: 45,    // Mock
          device_id: 'cam_01'
        });
      }
    }
    return rows;
  }

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

      // Fetch from CSV
      let csvReadings = [];
      try {
        const csvText = await fetchCsvText();
        csvReadings = parseCsvRows(csvText);
      } catch (e) {
        console.warn("Could not load CSV readings:", e);
      }

      // Combine with API readings if needed, or just use CSV for now as per request
      // const allReadings = await CrowdReading.list('-created_date');

      const allReadings = [...csvReadings]; // Prioritize CSV

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

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Temporarily reveal the report container (if hidden)
      const reportElement = document.getElementById('report-container');

      // Ensure it's visible for capture (using a class that shows it just for this valid moment if needed, or rely on absolute positioning off-screen)
      // Since html2canvas captures what's in DOM, we can just target a specific div that layouts the report cleanly

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#ffffff', // Force white background for report
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`crowd-analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
    setIsExporting(false);
  };

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

  // Pie Chart Data: Crowd Density Distribution
  const getCrowdDensityData = () => {
    let normal = 0, warning = 0, critical = 0;
    readings.forEach(r => {
      if (r.people_count > 400) critical++;
      else if (r.people_count > 200) warning++;
      else normal++;
    });
    return [
      { name: 'Normal (<200)', value: normal, color: '#10b981' },
      { name: 'High (200-400)', value: warning, color: '#f59e0b' },
      { name: 'Critical (>400)', value: critical, color: '#ef4444' },
    ].filter(d => d.value > 0);
  };

  const hourlyTrends = getHourlyTrends();
  const locationData = getLocationData();
  const crowdDensityData = getCrowdDensityData();

  return (
    <div id="analytics-content" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-200 bg-clip-text text-transparent mb-2">
              Analytics & Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Detailed insights into crowd patterns and trends</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
              className="flex-1 md:flex-none"
            />

            <Button
              onClick={() => {
                const subject = `Crowd Analytics Report - ${timeRange}`;
                const body = `Crowd Analytics Report\n\nTotal Readings: ${readings.length}\nPeak Crowd: ${Math.max(...readings.map(r => r.people_count), 0)}\nAverage Crowd: ${readings.length > 0 ? Math.round(readings.reduce((sum, r) => sum + r.people_count, 0) / readings.length) : 0}\n\nGenerated on ${new Date().toLocaleString()}`;
                window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              }}
              variant="default"
              className="gap-2 flex-1 md:flex-none bg-blue-600 hover:bg-blue-700"
            >
              <TrendingUp className="w-4 h-4" />
              Share Report
            </Button>
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
            <Button
              onClick={exportToPDF}
              disabled={isExporting || readings.length === 0}
              variant="outline"
              className="gap-2 flex-1 md:flex-none border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Download className="w-4 h-4" />
              Export PDF
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
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
            <TabsTrigger value="trends">Hourly Trends</TabsTrigger>
            <TabsTrigger value="distribution">Density</TabsTrigger>
            <TabsTrigger value="peaks">Peak Analysis</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800">
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
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#1e293b'
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

          <TabsContent value="distribution">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Crowd Density Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={crowdDensityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {crowdDensityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
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
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800">
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

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Recommendations</h3>
                  <div className="text-sm text-yellow-700 dark:text-yellow-500 space-y-1">
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

      {/* Hidden Print/Report Container */}
      <div
        id="report-container"
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '800px', // Fixed width A4-like
          padding: '40px',
          backgroundColor: 'white',
          color: '#0f172a' // slate-900
        }}
      >
        <div className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crowd Analytics Report</h1>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Generated: {new Date().toLocaleString()}</span>
            <span>Range: {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Total Readings</h3>
            <p className="text-2xl font-bold text-blue-600">{readings.length}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Peak Crowd</h3>
            <p className="text-2xl font-bold text-blue-600">{Math.max(...readings.map(r => r.people_count), 0)}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4 text-center">Crowd Density Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={crowdDensityData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {crowdDensityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4 text-center">Hourly Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="average" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-xs text-slate-400">
          Generated by CrowdWatch Analytics System
        </div>
      </div>
    </div >
  );
}
