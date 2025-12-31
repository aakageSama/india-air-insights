// Air Quality Intelligence Platform - Type Definitions

export type CityType = 'metro' | 'tier2' | 'industrial';

export interface City {
  id: string;
  name: string;
  state: string;
  type: CityType;
  openAqName?: string; // Name used in OpenAQ API
}

export type DataSource = 'GOVERNMENT' | 'INTERNATIONAL' | 'HISTORICAL' | 'IOT_SENSOR';

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unavailable';

export interface Pollutant {
  name: string;
  value: number | null;
  unit: string;
}

export interface AQIReading {
  source: DataSource;
  aqi: number | null;
  pollutants: Pollutant[];
  timestamp: string | null;
  freshness: FreshnessStatus;
  confidence: 'high' | 'medium' | 'low' | 'uncalibrated';
  notes?: string;
}

export interface IoTReading {
  source: 'IOT_SENSOR';
  aqi: number;
  timestamp: string;
  cityType: CityType;
  confidence: 'uncalibrated';
}

export interface AgreementAnalysis {
  level: 'high' | 'partial' | 'outlier' | 'insufficient';
  spread: number | null;
  explanation: string;
}

export interface DerivedAQI {
  value: number | null;
  confidence: number; // 0-100
  sources: DataSource[];
  methodology: string;
}

// AQI Categories based on Indian National Air Quality Index
export interface AQICategory {
  range: [number, number];
  label: string;
  color: string;
  healthImplication: string;
}

export const AQI_CATEGORIES: AQICategory[] = [
  { range: [0, 50], label: 'Good', color: 'aqi-good', healthImplication: 'Minimal impact' },
  { range: [51, 100], label: 'Satisfactory', color: 'aqi-satisfactory', healthImplication: 'Minor breathing discomfort to sensitive people' },
  { range: [101, 200], label: 'Moderate', color: 'aqi-moderate', healthImplication: 'Breathing discomfort to people with lung/heart disease' },
  { range: [201, 300], label: 'Poor', color: 'aqi-poor', healthImplication: 'Breathing discomfort on prolonged exposure' },
  { range: [301, 400], label: 'Very Poor', color: 'aqi-verypoor', healthImplication: 'Respiratory illness on prolonged exposure' },
  { range: [401, 500], label: 'Severe', color: 'aqi-severe', healthImplication: 'Affects healthy people, serious impact on those with existing diseases' },
];

export function getAQICategory(aqi: number): AQICategory {
  return AQI_CATEGORIES.find(cat => aqi >= cat.range[0] && aqi <= cat.range[1]) || AQI_CATEGORIES[5];
}
