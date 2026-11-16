import type { MultanArea } from '../types.ts';

// 22-B, Model Town Market, Near Habib Metro Bank, Multan, Pakistan, 66000
export const RESTAURANT_LOCATION = {
  name: 'Sultan Biryani and Grill',
  address: '22-B, Model Town Market, Near Habib Metro Bank, Multan, Pakistan, 66000',
  phone: '03286422227',
  whatsappNumber: '923286422227',
  mapsUrl: 'https://maps.app.goo.gl/AHh4qpKNC6VNVGDh7',
  lat: 30.2016,
  lng: 71.4562,
} as const;

export const MULTAN_AREAS: MultanArea[] = [
  { id: 'model-town', name: 'Model Town (22-B & Blocks)', lat: 30.2016, lng: 71.4562, zone: 'Central Multan' },
  { id: 'model-town-ext', name: 'Model Town Extension', lat: 30.2054, lng: 71.4589, zone: 'Central Multan' },
  { id: 'gulgasht', name: 'Gulgasht Colony', lat: 30.2191, lng: 71.4664, zone: 'North Central' },
  { id: 'chungi-6', name: 'Chungi No. 6', lat: 30.2119, lng: 71.4612, zone: 'Central Multan' },
  { id: 'chungi-9', name: 'Chungi No. 9', lat: 30.2012, lng: 71.4694, zone: 'Central Multan' },
  { id: 'officers-colony', name: 'Officers Colony', lat: 30.2165, lng: 71.4718, zone: 'Central Multan' },
  { id: 'bosan-road', name: 'Bosan Road', lat: 30.2338, lng: 71.4821, zone: 'North Multan' },
  { id: 'zakariya-town', name: 'Zakariya Town', lat: 30.2485, lng: 71.4912, zone: 'North Multan' },
  { id: 'bzu', name: 'Bahauddin Zakariya University (BZU)', lat: 30.2611, lng: 71.5034, zone: 'North Multan' },
  { id: 'cantt', name: 'Multan Cantt', lat: 30.1932, lng: 71.4375, zone: 'Cantt' },
  { id: 'sadar-cantt', name: 'Sadar Bazar Cantt', lat: 30.1965, lng: 71.4412, zone: 'Cantt' },
  { id: 'mall-road-cantt', name: 'Mall Road Cantt', lat: 30.1895, lng: 71.4458, zone: 'Cantt' },
  { id: 'askari-1', name: 'Askari Colony 1', lat: 30.1846, lng: 71.4301, zone: 'Cantt' },
  { id: 'askari-2', name: 'Askari Colony 2', lat: 30.1782, lng: 71.4254, zone: 'Cantt' },
  { id: 'nawan-shehr', name: 'Nawan Shehr', lat: 30.1947, lng: 71.4628, zone: 'City Center' },
  { id: 'tariq-road', name: 'Tariq Road', lat: 30.1981, lng: 71.4521, zone: 'City Center' },
  { id: 'nishtar-road', name: 'Nishtar Road & Hospital', lat: 30.2008, lng: 71.4481, zone: 'City Center' },
  { id: 'hussain-agahi', name: 'Hussain Agahi', lat: 30.1941, lng: 71.4744, zone: 'Old City' },
  { id: 'ghanta-ghar', name: 'Ghanta Ghar Chowk', lat: 30.1986, lng: 71.4712, zone: 'Old City' },
  { id: 'haram-gate', name: 'Haram Gate', lat: 30.1924, lng: 71.4791, zone: 'Old City' },
  { id: 'bohar-gate', name: 'Bohar Gate', lat: 30.1903, lng: 71.4702, zone: 'Old City' },
  { id: 'pak-gate', name: 'Pak Gate', lat: 30.1968, lng: 71.4822, zone: 'Old City' },
  { id: 'daulat-gate', name: 'Daulat Gate', lat: 30.2015, lng: 71.4783, zone: 'Old City' },
  { id: 'delhi-gate', name: 'Delhi Gate', lat: 30.1998, lng: 71.4851, zone: 'Old City' },
  { id: 'new-multan', name: 'New Multan', lat: 30.2062, lng: 71.4987, zone: 'East Multan' },
  { id: 'shah-rukn-e-alam', name: 'Shah Rukn-e-Alam Colony', lat: 30.2005, lng: 71.5094, zone: 'East Multan' },
  { id: 'masoom-shah-road', name: 'Masoom Shah Road', lat: 30.2098, lng: 71.4922, zone: 'East Multan' },
  { id: 'chowk-kumharanwala', name: 'Chowk Kumharanwala', lat: 30.2143, lng: 71.5112, zone: 'East Multan' },
  { id: 'khanewal-road', name: 'Khanewal Road', lat: 30.2219, lng: 71.5245, zone: 'East Multan' },
  { id: 'mumtazabad', name: 'Mumtazabad', lat: 30.1755, lng: 71.4799, zone: 'South Multan' },
  { id: 'vehari-chowk', name: 'Vehari Chowk', lat: 30.1691, lng: 71.4915, zone: 'South Multan' },
  { id: 'vehari-road', name: 'Vehari Road', lat: 30.1632, lng: 71.5048, zone: 'South Multan' },
  { id: 'chowk-shah-abbas', name: 'Chowk Shah Abbas', lat: 30.1791, lng: 71.4978, zone: 'South East' },
  { id: 'bahawalpur-road', name: 'Bahawalpur Road', lat: 30.1642, lng: 71.4488, zone: 'South West' },
  { id: 'sher-shah-road', name: 'Sher Shah Road', lat: 30.1774, lng: 71.4182, zone: 'West Multan' },
  { id: 'qasim-bela', name: 'Qasim Bela', lat: 30.1942, lng: 71.3914, zone: 'West Multan' },
  { id: 'suraj-miani', name: 'Suraj Miani', lat: 30.2215, lng: 71.4258, zone: 'North West' },
  { id: 'wapda-town-1', name: 'Wapda Town Phase 1', lat: 30.2512, lng: 71.5194, zone: 'Northern Suburbs' },
  { id: 'wapda-town-2', name: 'Wapda Town Phase 2', lat: 30.2645, lng: 71.5318, zone: 'Northern Suburbs' },
  { id: 'wapda-town-3', name: 'Wapda Town Phase 3', lat: 30.2738, lng: 71.5425, zone: 'Northern Suburbs' },
  { id: 'buch-villas', name: 'Buch Executive Villas', lat: 30.2441, lng: 71.5112, zone: 'Northern Suburbs' },
  { id: 'royal-orchard', name: 'Royal Orchard Multan', lat: 30.2694, lng: 71.5521, zone: 'Northern Suburbs' },
  { id: 'dha-multan', name: 'DHA Multan', lat: 30.2895, lng: 71.5311, zone: 'DHA Multan' },
  { id: 'shalimar-colony', name: 'Shalimar Colony', lat: 30.2465, lng: 71.4785, zone: 'North Multan' },
  { id: 'lalazar-colony', name: 'Lalazar Colony', lat: 30.2145, lng: 71.4442, zone: 'West Central' },
  { id: 'shadab-colony', name: 'Shadab Colony', lat: 30.2251, lng: 71.4591, zone: 'North Central' },
];

export function formatPKR(amount: number): string {
  const safe = Math.round(Number.isFinite(amount) ? amount : 0);
  return `Rs. ${safe.toLocaleString('en-PK')}`;
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c * 1.28).toFixed(2));
}

export function findNearestMultanArea(lat: number, lng: number): MultanArea {
  let nearest = MULTAN_AREAS[0];
  let bestDist = Infinity;
  for (const area of MULTAN_AREAS) {
    const d = haversineDistanceKm(lat, lng, area.lat, area.lng);
    if (d < bestDist) {
      bestDist = d;
      nearest = area;
    }
  }
  return nearest;
}
