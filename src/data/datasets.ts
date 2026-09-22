import type { DataPoint, DataSeries } from '../types/dataset'

/**
 * Values copied from `resources/Artificial Earth Teams Data.xlsx`.
 *
 * Only a small, MVP-relevant selection is included here. To add more, copy
 * the value from the sheet into a new DataPoint/DataSeries and reference its
 * id from a continent's `factIds` — the UI is fully data-driven.
 */

export const dataPoints: DataPoint[] = [
  // ---- Ireland: BitPower operational estimate (2026) ----
  {
    id: 'ie-dc-capacity-2026',
    label: 'Data-centre capacity in Ireland',
    value: 1743,
    unit: 'MW',
    year: 2026,
    region: 'Ireland',
    sourceSheet: 'BitPower Ener,Car,Pow Op(Esti)',
    publisher: 'BitPower',
    note: 'That is enough power for a lot of very big computer buildings.',
  },
  {
    id: 'ie-dc-electricity-2026',
    label: 'Electricity used by data centres each year',
    value: 8.4,
    unit: 'TWh',
    year: 2026,
    region: 'Ireland',
    sourceSheet: 'BitPower Ener,Car,Pow Op(Esti)',
    publisher: 'BitPower',
    note: 'A terawatt-hour (TWh) is one billion units of electricity.',
  },
  {
    id: 'ie-dc-co2-2026',
    label: 'Tonnes of CO₂ from data centres each year',
    value: 2.13,
    unit: 'million tonnes',
    display: '2.13 million',
    year: 2026,
    region: 'Ireland',
    sourceSheet: 'BitPower Ener,Car,Pow Op(Esti)',
    publisher: 'BitPower',
    note: 'CO₂ is the gas that warms our planet when too much is released.',
  },
  {
    id: 'ie-grid-intensity-2026',
    label: 'Grams of CO₂ for every unit of electricity',
    value: 255,
    unit: 'gCO₂/kWh',
    year: 2026,
    region: 'Ireland',
    sourceSheet: 'BitPower Ener,Car,Pow Op(Esti)',
    publisher: 'BitPower',
  },

  // ---- Ireland: KPMG economic impact (2024) ----
  {
    id: 'ie-dc-direct-jobs-2024',
    label: 'Jobs directly in data centres',
    value: 9300,
    unit: 'jobs',
    year: 2024,
    region: 'Ireland',
    sourceSheet: 'KPMG Report P62',
    publisher: 'KPMG',
    note: 'Counting the people who build and run the data centres.',
  },
  {
    id: 'ie-dc-total-jobs-2024',
    label: 'Jobs supported in total',
    value: 19500,
    unit: 'jobs',
    year: 2024,
    region: 'Ireland',
    sourceSheet: 'KPMG Report P62',
    publisher: 'KPMG',
  },
  {
    id: 'ie-dc-gva-2024',
    label: 'Added to Ireland’s economy',
    value: 2.2,
    unit: '€bn',
    display: '€2.2 billion',
    year: 2024,
    region: 'Ireland',
    sourceSheet: 'KPMG Report P62',
    publisher: 'KPMG',
  },

  // ---- Ireland: CSO electricity share (2025) ----
  {
    id: 'ie-dc-electricity-gwh-2025',
    label: 'Electricity used by data centres',
    value: 7663,
    unit: 'GWh',
    year: 2025,
    region: 'Ireland',
    sourceSheet: 'CSO DC Electricity Consumption ',
    publisher: 'CSO',
  },
  {
    id: 'ie-total-electricity-gwh-2025',
    label: 'Total electricity used in Ireland',
    value: 32986,
    unit: 'GWh',
    year: 2025,
    region: 'Ireland',
    sourceSheet: 'CSO DC Electricity Consumption ',
    publisher: 'CSO',
  },

  // ---- Europe: city benchmarking (2025) ----
  {
    id: 'dublin-dc-capacity-2025',
    label: 'Data-centre capacity in Dublin',
    value: 1530,
    unit: 'MW',
    year: 2025,
    region: 'Dublin',
    sourceSheet: 'KPMG Report P36',
    publisher: 'KPMG',
    note: 'More than London (1,450 MW), Amsterdam (1,000 MW), Frankfurt (910 MW) or Paris (890 MW).',
  },
  {
    id: 'uk-dc-capacity-2025',
    label: 'Data-centre capacity in the United Kingdom',
    value: 1615,
    unit: 'MW',
    year: 2025,
    region: 'United Kingdom',
    sourceSheet: 'KPMG International Case Studies',
    publisher: 'KPMG',
  },

  // ---- Europe: public opinion surveys ----
  {
    id: 'eu-survey-energy-negative-2024',
    label: 'of people said high energy use is a negative impact',
    value: 40,
    unit: '%',
    year: 2024,
    region: 'Europe',
    sourceSheet: 'CyrusOne 04 (2024)',
    publisher: 'CyrusOne survey',
    note: 'People were asked what they think about data centres near them.',
  },
  {
    id: 'ie-survey-renewable-only-2025',
    label: 'agree new data centres should only be built if powered by renewable energy',
    value: 76,
    unit: '%',
    year: 2025,
    region: 'Ireland',
    sourceSheet: 'Beyond FF Slide n.37 (2025)',
    publisher: 'Beyond Fossil Fuels survey',
    note: '36% strongly agreed and 40% agreed.',
  },

  // ---- Asia: Singapore benchmarking (2025) ----
  {
    id: 'sg-dc-capacity-2025',
    label: 'Data-centre capacity in Singapore',
    value: 1020,
    unit: 'MW',
    year: 2025,
    region: 'Singapore',
    sourceSheet: 'KPMG International Case Studies',
    publisher: 'KPMG',
    note: 'Singapore is a small country but a big home for computers.',
  },
]

/**
 * Time series kept for future charts. Not displayed in the MVP panel, but
 * available to the UI through the same data layer.
 */
export const dataSeries: DataSeries[] = [
  {
    id: 'ie-dc-electricity-series',
    label: 'Data-centre electricity consumption',
    unit: 'GWh',
    region: 'Ireland',
    sourceSheet: 'CSO DC Electricity Consumption ',
    publisher: 'CSO',
    points: [
      { year: 2015, value: 1240 },
      { year: 2016, value: 1482 },
      { year: 2017, value: 1762 },
      { year: 2018, value: 2182 },
      { year: 2019, value: 2490 },
      { year: 2020, value: 3030 },
      { year: 2021, value: 4012 },
      { year: 2022, value: 5273 },
      { year: 2023, value: 6339 },
      { year: 2024, value: 6973 },
      { year: 2025, value: 7663 },
    ],
  },
  {
    id: 'ie-grid-co2-intensity-series',
    label: 'Electricity CO₂ intensity',
    unit: 'gCO₂/kWh',
    region: 'Ireland',
    sourceSheet: 'EirGrid CO2 Intensity',
    publisher: 'EirGrid',
    points: [
      { year: 1990, value: 896.3 },
      { year: 2000, value: 770.6 },
      { year: 2010, value: 529.9 },
      { year: 2015, value: 469.9 },
      { year: 2020, value: 307.5 },
      { year: 2024, value: 223.7 },
    ],
  },
]

export const dataPointsById: Record<string, DataPoint> = Object.fromEntries(
  dataPoints.map((p) => [p.id, p]),
)
