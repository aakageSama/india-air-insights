// Data Source Integration Layer
// Handles fetching and normalizing data from multiple AQI sources
// NOTE: OpenAQ API is used as primary live source via edge function proxy
// Government and Historical data use cached/mock data for demo purposes

import { AQIReading, Pollutant, City } from '@/types/aqi';
import { calculateFreshness, normalizeAQI } from './aqi-utils';
import { supabase } from '@/integrations/supabase/client';

// Cached historical data (simulating Kaggle-sourced dataset)
// In production, this would be loaded from a JSON file or database
const HISTORICAL_DATA: Record<string, { aqi: number; pm25: number; pm10: number; timestamp: string }> = {
  delhi: { aqi: 285, pm25: 142, pm10: 198, timestamp: '2025-01-01T08:00:00Z' },
  mumbai: { aqi: 125, pm25: 58, pm10: 89, timestamp: '2025-01-01T07:30:00Z' },
  bangalore: { aqi: 98, pm25: 42, pm10: 67, timestamp: '2025-01-01T09:00:00Z' },
  kolkata: { aqi: 168, pm25: 82, pm10: 124, timestamp: '2025-01-01T08:15:00Z' },
  jaipur: { aqi: 195, pm25: 95, pm10: 145, timestamp: '2025-01-01T07:45:00Z' },
  lucknow: { aqi: 242, pm25: 118, pm10: 178, timestamp: '2025-01-01T08:30:00Z' },
  patna: { aqi: 278, pm25: 136, pm10: 195, timestamp: '2025-01-01T09:15:00Z' },
  kanpur: { aqi: 312, pm25: 158, pm10: 228, timestamp: '2025-01-01T07:00:00Z' },
  ghaziabad: { aqi: 298, pm25: 148, pm10: 212, timestamp: '2025-01-01T08:45:00Z' },
  faridabad: { aqi: 275, pm25: 134, pm10: 192, timestamp: '2025-01-01T09:30:00Z' },
};

// Government data cache (simulating CPCB data)
// In production, this would be fetched from data.gov.in API
const GOVERNMENT_DATA: Record<string, { aqi: number; pm25: number; pm10: number; no2: number; timestamp: string }> = {
  delhi: { aqi: 278, pm25: 138, pm10: 192, no2: 45, timestamp: '2025-01-01T09:00:00Z' },
  mumbai: { aqi: 118, pm25: 52, pm10: 82, no2: 28, timestamp: '2025-01-01T09:00:00Z' },
  bangalore: { aqi: 92, pm25: 38, pm10: 62, no2: 22, timestamp: '2025-01-01T09:00:00Z' },
  kolkata: { aqi: 162, pm25: 78, pm10: 118, no2: 38, timestamp: '2025-01-01T09:00:00Z' },
  jaipur: { aqi: 188, pm25: 92, pm10: 138, no2: 35, timestamp: '2025-01-01T09:00:00Z' },
  lucknow: { aqi: 235, pm25: 112, pm10: 172, no2: 42, timestamp: '2025-01-01T09:00:00Z' },
  patna: { aqi: 268, pm25: 132, pm10: 188, no2: 48, timestamp: '2025-01-01T09:00:00Z' },
  kanpur: { aqi: 305, pm25: 152, pm10: 218, no2: 52, timestamp: '2025-01-01T09:00:00Z' },
  ghaziabad: { aqi: 292, pm25: 142, pm10: 205, no2: 48, timestamp: '2025-01-01T09:00:00Z' },
  faridabad: { aqi: 268, pm25: 128, pm10: 185, no2: 44, timestamp: '2025-01-01T09:00:00Z' },
};

/**
 * Fetches AQI data from OpenAQ API via edge function proxy
 * Primary live data source for international comparison
 */
