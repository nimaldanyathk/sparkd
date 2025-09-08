import React, { useState, useEffect } from "react";
import { CrowdReading, AlertSettings } from "@/entities/all";
import { SendEmail } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  MapPin,
  ThermometerSun,
  Droplets,
  Camera,
  Wifi,
  Shield
} from "lucide-react";

import LiveStatsCards from "../components/dashboard/LiveStatsCards";
import LocationCards from "../components/dashboard/LocationCards";
import RecentAlerts from "../components/dashboard/RecentAlerts";
import RealTimeChart from "../components/dashboard/RealTimeChart";
import QuickActions from "../components/dashboard/QuickActions";

export default function Dashboard() {
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [readingsData, settingsData] = await Promise.all([
        CrowdReading.list('-created_date', 100),
        AlertSettings.list()
      ]);
      
      setReadings(readingsData);
      setSettings(settingsData);
      
      // Filter recent alerts (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAlerts = readingsData.filter(reading => 
        reading.alert_triggered && new Date(reading.created_date) > oneHourAgo
      );
      setAlerts(recentAlerts);
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStats = () => {
    if (!readings.length) return { total: 0, locations: {} };
    
    const locationStats = {};
    const locations = ['main_entrance', 'food_court', 'exhibition_hall', 'parking_area', 'emergency_exit'];
    
    locations.forEach(location => {
      const locationReadings = readings.filter(r => r.location === location);
      const latest = locationReadings[0]; // Most recent
      locationStats[location] = {
        current: latest?.people_count || 0,
        status: getLocationStatus(location, latest?.people_count || 0),
        lastUpdate: latest?.created_date,
        temperature: latest?.temperature,
        humidity: latest?.humidity
      };
    });
    
    const total = Object.values(locationStats).reduce((sum, loc) => sum + loc.current, 0);
    
    return { total, locations: locationStats };
  };

  const getLocationStatus = (location, count) => {
    const setting = settings.find(s => s.location === location);
    if (!setting) return 'normal';
    
    const warningLimit = setting.max_capacity * setting.warning_threshold;
    const criticalLimit = setting.max_capacity * setting.critical_threshold;
    
    if (count >= criticalLimit) return 'critical';
    if (count >= warningLimit) return 'warning';
    return 'normal';
  };

  const stats = getCurrentStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Live Crowd Monitor
            </h1>
          </div>
          <p className="text-slate-600">Real-time monitoring across all locations • Last updated: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Live Stats */}
        <LiveStatsCards 
          stats={stats} 
          alerts={alerts}
          isLoading={isLoading}
        />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <LocationCards 
              locations={stats.locations}
              settings={settings}
              isLoading={isLoading}
            />
            
            <RealTimeChart 
              readings={readings}
              isLoading={isLoading}
            />
          </div>
          
          <div className="space-y-6">
            <RecentAlerts 
              alerts={alerts}
              isLoading={isLoading}
            />
            
            <QuickActions />
            
            {/* System Health */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Network Status</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Active Cameras</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">5/5</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">AI Processing</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}