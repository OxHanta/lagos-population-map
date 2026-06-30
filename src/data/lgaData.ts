// Lagos LGA Population Density Data
// 2006 NPC census baseline, projected at ~3% annual growth for 2016/2021/2026
// Densities = projected population / land area km²

export type UrbanType = 'Urban' | 'Rural' | 'Mixed';
export type Year = 2016 | 2021 | 2026;

export interface LGAData {
  lat: number;
  lng: number;
  // 2006 census baseline population
  pop2006: number;
  // Projected populations
  pop2016: number;
  pop2021: number;
  pop2026: number;
  // Density per km² for each year
  density2016: number;
  density2021: number;
  density2026: number;
  area: string; // km²
  urban: UrbanType;
  region: string;
}

// Helper: project population from 2006 baseline using 3% annual growth
// Years from 2006: 2016=10yrs, 2021=15yrs, 2026=20yrs
function proj(base: number, years: number, rate = 0.03): number {
  return Math.round(base * Math.pow(1 + rate, years));
}

function pop(p: number): string {
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(2)}M`;
  return `${Math.round(p / 1000)}K`;
}

// 2006 NPC census populations (official federal figures)
const BASE_YEAR = 2006;

function makeLGA(
  lat: number,
  lng: number,
  pop2006: number,
  areaKm2: number,
  urban: UrbanType,
  region: string,
): LGAData {
  const p2016 = proj(pop2006, 2016 - BASE_YEAR);
  const p2021 = proj(pop2006, 2021 - BASE_YEAR);
  const p2026 = proj(pop2006, 2026 - BASE_YEAR);
  return {
    lat, lng,
    pop2006,
    pop2016: p2016,
    pop2021: p2021,
    pop2026: p2026,
    density2016: Math.round(p2016 / areaKm2),
    density2021: Math.round(p2021 / areaKm2),
    density2026: Math.round(p2026 / areaKm2),
    area: String(areaKm2),
    urban,
    region,
  };
}

export const lgaData: Record<string, LGAData> = {
  // Island LGAs
  'Lagos Island': makeLGA(6.4541, 3.3947,  209437,   8.7,   'Urban', 'Island'),
  'Eti-Osa':      makeLGA(6.4315, 3.4714,  287785,  45,     'Urban', 'Island'),
  'Lagos Mainland': makeLGA(6.4989, 3.3687, 217000,  20.18,  'Urban', 'Island'),

  // Central
  'Ajeromi-Ifelodun': makeLGA(6.4444, 3.3586, 687316,  13.9,  'Urban', 'Central'),
  'Mushin':            makeLGA(6.5148, 3.3466, 633009,  12.7,  'Urban', 'Central'),
  'Surulere':          makeLGA(6.4948, 3.3313, 504000,  23,    'Urban', 'Central'),
  'Shomolu':           makeLGA(6.5369, 3.3761, 309000,  15.5,  'Urban', 'Central'),

  // Western
  'Agege':        makeLGA(6.5492, 3.3325, 461743,  12.3,  'Urban', 'Western'),
  'Alimosho':     makeLGA(6.5714, 3.2876, 1288714, 137.8, 'Urban', 'Western'),
  'Ifako-Ijaye':  makeLGA(6.5893, 3.2883, 428000,  26,    'Urban', 'Western'),
  'Ikeja':        makeLGA(6.5969, 3.3420, 313196,  46.8,  'Urban', 'Western'),
  'Kosofe':       makeLGA(6.6000, 3.3000, 665000,  81,    'Urban', 'Western'),
  'Oshodi-Isolo': makeLGA(6.5733, 3.3512, 620476,  45,    'Urban', 'Western'),

  // Southern
  'Amuwo-Odofin': makeLGA(6.4311, 3.2897, 309209,  114.2, 'Urban',  'Southern'),
  'Badagry':      makeLGA(6.4189, 2.8811, 241093,  441,   'Rural',  'Southern'),
  'Ojo':          makeLGA(6.4559, 3.1818, 598196,  158,   'Urban',  'Southern'),
  'Apapa':        makeLGA(6.4475, 3.3610, 213000,  29,    'Urban',  'Southern'),

  // Eastern / Rural
  'Epe':          makeLGA(6.5842, 3.9833, 181409,  481,   'Rural',  'Eastern'),
  'Ikorodu':      makeLGA(6.6211, 3.5000, 535619,  209,   'Mixed',  'Eastern'),
  'Ibeju-Lekki':  makeLGA(6.4500, 3.6000, 114762,  466,   'Rural',  'Eastern'),
};

// Formatted population string for popup display
export function formatPop(data: LGAData, year: Year): string {
  const p = year === 2016 ? data.pop2016 : year === 2021 ? data.pop2021 : data.pop2026;
  return pop(p);
}

export const yearStats: Record<Year, { density: string; population: string; growth: string }> = {
  2016: { density: '3,419/km²', population: '~12.5 Million', growth: 'Baseline Year' },
  2021: { density: '4,713+/km²', population: '~15 Million',  growth: '+38% vs 2016' },
  2026: { density: '6,871/km²',  population: '~17–21 Million', growth: '+101% vs 2016' },
};

export function getDensity(data: LGAData, year: Year): number {
  if (year === 2016) return data.density2016;
  if (year === 2021) return data.density2021;
  return data.density2026;
}

export function getDensityColor(density: number): string {
  if (density >= 50000) return '#FF1744';
  if (density >= 20000) return '#FF6D00';
  if (density >= 10000) return '#FFD600';
  if (density >= 5000)  return '#00E676';
  if (density >= 1000)  return '#2979FF';
  return '#76FF03';
}

export function getDensityCategory(density: number): string {
  if (density >= 50000) return 'Extreme';
  if (density >= 20000) return 'Very High';
  if (density >= 10000) return 'High';
  if (density >= 5000)  return 'Medium';
  if (density >= 1000)  return 'Low';
  return 'Rural';
}

export const LEGEND_ITEMS = [
  { color: '#FF1744', label: 'Extreme (>50,000/km²)' },
  { color: '#FF6D00', label: 'Very High (20–50K/km²)' },
  { color: '#FFD600', label: 'High (10–20K/km²)' },
  { color: '#00E676', label: 'Medium (5–10K/km²)' },
  { color: '#2979FF', label: 'Low (1–5K/km²)' },
  { color: '#76FF03', label: 'Rural (<1,000/km²)' },
];

export const SATELLITE_LAYERS: Record<Year, { url: string; attribution: string; label: string }> = {
  2016: {
    // Wayback WB_2016_R22 — resolved internal tile ID (no redirect)
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/31144/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics (2016 Wayback)',
    label: '2016 Satellite Imagery',
  },
  2021: {
    // Wayback WB_2021_R17 — resolved internal tile ID (no redirect)
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/32645/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics (2021 Wayback)',
    label: '2021 Satellite Imagery',
  },
  2026: {
    // Wayback WB_2026_R05 — resolved internal tile ID (no redirect)
    url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/world_imagery/mapserver/tile/7110/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics (2026 Wayback)',
    label: '2026 Satellite Imagery',
  },
};
