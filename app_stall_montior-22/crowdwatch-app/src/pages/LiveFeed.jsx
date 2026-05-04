import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Camera, RefreshCw, Clock, Users } from "lucide-react";

export default function LiveFeed() {
    const [images, setImages] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/counts.csv?t=" + Date.now());
            const text = await res.text();
            const rows = text.split("\n").slice(1).filter(Boolean); // Skip header

            // Parse and reverse to get latest first
            const parsed = rows.map(row => {
                const cols = row.split(",");
                return {
                    filename: cols[0],
                    timestamp: cols[1],
                    count: parseInt(cols[2] || "0", 10),
                    processedTime: cols[3]
                };
            }).reverse();

            // Keep last 12
            setImages(parsed.slice(0, 12));
            setLastUpdate(new Date());
        } catch (e) {
            console.error("Error fetching live feed:", e);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Camera className="w-8 h-8 text-blue-500" />
                            Live Camera Feed
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Real-time processed frames from all active cameras
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        Updating live: {lastUpdate.toLocaleTimeString()}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {images.map((img, idx) => (
                        <Card key={idx} className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative aspect-video bg-slate-100 dark:bg-slate-950">
                                <img
                                    src={`http://localhost:5001/vis/${img.filename}`}
                                    alt="Surveillance Feed"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/600x400/1e293b/475569?text=Processing...";
                                    }}
                                />

                                {/* Overlay Badge - Live/Recent */}
                                {idx === 0 && (
                                    <div className="absolute top-2 left-2">
                                        <Badge className="bg-red-500 hover:bg-red-600 border-0 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></span>
                                            LIVE
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        <span>{img.count} Visitors</span>
                                    </div>
                                    {img.count > 400 && (
                                        <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                                            High Density
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{img.timestamp || "Just now"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
