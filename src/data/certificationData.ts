export type CertificationStatus = 'certified' | 'in_progress' | 'not_certified';

export interface DurationEstimate {
  min: number;
  max?: number;
}

export interface CountryMetadata {
  countryName: string;
  displayName?: string;
  iso2: string;
  iso3: string;
}

export interface CountryCertification extends CountryMetadata {
  certificationScheme?: string;
  status: CertificationStatus;
  durationWeeks?: DurationEstimate;
  notes?: string;
}

export interface SensorCertification {
  slug: 'open-area' | 'entry' | 'waffle';
  label: string;
  description: string;
  countries: CountryCertification[];
}

const countryMeta = {
  austria: { countryName: 'Austria', displayName: 'Austria', iso2: 'AT', iso3: 'AUT' },
  australia: { countryName: 'Australia', displayName: 'Australia', iso2: 'AU', iso3: 'AUS' },
  belgium: { countryName: 'Belgium', displayName: 'Belgium', iso2: 'BE', iso3: 'BEL' },
  bulgaria: { countryName: 'Bulgaria', displayName: 'Bulgaria', iso2: 'BG', iso3: 'BGR' },
  croatia: { countryName: 'Croatia', displayName: 'Croatia', iso2: 'HR', iso3: 'HRV' },
  cyprus: { countryName: 'Cyprus', displayName: 'Cyprus', iso2: 'CY', iso3: 'CYP' },
  czechRepublic: { countryName: 'Czechia', displayName: 'Czech Republic', iso2: 'CZ', iso3: 'CZE' },
  denmark: { countryName: 'Denmark', displayName: 'Denmark', iso2: 'DK', iso3: 'DNK' },
  estonia: { countryName: 'Estonia', displayName: 'Estonia', iso2: 'EE', iso3: 'EST' },
  finland: { countryName: 'Finland', displayName: 'Finland', iso2: 'FI', iso3: 'FIN' },
  france: { countryName: 'France', displayName: 'France', iso2: 'FR', iso3: 'FRA' },
  germany: { countryName: 'Germany', displayName: 'Germany', iso2: 'DE', iso3: 'DEU' },
  greece: { countryName: 'Greece', displayName: 'Greece', iso2: 'GR', iso3: 'GRC' },
  hongKong: { countryName: 'Hong Kong', displayName: 'Hong Kong', iso2: 'HK', iso3: 'HKG' },
  hungary: { countryName: 'Hungary', displayName: 'Hungary', iso2: 'HU', iso3: 'HUN' },
  iceland: { countryName: 'Iceland', displayName: 'Iceland', iso2: 'IS', iso3: 'ISL' },
  ireland: { countryName: 'Ireland', displayName: 'Ireland', iso2: 'IE', iso3: 'IRL' },
  india: { countryName: 'India', displayName: 'India', iso2: 'IN', iso3: 'IND' },
  italy: { countryName: 'Italy', displayName: 'Italy', iso2: 'IT', iso3: 'ITA' },
  latvia: { countryName: 'Latvia', displayName: 'Latvia', iso2: 'LV', iso3: 'LVA' },
  liechtenstein: { countryName: 'Liechtenstein', displayName: 'Liechtenstein', iso2: 'LI', iso3: 'LIE' },
  lithuania: { countryName: 'Lithuania', displayName: 'Lithuania', iso2: 'LT', iso3: 'LTU' },
  luxembourg: { countryName: 'Luxembourg', displayName: 'Luxembourg', iso2: 'LU', iso3: 'LUX' },
  malta: { countryName: 'Malta', displayName: 'Malta', iso2: 'MT', iso3: 'MLT' },
  malaysia: { countryName: 'Malaysia', displayName: 'Malaysia', iso2: 'MY', iso3: 'MYS' },
  mexico: { countryName: 'Mexico', displayName: 'Mexico', iso2: 'MX', iso3: 'MEX' },
  newZealand: { countryName: 'New Zealand', displayName: 'New Zealand', iso2: 'NZ', iso3: 'NZL' },
  norway: { countryName: 'Norway', displayName: 'Norway', iso2: 'NO', iso3: 'NOR' },
  poland: { countryName: 'Poland', displayName: 'Poland', iso2: 'PL', iso3: 'POL' },
  portugal: { countryName: 'Portugal', displayName: 'Portugal', iso2: 'PT', iso3: 'PRT' },
  romania: { countryName: 'Romania', displayName: 'Romania', iso2: 'RO', iso3: 'ROU' },
  singapore: { countryName: 'Singapore', displayName: 'Singapore', iso2: 'SG', iso3: 'SGP' },
  slovakia: { countryName: 'Slovakia', displayName: 'Slovakia', iso2: 'SK', iso3: 'SVK' },
  slovenia: { countryName: 'Slovenia', displayName: 'Slovenia', iso2: 'SI', iso3: 'SVN' },
  spain: { countryName: 'Spain', displayName: 'Spain', iso2: 'ES', iso3: 'ESP' },
  sweden: { countryName: 'Sweden', displayName: 'Sweden', iso2: 'SE', iso3: 'SWE' },
  switzerland: { countryName: 'Switzerland', displayName: 'Switzerland', iso2: 'CH', iso3: 'CHE' },
  netherlands: { countryName: 'Netherlands', displayName: 'Netherlands', iso2: 'NL', iso3: 'NLD' },
  britishVirginIslands: {
    countryName: 'British Virgin Islands',
    displayName: 'Virgin Islands, British',
    iso2: 'VG',
    iso3: 'VGB'
  },
  unitedStatesMinorOutlying: {
    countryName: 'United States Minor Outlying Islands',
    displayName: 'United States Minor Outlying Islands',
    iso2: 'UM',
    iso3: 'UMI'
  },
  usVirginIslands: {
    countryName: 'United States Virgin Islands',
    displayName: 'Virgin Islands, U.S.',
    iso2: 'VI',
    iso3: 'VIR'
  },
  unitedStates: {
    countryName: 'United States of America',
    displayName: 'United States',
    iso2: 'US',
    iso3: 'USA'
  },
  canada: { countryName: 'Canada', displayName: 'Canada', iso2: 'CA', iso3: 'CAN' },
  unitedKingdom: { countryName: 'United Kingdom', displayName: 'United Kingdom', iso2: 'GB', iso3: 'GBR' },
  chile: { countryName: 'Chile', displayName: 'Chile', iso2: 'CL', iso3: 'CHL' }
} satisfies Record<string, CountryMetadata>;

