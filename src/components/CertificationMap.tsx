'use client';

import mapboxgl, {
  type ExpressionSpecification,
  type Map,
  type MapMouseEvent
} from 'mapbox-gl';
import type { Geometry, Position } from 'geojson';
import { useEffect, useRef, useState } from 'react';
import type { CountryCertification } from '@/data/certificationData';

const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';
const COUNTRY_SOURCE_ID = 'country-boundaries';
const COUNTRY_SOURCE_LAYER = 'country_boundaries';
const FILL_LAYER_ID = 'certified-country-fill';
const BORDER_LAYER_ID = 'certified-country-border';
const HOVER_LAYER_ID = 'certified-country-hover';
const SELECT_LAYER_ID = 'certified-country-selected';

type CertificationMapProps = {
  sensorLabel: string;
  countries: CountryCertification[];
  filteredIso3: Set<string>;
  selectedIso3: string | null;
  onSelectCountry: (iso3: string) => void;
  statusColors: Record<CountryCertification['status'], string>;
  isSearchActive: boolean;
};

const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function buildMatchExpression(
  countries: CountryCertification[],
  valueAccessor: (country: CountryCertification) => string | number,
  fallback: string | number
): ExpressionSpecification {
  const matchPairs: Array<string | number> = [];
  countries.forEach((country) => {
    matchPairs.push(country.iso3, valueAccessor(country));
  });

  return ['match', ['get', 'iso_3166_1_alpha_3'], ...matchPairs, fallback] as ExpressionSpecification;
}

function extendBoundsFromGeometry(bounds: mapboxgl.LngLatBounds, geometry?: Geometry) {
  if (!geometry) {
    return;
  }

  const extend = (coords: Position | Position[] | Position[][] | Position[][][]) => {
    if (!Array.isArray(coords) || coords.length === 0) {
      return;
    }

    const first = coords[0];

    if (typeof first === 'number') {
      bounds.extend(coords as Position);
      return;
    }

    (coords as Array<Position | Position[] | Position[][] | Position[][][]>).forEach((nested) => {
      extend(nested as Position | Position[] | Position[][] | Position[][][]);
    });
  };

  extend(geometry.coordinates as Position | Position[] | Position[][] | Position[][][]);
}

