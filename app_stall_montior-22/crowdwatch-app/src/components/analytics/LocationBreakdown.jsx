import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapPin } from 'lucide-react';

export default function LocationBreakdown({ locationData, isLoading }) {
  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {locationData.map(location => (
            <div key={location.name} className="flex justify-between items-center">
              <span>{location.name}</span>
              <span className="font-semibold">Peak: {location.peak}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}