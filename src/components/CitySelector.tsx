// City Selector Component
// Provides dropdown selection with city type classification

import { City, CityType } from '@/types/aqi';
import { INDIAN_CITIES } from '@/lib/cities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CitySelectorProps {
  selectedCity: City | null;
  onCityChange: (city: City) => void;
}

const cityTypeLabels: Record<CityType, string> = {
  metro: 'METRO',
  tier2: 'TIER-2',
  industrial: 'INDUSTRIAL',
};

export function CitySelector({ selectedCity, onCityChange }: CitySelectorProps) {
  const handleChange = (value: string) => {
    const city = INDIAN_CITIES.find((c) => c.id === value);
    if (city) onCityChange(city);
  };

  const getCityBadgeClass = (type: CityType) => {
    switch (type) {
      case 'metro':
        return 'city-badge-metro';
      case 'tier2':
        return 'city-badge-tier2';
      case 'industrial':
        return 'city-badge-industrial';
    }
  };

  return (
    <div className="space-y-2">
      <label className="data-label">Select City</label>
      <Select value={selectedCity?.id || ''} onValueChange={handleChange}>
        <SelectTrigger className="w-full font-mono bg-card">
          <SelectValue placeholder="Choose a city..." />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border">
          {INDIAN_CITIES.map((city) => (
            <SelectItem key={city.id} value={city.id} className="font-mono">
              <div className="flex items-center gap-3">
                <span>{city.name}</span>
                <span className="text-muted-foreground text-xs">{city.state}</span>
                <span className={getCityBadgeClass(city.type)}>
                  {cityTypeLabels[city.type]}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
