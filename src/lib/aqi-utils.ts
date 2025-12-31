// AQI Calculation, Normalization, and Reconciliation Utilities
// This module handles the core data processing logic for multi-source AQI data

import { AQIReading, AgreementAnalysis, DerivedAQI, FreshnessStatus, DataSource } from '@/types/aqi';

/**
 * Calculates data freshness based on timestamp age
 * Fresh: < 1 hour, Aging: 1-6 hours, Stale: > 6 hours
 */
export function calculateFreshness(timestamp: string | null): FreshnessStatus {
  if (!timestamp) return 'unavailable';
  
  const now = new Date();
  const dataTime = new Date(timestamp);
  const hoursDiff = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 1) return 'fresh';
  if (hoursDiff < 6) return 'aging';
  return 'stale';
}

/**
 * Normalizes AQI values from different scales to Indian AQI standard (0-500)
 * Different sources may use different scales (US EPA, European, etc.)
 */
export function normalizeAQI(value: number, sourceType: DataSource): number {
  // Indian AQI and US AQI are similar in range but differ slightly in breakpoints
  // For simplicity, we apply minor adjustments based on known differences
  switch (sourceType) {
    case 'INTERNATIONAL':
      // OpenAQ typically reports US EPA AQI - slight adjustment factor
      return Math.round(value * 0.95);
    case 'GOVERNMENT':
      // CPCB uses Indian AQI standard - no adjustment needed
      return value;
    case 'HISTORICAL':
      // Historical data assumed to be Indian AQI
      return value;
    case 'IOT_SENSOR':
      // Raw sensor data - no normalization, flagged as uncalibrated
      return value;
    default:
      return value;
  }
}

/**
 * Analyzes agreement between multiple AQI readings
 * Returns agreement level and explanation
 */
export function analyzeAgreement(readings: AQIReading[]): AgreementAnalysis {
  const validReadings = readings.filter(r => r.aqi !== null && r.freshness !== 'unavailable');
  
  if (validReadings.length === 0) {
    return {
      level: 'insufficient',
      spread: null,
      explanation: 'No valid data available from any source.'
    };
  }
  
  if (validReadings.length === 1) {
    return {
      level: 'insufficient',
      spread: null,
      explanation: `Only ${validReadings[0].source} data available. Cannot cross-validate.`
    };
  }
  
  const aqiValues = validReadings.map(r => r.aqi as number);
  const max = Math.max(...aqiValues);
  const min = Math.min(...aqiValues);
  const spread = max - min;
  
  // Calculate standard deviation for more nuanced analysis
  const mean = aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length;
  const variance = aqiValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / aqiValues.length;
  const stdDev = Math.sqrt(variance);
  
  if (spread <= 20 && stdDev <= 10) {
    return {
      level: 'high',
      spread,
      explanation: `Sources agree within ${spread} AQI points. High confidence in data.`
    };
  }
  
  if (spread <= 50 && stdDev <= 25) {
    return {
      level: 'partial',
      spread,
      explanation: `Sources differ by ${spread} AQI points. Possible local variations or measurement timing differences.`
    };
  }
  
  return {
    level: 'outlier',
    spread,
    explanation: `Significant disagreement (spread: ${spread}). Possible sensor calibration issues, local hotspots, or data staleness.`
  };
}

/**
 * Calculates a confidence-weighted derived AQI
 * Weights are assigned based on source reliability and data freshness
 */
export function calculateDerivedAQI(readings: AQIReading[]): DerivedAQI {
  const validReadings = readings.filter(r => r.aqi !== null && r.freshness !== 'unavailable');
  
  if (validReadings.length === 0) {
    return {
      value: null,
      confidence: 0,
      sources: [],
      methodology: 'No valid data available.'
    };
  }
  
  // Assign weights based on source reliability and freshness
  const weightedReadings = validReadings.map(r => {
    let weight = 1;
    
    // Source reliability weights
    switch (r.source) {
      case 'GOVERNMENT':
        weight *= 1.2; // Government data is authoritative
        break;
      case 'INTERNATIONAL':
        weight *= 1.0; // International sources are reliable
        break;
      case 'HISTORICAL':
        weight *= 0.6; // Historical data is less current
        break;
      case 'IOT_SENSOR':
        weight *= 0.3; // Uncalibrated sensors get lowest weight
        break;
    }
    
    // Freshness adjustments
    switch (r.freshness) {
      case 'fresh':
        weight *= 1.0;
        break;
      case 'aging':
        weight *= 0.7;
        break;
      case 'stale':
        weight *= 0.4;
        break;
    }
    
    // Confidence adjustments
    switch (r.confidence) {
      case 'high':
        weight *= 1.0;
        break;
      case 'medium':
        weight *= 0.8;
        break;
      case 'low':
        weight *= 0.5;
        break;
      case 'uncalibrated':
        weight *= 0.3;
        break;
    }
    
    return { reading: r, weight };
  });
  
  const totalWeight = weightedReadings.reduce((sum, wr) => sum + wr.weight, 0);
  const weightedSum = weightedReadings.reduce((sum, wr) => sum + (wr.reading.aqi as number) * wr.weight, 0);
  
  const derivedValue = Math.round(weightedSum / totalWeight);
  
  // Calculate confidence as percentage based on data quality
  const maxPossibleWeight = validReadings.length * 1.2 * 1.0 * 1.0; // Best case weights
  const confidence = Math.min(100, Math.round((totalWeight / maxPossibleWeight) * 100));
  
  const sourceList = validReadings.map(r => r.source);
  const weightExplanations = weightedReadings
    .map(wr => `${wr.reading.source}: ${wr.weight.toFixed(2)}`)
    .join(', ');
  
  return {
    value: derivedValue,
    confidence,
    sources: sourceList,
    methodology: `Weighted average using ${validReadings.length} source(s). Weights: [${weightExplanations}]. Higher weights given to government data and fresh readings.`
  };
}

/**
 * Formats timestamp for display
 */
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Calculates time since last update in human-readable format
 */
export function timeSince(timestamp: string | null): string {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const dataTime = new Date(timestamp);
  const diffMs = now.getTime() - dataTime.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
