import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Upload, 
  Shield,
  Users,
  Camera,
  AlertTriangle
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Badge } from "./components/ui/badge";

const navigationItems = [
  {
    title: "Live Monitor",
    url: createPageUrl("Dashboard"),
    icon: Activity,
    description: "Real-time crowd monitoring"
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
    description: "Historical data & reports"
  },
  {
    title: "Process Image",
    url: createPageUrl("Upload"),
    icon: Upload,
    description: "Manual image analysis"
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
    description: "Thresholds & alerts"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">CrowdWatch</h2>
                <p className="text-xs text-slate-500 font-medium">IoT Monitoring System</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border border-blue-100' 
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <div>
                            <span className="font-medium">{item.title}</span>
                            <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                System Status
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">System Online</span>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Active Devices</span>
                      <Badge variant="outline" className="text-xs">5 ESP32-CAM</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-slate-500">
                      <div>• Main Entrance: Active</div>
                      <div>• Food Court: Active</div>
                      <div>• Exhibition Hall: Active</div>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
              <Shield className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">Emergency</p>
                <p className="text-xs text-red-600">911 • +1-555-0911</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h1 className="text-lg font-bold text-slate-900">CrowdWatch</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}