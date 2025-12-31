// AQI Source Card Component
// Displays AQI reading from a single data source with all metadata

import { AQIReading, getAQICategory } from '@/types/aqi';
import { FreshnessIndicator } from './FreshnessIndicator';
import { formatTimestamp } from '@/lib/aqi-utils';

interface AQISourceCardProps {
  reading: AQIReading;
  isLoading?: boolean;
}

const sourceLabels: Record<string, string> = {
  GOVERNMENT: 'CPCB (Government)',
  INTERNATIONAL: 'OpenAQ (International)',
  HISTORICAL: 'Historical Dataset',
  IOT_SENSOR: 'Local IoT Sensor',
};

const sourceDescriptions: Record<string, string> = {
  GOVERNMENT: 'Central Pollution Control Board monitoring network. Authoritative for regulatory purposes.',
  INTERNATIONAL: 'OpenAQ global air quality platform. Aggregates data from multiple sources.',
  HISTORICAL: 'Cached historical dataset. Useful for trends but may not reflect current conditions.',
  IOT_SENSOR: 'Local sensor reading. Uncalibrated, treat with caution.',
};

export function AQISourceCard({ reading, isLoading }: AQISourceCardProps) {
  const category = reading.aqi !== null ? getAQICategory(reading.aqi) : null;

  const getAQIColorClass = () => {
    if (!category) return 'text-muted-foreground';
    switch (category.color) {
      case 'aqi-good':
        return 'text-aqi-good';
      case 'aqi-satisfactory':
        return 'text-aqi-satisfactory';
      case 'aqi-moderate':
        return 'text-aqi-moderate';
      case 'aqi-poor':
        return 'text-aqi-poor';
      case 'aqi-verypoor':
        return 'text-aqi-verypoor';
      case 'aqi-severe':
        return 'text-aqi-severe';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="source-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="source-tag">{reading.source}</span>
          <p className="text-xs text-muted-foreground mt-1">
            {sourceLabels[reading.source]}
          </p>
        </div>
        <FreshnessIndicator freshness={reading.freshness} timestamp={reading.timestamp} />
      </div>

      {/* AQI Value */}
      <div className="mb-3">
        {isLoading ? (
          <div className="aqi-value text-muted-foreground">---</div>
        ) : reading.aqi !== null ? (
          <div className="flex items-baseline gap-2">
            <span className={`aqi-value ${getAQIColorClass()}`}>{reading.aqi}</span>
            {category && (
              <span className={`text-sm font-mono ${getAQIColorClass()}`}>
                {category.label}
              </span>
            )}
          </div>
        ) : (
          <div className="aqi-value text-muted-foreground">N/A</div>
        )}
      </div>

      {/* Pollutants */}
      {reading.pollutants.length > 0 && (
        <div className="data-grid mb-3">
          {reading.pollutants.map((p) => (
            <div key={p.name} className="data-row">
              <span className="data-label">{p.name}</span>
              <span className="data-value">
                {p.value !== null ? `${p.value} ${p.unit}` : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-muted-foreground border-t border-dashed border-border pt-2 mt-2">
        <div className="flex justify-between">
          <span>Last updated:</span>
          <span className="font-mono">{formatTimestamp(reading.timestamp)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Confidence:</span>
          <span className="font-mono uppercase">{reading.confidence}</span>
        </div>
      </div>

      {/* Notes */}
      {reading.notes && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          {reading.notes}
        </p>
      )}

      {/* Source description tooltip */}
      <details className="mt-2">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          About this source
        </summary>
        <p className="text-xs text-muted-foreground mt-1 pl-2 border-l-2 border-border">
          {sourceDescriptions[reading.source]}
        </p>
      </details>
    </div>
  );
}
