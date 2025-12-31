// Air Quality Intelligence Platform - India
// Main Dashboard Page

import { useState, useEffect, useCallback } from 'react';
import { City, AQIReading } from '@/types/aqi';
import { INDIAN_CITIES } from '@/lib/cities';
import {
  fetchOpenAQData,
  fetchGovernmentData,
  fetchHistoricalData,
  generateTrendData,
} from '@/lib/data-sources';
import { analyzeAgreement, calculateDerivedAQI } from '@/lib/aqi-utils';
import { CitySelector } from '@/components/CitySelector';
import { CityTypeLegend } from '@/components/CityTypeLegend';
import { AQISourceCard } from '@/components/AQISourceCard';
import { DerivedAQIDisplay } from '@/components/DerivedAQI';
import { TrendChart } from '@/components/TrendChart';
import { WarningBanner } from '@/components/WarningBanner';
import { IoTSection } from '@/components/IoTSection';

const Index = () => {
  const [selectedCity, setSelectedCity] = useState<City | null>(INDIAN_CITIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [governmentData, setGovernmentData] = useState<AQIReading | null>(null);
  const [internationalData, setInternationalData] = useState<AQIReading | null>(null);
  const [historicalData, setHistoricalData] = useState<AQIReading | null>(null);
  const [iotData, setIotData] = useState<AQIReading | null>(null);
  const [trendData, setTrendData] = useState<{ time: string; aqi: number }[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Fetch data for selected city
  const fetchData = useCallback(async (city: City) => {
    setIsLoading(true);
    setIotData(null); // Reset IoT data on city change

    try {
      // Fetch all sources in parallel
      const [govt, intl, hist] = await Promise.all([
        fetchGovernmentData(city),
        fetchOpenAQData(city),
        fetchHistoricalData(city),
      ]);

      setGovernmentData(govt);
      setInternationalData(intl);
      setHistoricalData(hist);
      setTrendData(generateTrendData(city.id, 24));
      setLastFetchTime(new Date());
    } catch (error) {
      console.error('Error fetching AQI data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when city changes
  useEffect(() => {
    if (selectedCity) {
      fetchData(selectedCity);
    }
  }, [selectedCity, fetchData]);

  // Collect all readings for analysis
  const allReadings: AQIReading[] = [
    governmentData,
    internationalData,
    historicalData,
    iotData,
  ].filter((r): r is AQIReading => r !== null);

  // Calculate derived metrics
  const agreement = analyzeAgreement(allReadings);
  const derivedAQI = calculateDerivedAQI(allReadings);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Air Quality Intelligence Platform
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                Multi-source AQI monitoring for India
              </p>
            </div>
            <div className="text-right text-xs font-mono text-muted-foreground">
              <div>System Time: {new Date().toLocaleString('en-IN')}</div>
              {lastFetchTime && (
                <div>Last Fetch: {lastFetchTime.toLocaleTimeString('en-IN')}</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* City Selection Section */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CitySelector
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
            />
            <div className="flex items-end">
              <CityTypeLegend />
            </div>
          </div>

          {/* Selected city info */}
          {selectedCity && (
            <div className="p-3 bg-muted rounded text-sm font-mono">
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-semibold">{selectedCity.name}</span>
              <span className="text-muted-foreground">, {selectedCity.state}</span>
              <span className="mx-2">|</span>
              <span
                className={
                  selectedCity.type === 'metro'
                    ? 'city-badge-metro'
                    : selectedCity.type === 'tier2'
                    ? 'city-badge-tier2'
                    : 'city-badge-industrial'
                }
              >
                {selectedCity.type.toUpperCase()}
              </span>
            </div>
          )}
        </section>

        {/* Warnings */}
        {allReadings.length > 0 && (
          <WarningBanner readings={allReadings} agreement={agreement} />
        )}

        {/* Main Data Grid */}
        {selectedCity && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              AQI Data for {selectedCity.name}
            </h2>

            {/* Source Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {governmentData && (
                <AQISourceCard reading={governmentData} isLoading={isLoading} />
              )}
              {internationalData && (
                <AQISourceCard reading={internationalData} isLoading={isLoading} />
              )}
              {historicalData && (
                <AQISourceCard reading={historicalData} isLoading={isLoading} />
              )}
            </div>

            {/* Derived AQI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DerivedAQIDisplay derived={derivedAQI} agreement={agreement} />
              <TrendChart data={trendData} />
            </div>
          </section>
        )}

        {/* IoT Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Optional: Local Sensor Data</h2>
          <IoTSection
            onIoTReading={setIotData}
            otherReadings={allReadings.filter((r) => r.source !== 'IOT_SENSOR')}
          />

          {/* IoT Card if submitted */}
          {iotData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AQISourceCard reading={iotData} />
            </div>
          )}
        </section>

        {/* Data Sources Documentation */}
        <section className="space-y-4 pt-6 border-t border-border">
          <h2 className="text-lg font-semibold">Data Sources & Methodology</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="source-card">
              <h3 className="font-semibold mb-2">Government (CPCB)</h3>
              <p className="text-muted-foreground">
                Central Pollution Control Board monitoring network. Authoritative for
                regulatory purposes. May have 1-6 hour reporting delays.
              </p>
            </div>
            <div className="source-card">
              <h3 className="font-semibold mb-2">International (OpenAQ)</h3>
              <p className="text-muted-foreground">
                Global air quality data platform aggregating from multiple sources.
                Real-time updates when available. Coverage varies by city.
              </p>
            </div>
            <div className="source-card">
              <h3 className="font-semibold mb-2">Historical Dataset</h3>
              <p className="text-muted-foreground">
                Cached historical data for trend analysis. Not real-time. Useful for
                understanding typical patterns and as fallback.
              </p>
            </div>
          </div>

          {/* Assumptions & Limitations */}
          <details className="source-card">
            <summary className="font-semibold cursor-pointer hover:text-primary">
              Assumptions & Known Limitations
            </summary>
            <div className="mt-3 text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Normalization:</strong> Different sources may use different AQI
                calculation methodologies (US EPA vs Indian standards). A 5% adjustment
                is applied to international sources.
              </p>
              <p>
                <strong>Temporal alignment:</strong> Sources report at different
                intervals (hourly vs daily). Freshness indicators help identify stale
                data.
              </p>
              <p>
                <strong>Missing pollutants:</strong> Not all sources report all
                pollutants. AQI may be calculated from available data only.
              </p>
              <p>
                <strong>IoT sensors:</strong> Uncalibrated sensor data is weighted
                lower in derived calculations. Local variations may not indicate
                sensor error.
              </p>
              <p>
                <strong>Demo limitations:</strong> Government and historical data use
                cached values. OpenAQ API may be rate-limited. In production, all
                sources would be live.
              </p>
            </div>
          </details>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-border text-xs text-muted-foreground font-mono">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              Air Quality Intelligence Platform — Engineering Demo
            </div>
            <div>
              Data sources: CPCB, OpenAQ, Historical datasets | Visualization for
              educational purposes only
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