const baseCertified = (scheme: string): Pick<CountryCertification, 'certificationScheme' | 'status'> => ({
  certificationScheme: scheme,
  status: 'certified'
});

const leadTime = (weeks: DurationEstimate): Pick<CountryCertification, 'durationWeeks' | 'status'> => ({
  durationWeeks: weeks,
  status: 'in_progress'
});

export const SENSOR_CERTIFICATIONS: SensorCertification[] = [
  {
    slug: 'open-area',
    label: 'Open Area',
    description: 'Large, open deployments such as warehouses or manufacturing floors.',
    countries: [
      { ...countryMeta.austria, ...baseCertified('CE') },
      { ...countryMeta.australia, ...leadTime({ min: 3 }) },
      { ...countryMeta.belgium, ...baseCertified('CE') },
      { ...countryMeta.bulgaria, ...baseCertified('CE') },
      { ...countryMeta.croatia, ...baseCertified('CE') },
      { ...countryMeta.cyprus, ...baseCertified('CE') },
      { ...countryMeta.czechRepublic, ...baseCertified('CE') },
      { ...countryMeta.denmark, ...baseCertified('CE') },
      { ...countryMeta.estonia, ...baseCertified('CE') },
      { ...countryMeta.finland, ...baseCertified('CE') },
      { ...countryMeta.france, ...baseCertified('CE') },
      { ...countryMeta.germany, ...baseCertified('CE') },
      { ...countryMeta.greece, ...baseCertified('CE') },
      { ...countryMeta.hongKong, ...baseCertified('CE') },
      { ...countryMeta.hungary, ...baseCertified('CE') },
      { ...countryMeta.iceland, ...baseCertified('CE') },
      { ...countryMeta.ireland, ...baseCertified('CE') },
      { ...countryMeta.india, certificationScheme: 'WPC / BIS', status: 'certified' },
      { ...countryMeta.italy, ...baseCertified('CE') },
      { ...countryMeta.latvia, ...baseCertified('CE') },
      { ...countryMeta.liechtenstein, ...baseCertified('CE') },
      { ...countryMeta.lithuania, ...baseCertified('CE') },
      { ...countryMeta.luxembourg, ...baseCertified('CE') },
      { ...countryMeta.malta, ...baseCertified('CE') },
      { ...countryMeta.malaysia, status: 'not_certified', notes: 'Certification not yet available.' },
      { ...countryMeta.mexico, ...leadTime({ min: 26, max: 40 }) },
      { ...countryMeta.newZealand, ...leadTime({ min: 3 }) },
      { ...countryMeta.norway, ...baseCertified('CE') },
      { ...countryMeta.poland, ...baseCertified('CE') },
      { ...countryMeta.portugal, ...baseCertified('CE') },
      { ...countryMeta.romania, ...baseCertified('CE') },
      { ...countryMeta.singapore, status: 'not_certified', notes: 'Certification not yet available.' },
      { ...countryMeta.slovakia, ...baseCertified('CE') },
      { ...countryMeta.slovenia, ...baseCertified('CE') },
      { ...countryMeta.spain, ...baseCertified('CE') },
      { ...countryMeta.sweden, ...baseCertified('CE') },
      { ...countryMeta.switzerland, ...baseCertified('CE') },
      { ...countryMeta.netherlands, ...baseCertified('CE') },
      { ...countryMeta.britishVirginIslands, ...baseCertified('CE') },
      { ...countryMeta.unitedStatesMinorOutlying, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.usVirginIslands, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.unitedStates, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.canada, certificationScheme: 'ISED / IC', status: 'certified' },
      { ...countryMeta.unitedKingdom, certificationScheme: 'UKCA', status: 'certified' },
      { ...countryMeta.chile, ...leadTime({ min: 8, max: 12 }) }
    ]
  },
  {
    slug: 'entry',
    label: 'Entry',
    description: 'Doorway and corridor sensors for access control.',
    countries: [
      { ...countryMeta.austria, ...baseCertified('CE') },
      { ...countryMeta.australia, ...leadTime({ min: 3 }) },
      { ...countryMeta.belgium, ...baseCertified('CE') },
      { ...countryMeta.bulgaria, ...baseCertified('CE') },
      { ...countryMeta.croatia, ...baseCertified('CE') },
      { ...countryMeta.cyprus, ...baseCertified('CE') },
      { ...countryMeta.czechRepublic, ...baseCertified('CE') },
      { ...countryMeta.denmark, ...baseCertified('CE') },
      { ...countryMeta.estonia, ...baseCertified('CE') },
      { ...countryMeta.finland, ...baseCertified('CE') },
      { ...countryMeta.france, ...baseCertified('CE') },
      { ...countryMeta.germany, ...baseCertified('CE') },
      { ...countryMeta.greece, ...baseCertified('CE') },
      { ...countryMeta.hongKong, ...baseCertified('CE') },
      { ...countryMeta.hungary, ...baseCertified('CE') },
      { ...countryMeta.iceland, ...baseCertified('CE') },
      { ...countryMeta.ireland, ...baseCertified('CE') },
      { ...countryMeta.india, certificationScheme: 'WPC / BIS', status: 'certified' },
      { ...countryMeta.italy, ...baseCertified('CE') },
      { ...countryMeta.latvia, ...baseCertified('CE') },
      { ...countryMeta.liechtenstein, ...baseCertified('CE') },
      { ...countryMeta.lithuania, ...baseCertified('CE') },
      { ...countryMeta.luxembourg, ...baseCertified('CE') },
      { ...countryMeta.malta, ...baseCertified('CE') },
      { ...countryMeta.malaysia, status: 'not_certified', notes: 'Certification not yet available.' },
      { ...countryMeta.mexico, ...leadTime({ min: 26, max: 40 }) },
      { ...countryMeta.newZealand, ...leadTime({ min: 3 }) },
      { ...countryMeta.norway, ...baseCertified('CE') },
      { ...countryMeta.poland, ...baseCertified('CE') },
      { ...countryMeta.portugal, ...baseCertified('CE') },
      { ...countryMeta.romania, ...baseCertified('CE') },
      { ...countryMeta.singapore, status: 'not_certified', notes: 'Certification not yet available.' },
      { ...countryMeta.slovakia, ...baseCertified('CE') },
      { ...countryMeta.slovenia, ...baseCertified('CE') },
      { ...countryMeta.spain, ...baseCertified('CE') },
      { ...countryMeta.sweden, ...baseCertified('CE') },
      { ...countryMeta.switzerland, ...baseCertified('CE') },
      { ...countryMeta.netherlands, ...baseCertified('CE') },
      { ...countryMeta.britishVirginIslands, ...baseCertified('CE') },
      { ...countryMeta.unitedStatesMinorOutlying, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.usVirginIslands, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.unitedStates, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.canada, certificationScheme: 'ISED / IC', status: 'certified' },
      { ...countryMeta.unitedKingdom, certificationScheme: 'UKCA', status: 'certified' },
      { ...countryMeta.chile, ...leadTime({ min: 8, max: 12 }) }
    ]
  },
  {
    slug: 'waffle',
    label: 'Waffle',
    description: 'High-density ceiling grid sensors for retail and hospitality.',
    countries: [
      { ...countryMeta.austria, ...baseCertified('CE') },
      { ...countryMeta.australia, ...leadTime({ min: 3 }) },
      { ...countryMeta.belgium, ...baseCertified('CE') },
      { ...countryMeta.bulgaria, ...baseCertified('CE') },
      { ...countryMeta.croatia, ...baseCertified('CE') },
      { ...countryMeta.cyprus, ...baseCertified('CE') },
      { ...countryMeta.czechRepublic, ...baseCertified('CE') },
      { ...countryMeta.denmark, ...baseCertified('CE') },
      { ...countryMeta.estonia, ...baseCertified('CE') },
      { ...countryMeta.finland, ...baseCertified('CE') },
      { ...countryMeta.france, ...baseCertified('CE') },
      { ...countryMeta.germany, ...baseCertified('CE') },
      { ...countryMeta.greece, ...baseCertified('CE') },
      { ...countryMeta.hongKong, ...leadTime({ min: 6 }) },
      { ...countryMeta.hungary, ...baseCertified('CE') },
      { ...countryMeta.iceland, ...baseCertified('CE') },
      { ...countryMeta.ireland, ...baseCertified('CE') },
      { ...countryMeta.india, certificationScheme: 'WPC / BIS', status: 'certified' },
      { ...countryMeta.italy, ...baseCertified('CE') },
      { ...countryMeta.latvia, ...baseCertified('CE') },
      { ...countryMeta.liechtenstein, ...baseCertified('CE') },
      { ...countryMeta.lithuania, ...baseCertified('CE') },
      { ...countryMeta.luxembourg, ...baseCertified('CE') },
      { ...countryMeta.malta, ...baseCertified('CE') },
      { ...countryMeta.malaysia, status: 'not_certified', notes: 'Certification not yet available.' },
      { ...countryMeta.mexico, ...leadTime({ min: 26, max: 40 }) },
      { ...countryMeta.newZealand, ...leadTime({ min: 3 }) },
      { ...countryMeta.norway, ...baseCertified('CE') },
      { ...countryMeta.poland, ...baseCertified('CE') },
      { ...countryMeta.portugal, ...baseCertified('CE') },
      { ...countryMeta.romania, ...baseCertified('CE') },
      { ...countryMeta.singapore, status: 'not_certified', notes: 'Certification not yet available.' },
      { ...countryMeta.slovakia, ...baseCertified('CE') },
      { ...countryMeta.slovenia, ...baseCertified('CE') },
      { ...countryMeta.spain, ...baseCertified('CE') },
      { ...countryMeta.sweden, ...baseCertified('CE') },
      { ...countryMeta.switzerland, ...baseCertified('CE') },
      { ...countryMeta.netherlands, ...baseCertified('CE') },
      { ...countryMeta.britishVirginIslands, ...baseCertified('CE') },
      { ...countryMeta.unitedStatesMinorOutlying, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.usVirginIslands, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.unitedStates, certificationScheme: 'FCC', status: 'certified' },
      { ...countryMeta.canada, certificationScheme: 'ISED / IC', status: 'certified' },
      {
        ...countryMeta.unitedKingdom,
        certificationScheme: 'CE',
        status: 'certified',
        notes: 'UKCA has been phased out; CE marking is recognised.'
      },
      { ...countryMeta.chile, ...leadTime({ min: 8, max: 12 }) }
    ]
  }
];

export const ALL_COUNTRIES: CountryMetadata[] = Object.values(countryMeta);
