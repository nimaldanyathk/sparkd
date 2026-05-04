import React from 'react';
import { Button } from '../../components/ui/button';

export default function TimeRangeSelector({ value, onChange, className = '' }) {
  const ranges = [
    { label: 'Today', value: 'today' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' }
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {ranges.map(range => (
        <Button
          key={range.value}
          variant={value === range.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}