import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../../components/ui/badge";
import { AlertTriangle, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";

const locationNames = {
  main_entrance: "Main Entrance",
  food_court: "Food Court", 
  exhibition_hall: "Exhibition Hall",
  parking_area: "Parking Area",
  emergency_exit: "Emergency Exit"
};

export default function RecentAlerts({ alerts, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-slate-600 font-medium">No recent alerts</p>
            <p className="text-sm text-slate-400 mt-1">All locations operating normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">
                      {locationNames[alert.location]}
                    </span>
                  </div>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Overcrowding
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-red-700">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{alert.people_count} people</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(alert.created_date), 'HH:mm')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}