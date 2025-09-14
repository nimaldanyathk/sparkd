import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock } from 'lucide-react';

export default function PeakHoursChart({ readings, isLoading }) {
  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Peak Hours Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Peak hours chart would go here</p>
      </CardContent>
    </Card>
  );
}