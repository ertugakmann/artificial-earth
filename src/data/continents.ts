import type { Continent, ContinentId } from '../types/continent'

/**
 * Continent content for the MVP.
 *
 * Text is adapted for ages 8–12 from the project resources
 * ("AI Around the World Project.pdf" and "Interactive Google Earth Prompt.pdf")
 * without changing their meaning. Marker positions are static configuration
 * because the dataset has no coordinates.
 */
export const continents: Continent[] = [
  {
    id: 'north-america',
    name: 'North America',
    naturalEarthName: 'North America',
    marker: { lat: 42, lng: -100 },
    color: '#ff8a65',
    iconBounds: { minLng: -170, maxLng: -50, minLat: 7, maxLat: 84 },
    description:
      'AI is used all over North America: in hospitals, schools, farms, transport, films and games. The United States and Canada are home to many of the world’s biggest AI companies and research labs.',
    good: [
      'Helps doctors and scientists with medical research.',
      'Creates brand-new industries and jobs.',
      'More people are training for AI skills, and demand is growing fast in the US and Canada.',
    ],
    challenges: [
      'Some jobs may change or disappear.',
      'People worry about privacy and misinformation online.',
      "Experts are still checking how much AI is really helping the economy, and some younger workers in AI-heavy jobs have seen slower job growth.",
    ],
    factIds: ['na-ai-tech-workers-growth'],
  },
  {
    id: 'south-america',
    name: 'South America',
    naturalEarthName: 'South America',
    marker: { lat: -12, lng: -58 },
    color: '#ffc857',
    iconBounds: { minLng: -95, maxLng: -30, minLat: -58, maxLat: 14 },
    description:
      'AI could help farmers, doctors and teachers across South America, especially in places that are far away or hard to reach. New AI opportunities are growing across Latin America.',
    good: [
      'Gives farmers better weather and crop information.',
      'Helps watch the climate, protect nature, and bring healthcare and lessons to more people.',
      'AI could help the region’s economy grow over the next ten years, if it is used well.',
    ],
    challenges: [
      'Not everyone has good internet or computers, which could stop people benefiting from AI.',
      'Some communities could benefit less than others.',
      'A small share of jobs in the region could be fully taken over by AI.',
    ],
    factIds: ['sa-economic-output-potential', 'sa-jobs-at-risk'],
  },
  {
    id: 'europe',
    name: 'Europe',
    naturalEarthName: 'Europe',
    marker: { lat: 53.3, lng: -6.3 },
    color: '#90ee90',
    iconBounds: { minLng: -25, maxLng: 45, minLat: 34, maxLat: 72 },
    description:
      'Europe, the UK and Ireland use AI in many ways, from helping doctors and schools to running businesses. AI needs powerful computer buildings called data centres, and Ireland has lots of them!',
    good: [
      'Helps hospitals, schools, factories and scientists.',
      'Data centres create jobs and add money to the economy.',
      'Public services can work faster and smarter.',
    ],
    challenges: [
      'Data centres need huge amounts of electricity and water.',
      'Many people are worried about the energy they use.',
      'It is hard to make rules for fast-changing technology across many countries.',
    ],
    factIds: [
      'ie-dc-capacity-2026',
      'ie-dc-electricity-2026',
      'ie-dc-co2-2026',
      'ie-dc-direct-jobs-2024',
      'ie-dc-gva-2024',
      'eu-survey-energy-negative-2024',
      'dublin-dc-capacity-2025',
      'ie-survey-renewable-only-2025',
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    naturalEarthName: 'Africa',
    marker: { lat: 5, lng: 20 },
    color: '#ffb340',
    iconBounds: { minLng: -20, maxLng: 55, minLat: -36, maxLat: 38 },
    description:
      'Across Africa, AI is helping doctors find diseases, giving farmers weather and crop information, improving education and helping run public services.',
    good: [
      'Helps doctors spot illnesses sooner.',
      'Supports farmers with weather and crop advice — this has already helped grow more food in some countries.',
      'AI lessons helped children learn faster in a pilot programme in Nigeria.',
    ],
    challenges: [
      'Many places don’t have reliable electricity or fast internet.',
      'Not enough people are trained yet to build and fix AI systems.',
      'Experts think some jobs in the region could be affected by AI.',
    ],
    factIds: ['africa-jobs-at-risk'],
  },
  {
    id: 'asia',
    name: 'Asia',
    naturalEarthName: 'Asia',
    marker: { lat: 34, lng: 100 },
    color: '#f472b6',
    iconBounds: { minLng: 40, maxLng: 150, minLat: -12, maxLat: 78 },
    description:
      'Asia is a major centre for AI. It is used in factories, hospitals, schools, transport, banking and lots of other places, and some of the world’s biggest AI companies are here.',
    good: [
      'Helps people and businesses work faster.',
      'Powers robots, factories and medicine.',
      'Creates new jobs — though the skills companies want are changing fast.',
    ],
    challenges: [
      'Some jobs, especially routine ones, may be replaced.',
      'Worries about surveillance and data privacy.',
      'Countries and workers with better technology and training may benefit more, leaving others behind.',
    ],
    factIds: ['sg-dc-capacity-2025'],
  },
  {
    id: 'oceania',
    name: 'Australia / Oceania',
    naturalEarthName: 'Oceania',
    marker: { lat: -25, lng: 134 },
    color: '#2dd4bf',
    iconBounds: { minLng: 110, maxLng: 180, minLat: -48, maxLat: 0 },
    description:
      'Australia and other countries in Oceania use AI in workplaces, schools, healthcare and government. Pacific islands could use AI to plan for storms, floods and climate change.',
    good: [
      'Helps people analyse information and finish tasks faster.',
      'Supports farming, mining and protecting the environment.',
      'More Australian job ads are asking for AI skills than ever before.',
    ],
    challenges: [
      'Islands are far apart, so infrastructure costs more.',
      'AI data centres need large amounts of electricity.',
      'Jobs that use AI a lot have grown a little more slowly — but there’s no sign yet of AI causing big job losses across the country.',
    ],
    factIds: ['oceania-ai-job-ads-growth'],
  },
  {
    id: 'antarctica',
    name: 'Antarctica',
    naturalEarthName: 'Antarctica',
    marker: { lat: -78, lng: 20 },
    color: '#a5b4fc',
    description:
      'Hardly anyone lives in Antarctica, so AI is mostly used for science. Scientists use AI to study satellite pictures, track animals, examine ice and understand climate change much faster than people could alone.',
    good: [
      'Studies satellite pictures of ice sheets quickly.',
      'Tracks penguins, seals and other wildlife.',
      'Helps scientists understand climate change.',
    ],
    challenges: [
      'The computers still need electricity in a very remote place.',
      'Equipment is expensive and internet is limited.',
      'Scientists always double-check AI’s work — one big ice study, for example, doesn’t prove on its own that AI caused the changes it found.',
    ],
    factIds: ['antarctica-satellite-missions'],
  },
]

export const continentsById: Record<ContinentId, Continent> = Object.fromEntries(
  continents.map((c) => [c.id, c]),
) as Record<ContinentId, Continent>

/**
 * Natural Earth tags all of Russia as "Europe". Most of its land is in Asia,
 * so for the globe colouring and icons we treat it as Asia. This only affects
 * visuals, not any statistics.
 */
export const naturalEarthContinentOverrides: Record<string, string> = {
  Russia: 'Asia',
}
