import type { ContinentId } from '../types/continent'
import { continentsById } from '../data/continents'
import type { Opportunity } from '../types/game'

/** `{continent}` is replaced with the continent's display name. */
const TEMPLATES: string[] = [
  '{continent} has announced plans to build a major new AI data centre. They want you to fund the project as the largest shareholder. Do you accept?',
  'A tech company wants to build a new AI data centre in {continent} to train the next generation of smart assistants. Will you invest?',
  'Investors in {continent} are looking for funding to build a data centre that powers AI for hospitals and schools nearby. Interested?',
  'A new AI data centre is being proposed in {continent} to take advantage of the local climate for cooling. Would you like to fund the project?',
  '{continent} is offering land and cheap electricity for a brand-new AI data centre. Do you want to be the founding investor?',
  'Engineers in {continent} have designed an efficient new AI data centre and need a backer to get it built. Will you fund it?',
  'A start-up in {continent} wants to build a small AI data centre to serve local businesses. They need your investment to start construction.',
  'Government officials in {continent} are inviting investors to help build a new AI data centre for public services. Do you accept?',
]

let counter = 0

/** Random integer in [min, max], inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates a random, always-affordable investment opportunity for the given
 * continent. Cost is a random slice of the player's current money so the
 * player can never be offered something they can't pay for.
 */
export function generateOpportunity(money: number, continentId: ContinentId): Opportunity | null {
  const MIN_COST = 400
  if (money < MIN_COST) return null

  const maxCost = Math.max(MIN_COST, Math.min(money, money * 0.35))
  const minCost = Math.min(MIN_COST, maxCost)
  const cost = Math.round(randInt(minCost, maxCost) / 10) * 10

  // Bigger investment → bigger income and bigger environmental impact.
  const scale = cost / 2500
  const income = Math.round((150 + scale * 250 + randInt(-40, 40)) / 5) * 5
  const waterImpact = Math.max(1, Math.round(2 + scale * 4 + randInt(-1, 1)))
  const pollutionImpact = Math.max(1, Math.round(3 + scale * 6 + randInt(-1, 2)))

  const template = TEMPLATES[randInt(0, TEMPLATES.length - 1)]
  const continentName = continentsById[continentId].name
  const text = template.replace('{continent}', continentName)

  counter += 1
  return {
    id: `opp-${Date.now()}-${counter}`,
    continentId,
    text,
    cost,
    income,
    waterImpact,
    pollutionImpact,
  }
}

const ALL_CONTINENT_IDS: ContinentId[] = [
  'north-america',
  'south-america',
  'europe',
  'africa',
  'asia',
  'oceania',
  'antarctica',
]

export function randomContinentId(): ContinentId {
  return ALL_CONTINENT_IDS[randInt(0, ALL_CONTINENT_IDS.length - 1)]
}