export function CertificationMap({
  sensorLabel,
  countries,
  filteredIso3,
  selectedIso3,
  onSelectCountry,
  statusColors,
  isSearchActive
}: CertificationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const countriesRef = useRef(countries);
  const onSelectRef = useRef(onSelectCountry);
  const [mapReady, setMapReady] = useState(false);
  const [hoveredIso3, setHoveredIso3] = useState<string | null>(null);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);

  useEffect(() => {
    onSelectRef.current = onSelectCountry;
  }, [onSelectCountry]);

  useEffect(() => {
    console.log('Map effect debug:', {
      hasContainer: !!mapContainerRef.current,
      hasMapInstance: !!mapRef.current,
      hasToken: !!token,
      token: token,
      mapboxgl: typeof mapboxgl
    });
    
    if (!mapContainerRef.current || mapRef.current || !token) {
      console.log('Early return - missing requirements');
      return;
    }

    console.log('Setting mapbox token and creating map...');
    mapboxgl.accessToken = token;
    if (typeof mapboxgl.setTelemetryEnabled === 'function') {
      mapboxgl.setTelemetryEnabled(false);
    }
    if (mapboxgl.config) {
      try {
        Object.defineProperty(mapboxgl.config, 'EVENTS_URL', {
          value: null,
          writable: false
        });
      } catch {
        // Ignore: EVENTS_URL is readonly in some Mapbox builds.
      }
    }

    console.log('Creating map with container:', mapContainerRef.current);
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [8, 25],
      zoom: 1.4,
      minZoom: 1.2,
      projection: 'mercator'
    });
    console.log('Map created:', map);

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('error', (e) => {
      console.error('Mapbox error:', e);
    });

    map.on('load', () => {
      console.log('Map load event fired!');
      map.addSource(COUNTRY_SOURCE_ID, {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
      });

      map.addLayer(
        {
          id: FILL_LAYER_ID,
          type: 'fill',
          source: COUNTRY_SOURCE_ID,
          'source-layer': COUNTRY_SOURCE_LAYER,
          paint: {
            'fill-color': '#d1d5db',
            'fill-opacity': 0.2
          }
        },
        'waterway-label'
      );

      map.addLayer({
        id: BORDER_LAYER_ID,
        type: 'line',
        source: COUNTRY_SOURCE_ID,
        'source-layer': COUNTRY_SOURCE_LAYER,
        paint: {
          'line-width': 0.3,
          'line-color': '#94a3b8'
        }
      });

      map.addLayer({
        id: HOVER_LAYER_ID,
        type: 'line',
        source: COUNTRY_SOURCE_ID,
        'source-layer': COUNTRY_SOURCE_LAYER,
        paint: {
          'line-width': 2,
          'line-color': '#111827'
        },
        filter: ['==', ['get', 'iso_3166_1_alpha_3'], '']
      });

      map.addLayer({
        id: SELECT_LAYER_ID,
        type: 'line',
        source: COUNTRY_SOURCE_ID,
        'source-layer': COUNTRY_SOURCE_LAYER,
        paint: {
          'line-width': 3,
          'line-color': '#0f172a'
        },
        filter: ['==', ['get', 'iso_3166_1_alpha_3'], '']
      });

      map.on('mousemove', FILL_LAYER_ID, (event: MapMouseEvent) => {
        const iso = event.features?.[0]?.properties?.iso_3166_1_alpha_3 as string | undefined;
        setHoveredIso3(iso ?? null);
      });

      map.on('mouseleave', FILL_LAYER_ID, () => {
        setHoveredIso3(null);
      });

      map.on('click', FILL_LAYER_ID, (event: MapMouseEvent) => {
        const iso = event.features?.[0]?.properties?.iso_3166_1_alpha_3 as string | undefined;
        if (!iso) {
          return;
        }
        const country = countriesRef.current.find((entry) => entry.iso3 === iso);
        if (!country) {
          return;
        }
        onSelectRef.current(country.iso3);

        if (event.lngLat) {
          map.easeTo({
            center: event.lngLat,
            zoom: Math.max(map.getZoom(), 2.2),
            duration: 600
          });
        }
      });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [countries, onSelectCountry]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const fillColorExpression = buildMatchExpression(
      countries,
      (country) => statusColors[country.status],
      '#d1d5db'
    );

    const fillOpacityExpression = buildMatchExpression(
      countries,
      (country) => (!isSearchActive || filteredIso3.has(country.iso3) ? 0.72 : 0.1),
      0.02
    );

    map.setPaintProperty(FILL_LAYER_ID, 'fill-color', fillColorExpression);
    map.setPaintProperty(FILL_LAYER_ID, 'fill-opacity', fillOpacityExpression);
  }, [countries, filteredIso3, isSearchActive, mapReady, statusColors]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.setFilter(HOVER_LAYER_ID, ['==', ['get', 'iso_3166_1_alpha_3'], hoveredIso3 ?? '']);
  }, [hoveredIso3, mapReady]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapRef.current;
    if (!map) {
      return;
    }
    map.setFilter(SELECT_LAYER_ID, ['==', ['get', 'iso_3166_1_alpha_3'], selectedIso3 ?? '']);
    if (selectedIso3) {
      const features = map.querySourceFeatures(COUNTRY_SOURCE_ID, {
        sourceLayer: COUNTRY_SOURCE_LAYER,
        filter: ['==', ['get', 'iso_3166_1_alpha_3'], selectedIso3]
      });

      if (features.length > 0) {
        const bounds = features.reduce((acc, feature) => {
          extendBoundsFromGeometry(acc, feature.geometry as Geometry | undefined);
          return acc;
        }, new mapboxgl.LngLatBounds());

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, duration: 800, maxZoom: 4.2 });
        }
      }
    }
  }, [countries, mapReady, selectedIso3]);

  if (!token) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-200">
        Add your Mapbox token to view the certification coverage map for {sensorLabel} sensors.
      </div>
    );
  }

  return <div 
    ref={mapContainerRef} 
    className="absolute inset-0" 
    style={{ 
      width: '100%', 
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }} 
  />;
}
