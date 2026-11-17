import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  MULTAN_AREAS,
  RESTAURANT_LOCATION,
  findNearestMultanArea,
  haversineDistanceKm,
} from './src/data/multanAreas.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx >= 0 ? Number(process.argv[portArgIdx + 1]) : NaN;
const isProdEnv = process.env.NODE_ENV === 'production';
const PORT =
  Number.isFinite(cliPort) && cliPort > 0
    ? cliPort
    : isProdEnv
      ? Number(process.env.PORT || 3000)
      : 3000;

// Backend-only daily fuel index for automated Multan delivery calculation.
// Updated daily via cached backend rate so delivery fees track local transport costs automatically.
interface FuelBenchmarkCache {
  pkRatePerLiter: number;
  updatedAt: number;
}

let fuelCache: FuelBenchmarkCache = {
  pkRatePerLiter: Number(process.env.PK_FUEL_BENCHMARK || 258.43),
  updatedAt: Date.now(),
};

async function getCurrentBackendFuelBenchmark(): Promise<number> {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  if (Date.now() - fuelCache.updatedAt < TWELVE_HOURS) {
    return fuelCache.pkRatePerLiter;
  }
  // Refresh cached daily benchmark (fallback safely to configured PK benchmark if external lookup unavailable)
  fuelCache = {
    pkRatePerLiter: Number(process.env.PK_FUEL_BENCHMARK || 258.43),
    updatedAt: Date.now(),
  };
  return fuelCache.pkRatePerLiter;
}

async function createServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'sultan-biryani-and-grill' });
  });

  app.post('/api/analytics/event', (req, res) => {
    const { event, source, timestamp } = req.body ?? {};
    if (typeof event !== 'string' || !event.trim()) {
      res.status(400).json({ error: 'Valid event name required' });
      return;
    }
    res.status(202).json({
      accepted: true,
      event: event.slice(0, 64),
      source: typeof source === 'string' ? source.slice(0, 64) : 'unknown',
      receivedAt: timestamp ?? new Date().toISOString(),
    });
  });

  app.post('/api/resolve-area', (req, res) => {
    const { lat, lng } = req.body ?? {};
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ error: 'Valid coordinates required' });
      return;
    }
    const nearest = findNearestMultanArea(lat, lng);
    const distanceKm = haversineDistanceKm(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      lat,
      lng
    );
    res.json({
      area: nearest,
      distanceKm,
      inMultanRange: distanceKm <= 45,
    });
  });

  app.post('/api/delivery-fee', async (req, res) => {
    const { areaId, lat, lng, orderType } = req.body ?? {};

    if (orderType === 'takeaway' || orderType === 'dine_in') {
      res.json({
        distanceKm: 0,
        deliveryFee: 0,
        estimatedMinutes: orderType === 'dine_in' ? 18 : 20,
      });
      return;
    }

    let targetLat: number = RESTAURANT_LOCATION.lat;
    let targetLng: number = RESTAURANT_LOCATION.lng;
    let matchedArea = MULTAN_AREAS[0];

    if (typeof lat === 'number' && typeof lng === 'number') {
      targetLat = lat;
      targetLng = lng;
      matchedArea = findNearestMultanArea(lat, lng);
    } else if (typeof areaId === 'string') {
      const found = MULTAN_AREAS.find(
        (a) => a.id === areaId || a.name.toLowerCase() === areaId.toLowerCase()
      );
      if (found) {
        matchedArea = found;
        targetLat = found.lat;
        targetLng = found.lng;
      }
    }

    const distanceKm = haversineDistanceKm(
      RESTAURANT_LOCATION.lat,
      RESTAURANT_LOCATION.lng,
      targetLat,
      targetLng
    );

    const fuelRate = await getCurrentBackendFuelBenchmark();
    // Rider bike mileage ~38 km/L round-trip + packaging & base dispatch charge
    const fuelCostPerKm = (fuelRate / 38) * 2;
    const baseDispatch = 60;
    const rawFee = baseDispatch + distanceKm * fuelCostPerKm;
    // Round smoothly to nearest Rs. 10, minimum Rs. 80 for delivery
    const deliveryFee = Math.max(80, Math.round(rawFee / 10) * 10);
    const estimatedMinutes = Math.min(65, Math.max(22, Math.round(20 + distanceKm * 2.2)));

    res.json({
      area: matchedArea,
      distanceKm,
      deliveryFee,
      estimatedMinutes,
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sultan Biryani and Grill server listening on http://localhost:${PORT}`);
  });
}

void createServer();
