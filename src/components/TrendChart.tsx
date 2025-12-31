// Simple Trend Chart Component
// Displays 24-hour AQI trend using basic bar visualization

import { useMemo } from 'react';

interface TrendDataPoint {
  time: string;
  aqi: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

export function TrendChart({ data, title = '24-Hour Trend' }: TrendChartProps) {
  const { max, min, normalized } = useMemo(() => {
    const values = data.map((d) => d.aqi);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;
    
    const normalizedData = data.map((d) => ({
      ...d,
      height: ((d.aqi - minVal) / range) * 100,
    }));
    
    return { max: maxVal, min: minVal, normalized: normalizedData };
  }, [data]);

  const getBarColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-aqi-good';
    if (aqi <= 100) return 'bg-aqi-satisfactory';
    if (aqi <= 200) return 'bg-aqi-moderate';
    if (aqi <= 300) return 'bg-aqi-poor';
    if (aqi <= 400) return 'bg-aqi-verypoor';
    return 'bg-aqi-severe';
  };

  const formatHour = (isoString: string) => {
    const date = new Date(isoString);
    return date.getHours().toString().padStart(2, '0');
  };

  // Sample to show fewer bars on small screens
  const displayData = normalized.filter((_, i) => i % 2 === 0 || normalized.length <= 12);

  return (
    <div className="source-card">
      <div className="flex items-center justify-between mb-4">
        <span className="data-label">{title}</span>
        <div className="text-xs font-mono text-muted-foreground">
          Range: {min} - {max}
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-24 mb-2">
        {displayData.map((point, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${formatHour(point.time)}:00 - AQI: ${point.aqi}`}
          >
            <div
              className={`w-full rounded-t ${getBarColor(point.aqi)} transition-all`}
              style={{ height: `${Math.max(point.height, 5)}%` }}
            />
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 text-xs font-mono text-muted-foreground">
        {displayData.map((point, i) => (
          <div key={i} className="flex-1 text-center">
            {i === 0 || i === displayData.length - 1 || i === Math.floor(displayData.length / 2)
              ? formatHour(point.time)
              : ''}
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground mt-3 italic">
        Note: Trend data is simulated for demonstration. In production, this would query historical database.
      </p>
    </div>
  );
}
