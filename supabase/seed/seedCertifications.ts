import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { SENSOR_CERTIFICATIONS, type SensorCertification } from '../../src/data/certificationData';

type SensorRecord = {
  slug: string;
  id: string;
};

type CountryRecord = {
  iso3: string;
  id: string;
};

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function upsertSensorTypes() {
  const payload = SENSOR_CERTIFICATIONS.map((sensor) => ({
    name: sensor.label,
    slug: sensor.slug,
    description: sensor.description
  }));

  const { data, error } = await supabase.from('sensor_types').upsert(payload, {
    onConflict: 'slug'
  }).select('id, slug');

  if (error) {
    throw error;
  }

  return new Map<string, SensorRecord>(data.map((row) => [row.slug, row]));
}

function extractUniqueCountries(sensors: SensorCertification[]) {
  const map = new Map<string, { name: string; display_name: string; iso2: string; iso3: string }>();

  sensors.forEach((sensor) => {
    sensor.countries.forEach((country) => {
      if (!map.has(country.iso3)) {
        map.set(country.iso3, {
          name: country.countryName,
          display_name: country.displayName ?? country.countryName,
          iso2: country.iso2,
          iso3: country.iso3
        });
      }
    });
  });

  return Array.from(map.values());
}

async function upsertCountries() {
  const payload = extractUniqueCountries(SENSOR_CERTIFICATIONS);

  const { data, error } = await supabase.from('countries').upsert(payload, {
    onConflict: 'iso3'
  }).select('id, iso3');

  if (error) {
    throw error;
  }

  return new Map<string, CountryRecord>(data.map((row) => [row.iso3, row]));
}

async function upsertCertifications(sensorMap: Map<string, SensorRecord>, countryMap: Map<string, CountryRecord>) {
  const rows = SENSOR_CERTIFICATIONS.flatMap((sensor) =>
    sensor.countries.map((country) => ({
      sensor_type_id: sensorMap.get(sensor.slug)?.id,
      country_id: countryMap.get(country.iso3)?.id,
      certification_scheme: country.certificationScheme ?? null,
      status: country.status,
      duration_weeks_min: country.durationWeeks?.min ?? null,
      duration_weeks_max: country.durationWeeks?.max ?? null,
      notes: country.notes ?? null
    }))
  );

  if (rows.some((row) => !row.sensor_type_id || !row.country_id)) {
    throw new Error('Failed to resolve sensor or country references while preparing certification rows.');
  }

  const { error } = await supabase.from('certification_records').upsert(rows, {
    onConflict: 'sensor_type_id,country_id'
  });

  if (error) {
    throw error;
  }
}

async function main() {
  const sensorMap = await upsertSensorTypes();
  const countryMap = await upsertCountries();
  await upsertCertifications(sensorMap, countryMap);
  console.log('Seeded certification data successfully.');
}

main().catch((error) => {
  console.error('Failed to seed Supabase data', error);
  process.exit(1);
});
