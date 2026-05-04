import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  MapPin,
  ThermometerSun,
  Droplets,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const locationNames = {
  main_entrance: "Main Entrance",
  food_court: "Food Court", 
  exhibition_hall: "Exhibition Hall",
  parking_area: "Parking Area",
  emergency_exit: "Emergency Exit"
};

const locationIcons = {
  main_entrance: "🚪",
  food_court: "🍽️",
  exhibition_hall: "🏛️", 
  parking_area: "🚗",
  emergency_exit: "🚨"
};

export default function LocationCards({ locations, settings, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
        <CardHeader>
          <CardTitle>Location Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-lg">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical': return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      default: return <Badge className="bg-green-100 text-green-800 border-green-200">Normal</Badge>;
    }
  };

  const getCapacityPercentage = (location, current) => {
    const setting = settings.find(s => s.location === location);
    return setting ? Math.round((current / setting.max_capacity) * 100) : 0;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Location Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(locations).map(([location, data]) => {
            const capacityPercentage = getCapacityPercentage(location, data.current);
            const maxCapacity = settings.find(s => s.location === location)?.max_capacity || 100;
            
            return (
              <div key={location} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{locationIcons[location]}</span>
                    <h3 className="font-semibold text-slate-900">{locationNames[location]}</h3>
                  </div>
                  {getStatusBadge(data.status)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">{data.current}</span>
                    <span className="text-sm text-slate-500">/{maxCapacity} max</span>
                  </div>
                  
                  <Progress 
                    value={capacityPercentage} 
                    className="h-2"
                  />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {data.temperature && (
                      <div className="flex items-center gap-1">
                        <ThermometerSun className="w-4 h-4 text-orange-500" />
                        <span className="text-slate-600">{data.temperature}°C</span>
                      </div>
                    )}
                    {data.humidity && (
                      <div className="flex items-center gap-1">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-600">{data.humidity}%</span>
                      </div>
                    )}
                  </div>
                  
                  {data.lastUpdate && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Updated {format(new Date(data.lastUpdate), 'HH:mm:ss')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}