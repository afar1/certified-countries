'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  SENSOR_CERTIFICATIONS,
  type CountryCertification,
  type SensorCertification
} from '@/data/certificationData';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
import { CertificationMap } from './CertificationMap';

const STATUS_LABELS: Record<CountryCertification['status'], string> = {
  certified: 'Certified',
  in_progress: 'Lead Time',
  not_certified: 'Not Yet Certified'
};

const STATUS_DESCRIPTIONS: Record<CountryCertification['status'], string> = {
  certified: 'Ready for deployment today.',
  in_progress: 'We can pursue certification with the indicated lead time.',
  not_certified: 'We have not completed certification yet.'
};

export const STATUS_COLORS: Record<CountryCertification['status'], string> = {
  certified: '#2ecc71',
  in_progress: '#f4b740',
  not_certified: '#f06363'
};

const SENSOR_ORDER = SENSOR_CERTIFICATIONS.map((sensor) => sensor.slug);

function formatDuration(country: CountryCertification) {
  if (!country.durationWeeks) {
    return null;
  }
  const { min, max } = country.durationWeeks;
  if (min && max && min !== max) {
    return `${min}–${max} weeks`;
  }
  return `${min} weeks`;
}

function createSearchMatcher(query: string) {
  const normalised = query.trim().toLowerCase();
  if (!normalised) {
    return () => true;
  }
  return (country: CountryCertification) => {
    const haystack = [
      country.displayName,
      country.countryName,
      country.certificationScheme,
      formatDuration(country) ?? '',
      country.notes ?? ''
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalised);
  };
}

function getActiveSensor(sensors: SensorCertification[], slug: SensorCertification['slug']) {
  return (
    sensors.find((sensor) => sensor.slug === slug) ??
    sensors[0] ??
    SENSOR_CERTIFICATIONS[0]
  );
}

function sortSensors(sensors: SensorCertification[]) {
  return [...sensors].sort((a, b) => SENSOR_ORDER.indexOf(a.slug) - SENSOR_ORDER.indexOf(b.slug));
}

