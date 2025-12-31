// Indian Cities Database with Classification
// Classification based on population, industrial activity, and urbanization

import { City } from '@/types/aqi';

export const INDIAN_CITIES: City[] = [
  // Metro Cities (Population > 4 million, major urban centers)
  { id: 'delhi', name: 'Delhi', state: 'Delhi', type: 'metro', openAqName: 'Delhi' },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', type: 'metro', openAqName: 'Mumbai' },
  { id: 'bangalore', name: 'Bengaluru', state: 'Karnataka', type: 'metro', openAqName: 'Bengaluru' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', type: 'metro', openAqName: 'Kolkata' },
  
  // Tier-2 Cities (Growing urban centers, 1-4 million)
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', type: 'tier2', openAqName: 'Jaipur' },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', type: 'tier2', openAqName: 'Lucknow' },
  { id: 'patna', name: 'Patna', state: 'Bihar', type: 'tier2', openAqName: 'Patna' },
  
  // Industrial Cities (Heavy industry, manufacturing hubs)
  { id: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', type: 'industrial', openAqName: 'Kanpur' },
  { id: 'ghaziabad', name: 'Ghaziabad', state: 'Uttar Pradesh', type: 'industrial', openAqName: 'Ghaziabad' },
  { id: 'faridabad', name: 'Faridabad', state: 'Haryana', type: 'industrial', openAqName: 'Faridabad' },
];

export function getCityById(id: string): City | undefined {
  return INDIAN_CITIES.find(city => city.id === id);
}

export function getCitiesByType(type: City['type']): City[] {
  return INDIAN_CITIES.filter(city => city.type === type);
}
