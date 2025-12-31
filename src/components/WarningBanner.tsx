// Warning Banner Component
// Displays data quality warnings and uncertainty notices

import { AQIReading, AgreementAnalysis } from '@/types/aqi';

interface WarningBannerProps {
  readings: AQIReading[];
  agreement: AgreementAnalysis;
}

export function WarningBanner({ readings, agreement }: WarningBannerProps) {
  const warnings: string[] = [];

  // Check for missing data
  const unavailableSources = readings.filter((r) => r.freshness === 'unavailable');
  if (unavailableSources.length > 0) {
    warnings.push(
      `Missing data from: ${unavailableSources.map((r) => r.source).join(', ')}. Cross-validation limited.`
    );
  }

  // Check for stale data
  const staleSources = readings.filter((r) => r.freshness === 'stale');
  if (staleSources.length > 0) {
    warnings.push(
      `Stale data from: ${staleSources.map((r) => r.source).join(', ')}. Values may not reflect current conditions.`
    );
  }

  // Check for single source
  const validSources = readings.filter((r) => r.aqi !== null && r.freshness !== 'unavailable');
  if (validSources.length === 1) {
    warnings.push(
      `Only ${validSources[0].source} data available. Cannot cross-validate with other sources.`
    );
  }

  // Check for disagreement
  if (agreement.level === 'outlier' && agreement.spread !== null) {
    warnings.push(
      `Significant disagreement between sources (spread: ${agreement.spread} AQI points). Possible local variations, sensor issues, or timing differences.`
    );
  }

  // Check for IoT sensor
  const iotReading = readings.find((r) => r.source === 'IOT_SENSOR');
  if (iotReading && iotReading.aqi !== null) {
    const otherReadings = readings.filter(
      (r) => r.source !== 'IOT_SENSOR' && r.aqi !== null
    );
    if (otherReadings.length > 0) {
      const avgOther =
        otherReadings.reduce((sum, r) => sum + (r.aqi || 0), 0) / otherReadings.length;
      const iotDiff = Math.abs(iotReading.aqi - avgOther);
      
      if (iotDiff > 50) {
        warnings.push(
          `IoT sensor reading differs significantly from other sources (±${Math.round(iotDiff)} AQI). Possible local hotspot, sensor drift, or calibration issue.`
        );
      }
    }
  }

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning, i) => (
        <div key={i} className="warning-banner">
          <span className="font-semibold">⚠ Warning:</span> {warning}
        </div>
      ))}
    </div>
  );
}