function sortCountries(countries: CountryCertification[]) {
  return [...countries].sort((a, b) => {
    const nameA = (a.displayName ?? a.countryName).toLowerCase();
    const nameB = (b.displayName ?? b.countryName).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

type DataSourceState = 'static' | 'supabase';

type SupabaseRow = {
  status: CountryCertification['status'];
  certification_scheme: string | null;
  duration_weeks_min: number | null;
  duration_weeks_max: number | null;
  notes: string | null;
  countries: {
    name: string;
    display_name: string | null;
    iso2: string;
    iso3: string;
  } | null;
  sensor_types: {
    slug: string;
    name: string;
    description: string | null;
  } | null;
};

export function CertificationExperience() {
  const [sensorData, setSensorData] = useState<SensorCertification[]>(SENSOR_CERTIFICATIONS);
  const [activeSensorSlug, setActiveSensorSlug] = useState<SensorCertification['slug']>(
    SENSOR_CERTIFICATIONS[0].slug
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIso3, setSelectedIso3] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceState>('static');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) {
      return;
    }

    let cancelled = false;
    setIsSyncing(true);

    client
      .from('certification_records')
      .select(
        `status, certification_scheme, duration_weeks_min, duration_weeks_max, notes,
         countries:country_id ( name, display_name, iso2, iso3 ),
         sensor_types:sensor_type_id ( slug, name, description )`
      )
      .then(({ data, error }) => {
        if (cancelled) {
          return;
        }

        if (error) {
          setSyncError(error.message);
          setIsSyncing(false);
          return;
        }

        if (!data || data.length === 0) {
          setSyncError('No certification records returned from Supabase yet.');
          setIsSyncing(false);
          return;
        }

        const sensorsMap = new Map<string, SensorCertification>();

        data.forEach((row: SupabaseRow) => {
          const sensorInfo = row.sensor_types;
          const countryInfo = row.countries;
          if (!sensorInfo || !countryInfo) {
            return;
          }

          const slug = sensorInfo.slug as SensorCertification['slug'];
          const sensorEntry = sensorsMap.get(slug) ?? {
            slug,
            label: sensorInfo.name,
            description: sensorInfo.description ?? '',
            countries: [] as CountryCertification[]
          };

          const durationWeeks = row.duration_weeks_min
            ? {
                min: row.duration_weeks_min,
                max: row.duration_weeks_max ?? undefined
              }
            : row.duration_weeks_max
              ? { min: row.duration_weeks_max }
              : undefined;

          sensorEntry.countries.push({
            countryName: countryInfo.name,
            displayName: countryInfo.display_name ?? countryInfo.name,
            iso2: countryInfo.iso2,
            iso3: countryInfo.iso3,
            certificationScheme: row.certification_scheme ?? undefined,
            status: row.status,
            durationWeeks,
            notes: row.notes ?? undefined
          });

          sensorsMap.set(slug, sensorEntry);
        });

        if (sensorsMap.size === 0) {
          setSyncError('We could not map Supabase certification data with the current schema.');
          setIsSyncing(false);
          return;
        }

        const hydratedSensors = sortSensors(
          Array.from(sensorsMap.values()).map((sensor) => ({
            ...sensor,
            countries: sortCountries(sensor.countries)
          }))
        );

        setSensorData(hydratedSensors);
        setDataSource('supabase');
        setSyncError(null);
        setIsSyncing(false);
      })
      .catch((error) => {
        if (!cancelled) {
          setSyncError(error.message);
          setIsSyncing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sensorData.some((sensor) => sensor.slug === activeSensorSlug)) {
      setActiveSensorSlug(sensorData[0]?.slug ?? SENSOR_CERTIFICATIONS[0].slug);
    }
  }, [activeSensorSlug, sensorData]);

  const activeSensor = useMemo(
    () => getActiveSensor(sensorData, activeSensorSlug),
    [activeSensorSlug, sensorData]
  );

  const visibleCountries = activeSensor.countries;

  const searchFilter = useMemo(() => createSearchMatcher(searchQuery), [searchQuery]);

  const filteredCountries = useMemo(
    () => visibleCountries.filter((country) => searchFilter(country)),
    [visibleCountries, searchFilter]
  );

  const isSearchActive = searchQuery.trim().length > 0;

  const totals = useMemo(() => {
    return visibleCountries.reduce(
      (acc, country) => {
        acc[country.status] += 1;
        return acc;
      },
      { certified: 0, in_progress: 0, not_certified: 0 }
    );
  }, [visibleCountries]);

  const selectedCountry = useMemo(
    () => filteredCountries.find((country) => country.iso3 === selectedIso3) ?? null,
    [filteredCountries, selectedIso3]
  );

  const filteredIsoSet = useMemo(() => new Set(filteredCountries.map((country) => country.iso3)), [filteredCountries]);

  useEffect(() => {
    if (selectedIso3 && !filteredIsoSet.has(selectedIso3)) {
      setSelectedIso3(null);
    }
  }, [filteredIsoSet, selectedIso3]);

  return (
    <div className="relative flex h-dvh w-full flex-col bg-slate-950 text-slate-900">
      <CertificationMap
        sensorLabel={activeSensor.label}
        countries={visibleCountries}
        filteredIso3={filteredIsoSet}
        selectedIso3={selectedIso3}
        onSelectCountry={setSelectedIso3}
        statusColors={STATUS_COLORS}
        isSearchActive={isSearchActive}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <div className="flex justify-center px-6 pt-6">
          <div className="pointer-events-auto flex w-full max-w-4xl flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  Certified countries
                </p>
                <span className="text-xs text-slate-500">
                  {dataSource === 'supabase' ? 'Synced from Supabase' : 'Using bundled reference data'}
                  {isSyncing && ' · refreshing…'}
                </span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-3xl font-semibold text-slate-900">{activeSensor.label} sensors</h1>
                <div className="flex gap-2">
                  {Object.entries(totals).map(([status, count]) => (
                    <span
                      key={status}
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      <span
                        className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status as CountryCertification['status']] }}
                      />
                      {STATUS_LABELS[status as CountryCertification['status']]} · {count}
                    </span>
                  ))}
                </div>
              </div>
              {syncError ? (
                <p className="text-xs text-rose-500">{syncError}</p>
              ) : (
                <p className="text-sm text-slate-600">
                  Quickly confirm where your deployment is supported and understand what it takes to expand into new markets.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {sensorData.map((sensor) => {
                const isActive = sensor.slug === activeSensorSlug;
                return (
                  <button
                    key={sensor.slug}
                    type="button"
                    onClick={() => {
                      setActiveSensorSlug(sensor.slug);
                      setSelectedIso3(null);
                    }}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {sensor.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="country-search">
                Search for a country or certification
              </label>
              <input
                id="country-search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  if (event.target.value.trim().length === 0) {
                    setSelectedIso3(null);
                  }
                }}
                placeholder="e.g. France, FCC, 3 weeks"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                type="search"
              />
              {isSearchActive && (
                <p className="text-xs text-slate-500">
                  {filteredCountries.length > 0
                    ? `Showing ${filteredCountries.length} certified location${filteredCountries.length === 1 ? '' : 's'}`
                    : 'No certified locations yet — let us know what you need and we will queue it up.'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {Object.entries(STATUS_DESCRIPTIONS).map(([status, description]) => (
                <div key={status} className="flex items-start gap-2 rounded-xl bg-slate-100/70 p-3">
                  <span
                    className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status as CountryCertification['status']] }}
                  />
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-700">{STATUS_LABELS[status as CountryCertification['status']]}</p>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none mt-auto flex justify-end px-6 pb-6">
          <aside className="pointer-events-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-2xl backdrop-blur">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Country insights</p>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedCountry ? selectedCountry.displayName ?? selectedCountry.countryName : 'Browse certified markets'}
                </h2>
              </div>
              {selectedCountry && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-600"
                  style={{ backgroundColor: `${STATUS_COLORS[selectedCountry.status]}20` }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[selectedCountry.status] }}
                  />
                  {STATUS_LABELS[selectedCountry.status]}
                </span>
              )}
            </header>

            {selectedCountry ? (
              <div className="space-y-3 text-sm text-slate-600">
                {selectedCountry.certificationScheme && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Certification scheme</p>
                    <p className="text-base text-slate-800">{selectedCountry.certificationScheme}</p>
                  </div>
                )}
                {selectedCountry.durationWeeks && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead time</p>
                    <p className="text-base text-slate-800">{formatDuration(selectedCountry)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                  <p>
                    {STATUS_DESCRIPTIONS[selectedCountry.status]}
                    {selectedCountry.status === 'not_certified' && ' Reach out to begin certification discussions.'}
                  </p>
                </div>
                {selectedCountry.notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                    <p>{selectedCountry.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Hover over the map or select a country below to see certification requirements at a glance.
              </p>
            )}

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredCountries.map((country) => {
                const isSelected = country.iso3 === selectedIso3;
                return (
                  <button
                    key={country.iso3}
                    type="button"
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                        : 'border-transparent bg-slate-100/80 text-slate-700 hover:border-slate-300 hover:bg-white'
                    }`}
                    onClick={() => setSelectedIso3(country.iso3)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold">
                          {country.displayName ?? country.countryName}
                        </p>
                        <p className={`text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                          {country.certificationScheme ?? 'Certification pending'}
                        </p>
                      </div>
                      <span
                        className="flex h-2.5 w-2.5 flex-none rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[country.status] }}
                      />
                    </div>
                    {country.durationWeeks && (
                      <p className={`mt-1 text-sm ${isSelected ? 'text-slate-100' : 'text-slate-600'}`}>
                        Lead time: {formatDuration(country)}
                      </p>
                    )}
                    {!country.durationWeeks && country.status === 'not_certified' && (
                      <p className={`mt-1 text-sm ${isSelected ? 'text-slate-100' : 'text-slate-600'}`}>
                        Not yet certified
                      </p>
                    )}
                  </button>
                );
              })}
              {filteredCountries.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
                  We have not certified this market yet. Let us know your priority locations and we will fast-track them.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
