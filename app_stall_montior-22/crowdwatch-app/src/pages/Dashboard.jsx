import React, { useState, useEffect } from "react";
import { CrowdReading, AlertSettings } from "../entities/all";
import { SendEmail } from "../integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
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
    const interval = setInterval(loadData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [readingsData, settingsData] = await Promise.all([
        CrowdReading.list('-created_date', 100),
        AlertSettings.list()
      ]);

      // Try to fetch counts.csv and override main_entrance with live count
      try {
        const csvText = await fetchCsvText();
        const rows = parseCsvRows(csvText);
        const latest = latestNumericCount(rows);
        if (latest) {
          const synthetic = {
            people_count: latest.count,
            confidence_score: 1,
            location: 'main_entrance',
            created_date: new Date().toISOString(),
            image_url: latest.image || undefined,
            temperature: readingsData[0]?.temperature,
            humidity: readingsData[0]?.humidity,
            device_id: readingsData[0]?.device_id || 'csv_feed'
          };
          // Put synthetic first so it is the "most recent"
          setReadings([synthetic, ...readingsData]);
        } else {
          setReadings(readingsData);
        }
      } catch (e) {
        console.warn('CSV live count not available:', e);
        setReadings(readingsData);
      }
      setSettings(settingsData);

      // Filter recent alerts (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAlerts = readingsData.filter(reading =>
        reading.alert_triggered && new Date(reading.created_date) > oneHourAgo
      );
      setAlerts(recentAlerts);

      // --- Auto Email Alert Logic ---
      const latestCount = readings[0]?.people_count || 0;

      // Determine threshold from settings (Main Entrance)
      const mainSetting = settings.find(s => s.location === 'main_entrance');
      // Default to 400 if not set, otherwise use max_capacity * critical_threshold (default 0.9)
      const threshold = mainSetting ? (mainSetting.max_capacity * (mainSetting.critical_threshold || 0.9)) : 400;

      // DEBUG: Log check every cycle to verify logic
      // console.log(`[DEBUG] Latest: ${latestCount}, Threshold: ${threshold}`);

      if (latestCount > threshold) {
        const lastSent = localStorage.getItem('lastAlertEmailSent');
        const now = Date.now();
        // REDUCED COOLDOWN: 10 seconds for testing
        if (!lastSent || (now - Number(lastSent)) > 10000) {

          console.log(`[LOGIC] Triggering Alert! Count (${latestCount}) > Threshold (${threshold})`);

          // 1. Send Email (via Backend to avoid client-side key issues)
          const recipientEmails = localStorage.getItem("crowd_recipient_emails") || "sparkd.team@gmail.com";
          console.log(`[EMAIL] Sending to: ${recipientEmails}`);

          fetch("http://localhost:5001/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: recipientEmails,
              subject: `[CRITICAL] High Crowd Density Detected: ${latestCount} People`,
              body: `Alert: High crowd density detected at Main Entrance.\n\nCurrent Count: ${latestCount}\nThreshold: ${threshold}\nTime: ${new Date().toLocaleString()}\n\nPlease deploy staff immediately.`
            })
          })
            .then(res => res.json())
            .then(data => {
              console.log("[EMAIL] Backend response:", data);
              if (data.status === "success" || data.status === "simulated") {
                console.log("[EMAIL] SUCCESS - Email sent/logged.");
                localStorage.setItem('lastAlertEmailSent', now);
              } else {
                console.error("[EMAIL] FAILED - Backend rejected:", data.error);
              }
            })
            .catch(err => console.error("[EMAIL] FETCH ERROR:", err));

          // 2. Send Webhook (Slack/Discord)
          const webhookUrl = localStorage.getItem("crowd_webhook_url");
          if (webhookUrl) {
            fetch("http://localhost:5001/send-webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: webhookUrl,
                message: `🚨 **CRITICAL ALERT** 🚨\nHigh crowd density detected at **Main Entrance**.\nCount: **${latestCount}** (Threshold: ${threshold})`
              })
            }).catch(err => console.error("Webhook triggers failed", err));
          }
        } else {
          // console.log(`[DEBUG] Alert Cooldown Active. Wait ${Math.ceil((10000 - (now - Number(lastSent)))/1000)}s`);
        }
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }

  };

  const getCurrentStats = () => {
    if (!readings.length) return { total: 0, locations: {} };

    const locationStats = {};
    const locations = ['main_entrance'];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
              Live Crowd Monitor
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Real-time monitoring across all locations • Last updated: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Live Stats */}
        <div className="mb-6">
          <LiveStatsCards
            stats={stats}
            alerts={alerts}
            isLoading={isLoading}
          />
        </div>

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
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Network Status</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Active Cameras</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">5/5</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">AI Processing</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
// === CSV Live Count Helpers ===
async function fetchCsvText() {
  const res = await fetch('/counts.csv?t=' + Date.now());
  if (!res.ok) throw new Error('Failed to fetch counts.csv: ' + res.status);
  return await res.text();
}
function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 3) continue;

    const image = parts[0].trim();
    let ts = parts[1].trim();     // may be empty
    const countStr = parts[2].trim();

    // Only skip if count is missing
    if (!countStr) continue;

    // Normalize timestamp if present
    if (ts) {
      if (ts.includes("T")) {
        try {
          ts = new Date(ts).toISOString().replace("T", " ").replace("Z", "");
        } catch (e) {
          console.warn("Bad timestamp:", ts);
        }
      }
    }

    // Only push rows with numeric counts
    const count = Number(countStr);
    if (Number.isFinite(count)) {
      rows.push([image, ts || null, count]); // allow null timestamp
    }
  }

  return rows;
}

function latestNumericCount(rows) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const n = Number(rows[i][2]);
    if (Number.isFinite(n)) return { count: n, ts: rows[i][1], image: rows[i][0] };
  }
  return null;
}
