import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Upload, 
  BarChart3, 
  AlertTriangle,
  Download,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions() {
  const actions = [
    {
      title: "Process Image",
      description: "Analyze new images",
      icon: Upload,
      url: createPageUrl("Upload"),
      color: "bg-blue-500"
    },
    {
      title: "View Analytics", 
      description: "Detailed reports",
      icon: BarChart3,
      url: createPageUrl("Analytics"),
      color: "bg-purple-500"
    },
    {
      title: "Alert Settings",
      description: "Configure thresholds", 
      icon: Settings,
      url: createPageUrl("Settings"),
      color: "bg-green-500"
    }
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Link key={index} to={action.url}>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 p-4 h-auto hover:shadow-md transition-all duration-200"
            >
              <div className={`p-2 rounded-lg ${action.color} bg-opacity-20`}>
                <action.icon className={`w-4 h-4 ${action.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="text-left">
                <p className="font-medium">{action.title}</p>
                <p className="text-sm text-slate-500">{action.description}</p>
              </div>
            </Button>
          </Link>
        ))}
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 p-4 h-auto hover:shadow-md transition-all duration-200"
          onClick={() => window.location.reload()}
        >
          <div className="p-2 rounded-lg bg-gray-500 bg-opacity-20">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-left">
            <p className="font-medium">Refresh Data</p>
            <p className="text-sm text-slate-500">Update all readings</p>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}