export async function fetchOpenAQData(city: City): Promise<AQIReading> {
  try {
    const cityName = city.openAqName || city.name;
    
    const { data, error } = await supabase.functions.invoke('openaq-proxy', {
      body: { city: cityName, country: 'IN', limit: 1 }
    });
    
    if (error) {
      throw new Error(error.message || 'Edge function error');
    }
    
    if (!data.results || data.results.length === 0) {
      // No data available for this city - return unavailable reading
      return {
        source: 'INTERNATIONAL',
        aqi: null,
        pollutants: [],
        timestamp: null,
        freshness: 'unavailable',
        confidence: 'low',
        notes: `No OpenAQ data available for ${city.name}. City may not have monitoring stations in OpenAQ network.`
      };
    }
    
    const result = data.results[0];
    const measurements = result.measurements || [];
    
    // Extract pollutant values
    const pollutants: Pollutant[] = measurements.map((m: { parameter: string; value: number; unit: string }) => ({
      name: m.parameter.toUpperCase(),
      value: m.value,
      unit: m.unit
    }));
    
    // Calculate AQI from PM2.5 if available (simplified calculation)
    const pm25 = measurements.find((m: { parameter: string }) => m.parameter === 'pm25');
    let aqi: number | null = null;
    
    if (pm25) {
      // Simplified AQI calculation from PM2.5 (US EPA method)
      aqi = calculateAQIFromPM25(pm25.value);
      aqi = normalizeAQI(aqi, 'INTERNATIONAL');
    }
    
    const timestamp = measurements[0]?.lastUpdated || null;
    
    return {
      source: 'INTERNATIONAL',
      aqi,
      pollutants,
      timestamp,
      freshness: calculateFreshness(timestamp),
      confidence: aqi !== null ? 'high' : 'low',
      notes: 'Data from OpenAQ network. AQI calculated from PM2.5 concentration.'
    };
  } catch (error) {
    console.error('OpenAQ fetch error:', error);
    return {
      source: 'INTERNATIONAL',
      aqi: null,
      pollutants: [],
      timestamp: null,
      freshness: 'unavailable',
      confidence: 'low',
      notes: `Failed to fetch OpenAQ data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Fetches government data (CPCB)
 * Uses cached data for demo - in production would call data.gov.in API
 */
export async function fetchGovernmentData(city: City): Promise<AQIReading> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const data = GOVERNMENT_DATA[city.id];
  
  if (!data) {
    return {
      source: 'GOVERNMENT',
      aqi: null,
      pollutants: [],
      timestamp: null,
      freshness: 'unavailable',
      confidence: 'low',
      notes: `No CPCB data available for ${city.name}.`
    };
  }
  
  const pollutants: Pollutant[] = [
    { name: 'PM2.5', value: data.pm25, unit: 'µg/m³' },
    { name: 'PM10', value: data.pm10, unit: 'µg/m³' },
    { name: 'NO₂', value: data.no2, unit: 'ppb' },
  ];
  
  return {
    source: 'GOVERNMENT',
    aqi: data.aqi,
    pollutants,
    timestamp: data.timestamp,
    freshness: calculateFreshness(data.timestamp),
    confidence: 'high',
    notes: 'Data from CPCB monitoring network. Considered authoritative for regulatory purposes.'
  };
}

/**
 * Fetches historical data from cached dataset
 * Used for trends and as fallback when live APIs fail
 */
export async function fetchHistoricalData(city: City): Promise<AQIReading> {
  // Simulate loading delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const data = HISTORICAL_DATA[city.id];
  
  if (!data) {
    return {
      source: 'HISTORICAL',
      aqi: null,
      pollutants: [],
      timestamp: null,
      freshness: 'unavailable',
      confidence: 'low',
      notes: `No historical data available for ${city.name}.`
    };
  }
  
  const pollutants: Pollutant[] = [
    { name: 'PM2.5', value: data.pm25, unit: 'µg/m³' },
    { name: 'PM10', value: data.pm10, unit: 'µg/m³' },
  ];
  
  return {
    source: 'HISTORICAL',
    aqi: data.aqi,
    pollutants,
    timestamp: data.timestamp,
    freshness: 'stale', // Historical data is always stale by definition
    confidence: 'medium',
    notes: 'Historical dataset (Kaggle-sourced). Useful for trend analysis but may not reflect current conditions.'
  };
}

/**
 * Simplified AQI calculation from PM2.5 concentration
 * Based on US EPA breakpoints
 */
function calculateAQIFromPM25(pm25: number): number {
  const breakpoints = [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];
  
  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      return Math.round(
        ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
      );
    }
  }
  
  return 500; // Beyond AQI scale
}

/**
 * Generates mock trend data for the past 24 hours
 * In production, this would query historical database
 */
export function generateTrendData(cityId: string, hours: number = 24): { time: string; aqi: number }[] {
  const baseAQI = HISTORICAL_DATA[cityId]?.aqi || 150;
  const data: { time: string; aqi: number }[] = [];
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date();
    time.setHours(time.getHours() - i);
    
    // Add some realistic variation (±15%)
    const variation = (Math.random() - 0.5) * 0.3 * baseAQI;
    const aqi = Math.max(0, Math.min(500, Math.round(baseAQI + variation)));
    
    data.push({
      time: time.toISOString(),
      aqi
    });
  }
  
  return data;
}
