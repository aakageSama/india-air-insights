// IoT Sensor Integration Section
// Optional feature for ingesting local sensor data

import { useState } from 'react';
import { CityType, IoTReading, AQIReading } from '@/types/aqi';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IoTSectionProps {
  onIoTReading: (reading: AQIReading | null) => void;
  otherReadings: AQIReading[];
}

export function IoTSection({ onIoTReading, otherReadings }: IoTSectionProps) {
  const [enabled, setEnabled] = useState(false);
  const [cityType, setCityType] = useState<CityType>('metro');
  const [manualAQI, setManualAQI] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onIoTReading(null);
      setIsSubmitted(false);
      setManualAQI('');
    }
  };

  const handleSubmit = () => {
    const aqiValue = parseInt(manualAQI, 10);
    if (isNaN(aqiValue) || aqiValue < 0 || aqiValue > 500) {
      return;
    }

    const iotReading: AQIReading = {
      source: 'IOT_SENSOR',
      aqi: aqiValue,
      pollutants: [],
      timestamp: new Date().toISOString(),
      freshness: 'fresh',
      confidence: 'uncalibrated',
      notes: `Manual IoT sensor input. City type: ${cityType.toUpperCase()}. Value is uncalibrated and should be treated with caution.`,
    };

    onIoTReading(iotReading);
    setIsSubmitted(true);
  };

  const handleSimulate = () => {
    // Generate realistic mock IoT value based on city type
    let baseAQI: number;
    switch (cityType) {
      case 'metro':
        baseAQI = 150 + Math.random() * 100;
        break;
      case 'tier2':
        baseAQI = 100 + Math.random() * 80;
        break;
      case 'industrial':
        baseAQI = 200 + Math.random() * 150;
        break;
    }

    const iotReading: AQIReading = {
      source: 'IOT_SENSOR',
      aqi: Math.round(baseAQI),
      pollutants: [],
      timestamp: new Date().toISOString(),
      freshness: 'fresh',
      confidence: 'uncalibrated',
      notes: `Simulated IoT sensor reading. City type: ${cityType.toUpperCase()}. Value is for demonstration purposes.`,
    };

    onIoTReading(iotReading);
    setManualAQI(iotReading.aqi?.toString() || '');
    setIsSubmitted(true);
  };

  // Calculate comparison with other sources
  const iotComparison = () => {
    if (!isSubmitted || !manualAQI) return null;

    const aqiValue = parseInt(manualAQI, 10);
    const validOthers = otherReadings.filter((r) => r.aqi !== null);
    
    if (validOthers.length === 0) {
      return {
        message: 'No other sources available for comparison.',
        level: 'info' as const,
      };
    }

    const avgOther = validOthers.reduce((sum, r) => sum + (r.aqi || 0), 0) / validOthers.length;
    const diff = aqiValue - avgOther;
    const absDiff = Math.abs(diff);

    if (absDiff <= 20) {
      return {
        message: `IoT reading aligns with other sources (within ±${Math.round(absDiff)} AQI).`,
        level: 'success' as const,
      };
    } else if (absDiff <= 50) {
      return {
        message: `IoT reading ${diff > 0 ? 'higher' : 'lower'} than average by ${Math.round(absDiff)} AQI. Possible local variation.`,
        level: 'warning' as const,
      };
    } else {
      return {
        message: `Significant deviation (${diff > 0 ? '+' : ''}${Math.round(diff)} AQI). Possible local hotspot, sensor drift, or calibration needed.`,
        level: 'error' as const,
      };
    }
  };

  const comparison = iotComparison();

  return (
    <div className="source-card border-dashed">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-semibold">📡 Local IoT Sensor (Optional)</span>
          <p className="text-xs text-muted-foreground mt-1">
            Ingest data from a local air quality sensor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {enabled ? 'ENABLED' : 'DISABLED'}
          </span>
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        </div>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* City type selector */}
          <div>
            <label className="data-label mb-1 block">Your location type</label>
            <Select value={cityType} onValueChange={(v) => setCityType(v as CityType)}>
              <SelectTrigger className="font-mono bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border">
                <SelectItem value="metro" className="font-mono">
                  <span className="city-badge-metro mr-2">METRO</span> Urban center
                </SelectItem>
                <SelectItem value="tier2" className="font-mono">
                  <span className="city-badge-tier2 mr-2">TIER-2</span> Growing city
                </SelectItem>
                <SelectItem value="industrial" className="font-mono">
                  <span className="city-badge-industrial mr-2">INDUSTRIAL</span> Industrial area
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AQI input */}
          <div>
            <label className="data-label mb-1 block">AQI Value (0-500)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                max="500"
                value={manualAQI}
                onChange={(e) => {
                  setManualAQI(e.target.value);
                  setIsSubmitted(false);
                }}
                placeholder="Enter AQI value..."
                className="font-mono bg-background"
              />
              <Button onClick={handleSubmit} variant="default" size="sm">
                Submit
              </Button>
              <Button onClick={handleSimulate} variant="outline" size="sm">
                Simulate
              </Button>
            </div>
          </div>

          {/* Comparison result */}
          {comparison && (
            <div
              className={`p-3 rounded border text-sm font-mono ${
                comparison.level === 'success'
                  ? 'bg-aqi-good/10 border-aqi-good/30 text-aqi-good'
                  : comparison.level === 'warning'
                  ? 'bg-warning/10 border-warning/30 text-warning-foreground'
                  : comparison.level === 'error'
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              {comparison.message}
            </div>
          )}

          {/* Architecture note */}
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              IoT integration architecture
            </summary>
            <div className="text-xs text-muted-foreground mt-2 pl-2 border-l-2 border-border font-mono space-y-1">
              <p>Production data flow:</p>
              <p className="pl-2">IoT Sensor → Edge Validation → Cloud Ingestion → Normalization → Dashboard</p>
              <p className="mt-2">Current implementation uses manual/simulated input for demonstration.</p>
              <p>Real sensors would require:</p>
              <ul className="list-disc list-inside pl-2">
                <li>Calibration against reference stations</li>
                <li>Range validation at edge</li>
                <li>Temporal consistency checks</li>
                <li>Sensor health monitoring</li>
              </ul>
            </div>
          </details>
        </div>
      )}

      {!enabled && (
        <p className="text-xs text-muted-foreground italic">
          Enable to compare local sensor readings with official data sources. This feature is optional and does not affect the main dashboard.
        </p>
      )}
    </div>
  );
}
