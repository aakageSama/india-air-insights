// Data Freshness Indicator
// Shows visual indicator of data recency with timestamp

import { FreshnessStatus } from '@/types/aqi';
import { timeSince } from '@/lib/aqi-utils';

interface FreshnessIndicatorProps {
  freshness: FreshnessStatus;
  timestamp: string | null;
}

export function FreshnessIndicator({ freshness, timestamp }: FreshnessIndicatorProps) {
  const getClassName = () => {
    switch (freshness) {
      case 'fresh':
        return 'freshness-fresh';
      case 'aging':
        return 'freshness-aging';
      case 'stale':
        return 'freshness-stale';
      case 'unavailable':
        return 'freshness-unavailable';
    }
  };

  const getLabel = () => {
    switch (freshness) {
      case 'fresh':
        return 'FRESH';
      case 'aging':
        return 'AGING';
      case 'stale':
        return 'STALE';
      case 'unavailable':
        return 'UNAVAILABLE';
    }
  };

  const getIndicator = () => {
    switch (freshness) {
      case 'fresh':
        return '●';
      case 'aging':
        return '◐';
      case 'stale':
        return '○';
      case 'unavailable':
        return '✕';
    }
  };

  return (
    <span className={getClassName()}>
      <span>{getIndicator()}</span>
      <span>{getLabel()}</span>
      {timestamp && <span className="text-muted-foreground">({timeSince(timestamp)})</span>}
    </span>
  );
}
