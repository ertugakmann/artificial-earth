# Artificial Earth — MVP

An interactive, educational globe (ages 8–12) showing how AI affects different
parts of the world. Runs entirely in the browser: no backend, database, login
or external APIs.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Other scripts: `npm run build` (type-check + production build), `npm run preview`.

## How it works

- **Globe** — Three.js via React Three Fiber. The Earth texture is drawn on a
  canvas at start-up from Natural Earth 110 m country outlines
  (`src/data/world110m.json`, public domain), so no image assets or network
  access are needed. Continents on the globe use the same colours as the
  navigation cards.
- **Markers** — one light-green marker per continent, positioned by
  latitude/longitude in `src/data/continents.ts`.
- **Panel** — a single reusable `ContinentPanel` renders whichever continent is
  selected: description, "The Good", "The Challenges" and "Did you know?" facts.
- **Navigation** — bottom cards with continent silhouettes (also generated from
  the outline data). Cards and markers select the same continent.

## Data

All figures come from `resources/Artificial Earth Teams Data.xlsx`.
`src/data/datasets.ts` holds a typed, hand-picked subset; every value records
the sheet it came from (`sourceSheet`). Continents reference facts by id in
`factIds`, so adding a new fact is:

1. Add a `DataPoint` to `datasets.ts` with the value copied from the sheet.
2. Add its id to the relevant continent's `factIds`.

The dataset currently only contains figures for Ireland/Europe, the UK and
Singapore. Continents without figures show a short "no numbers yet" note rather
than invented statistics.

Educational text is adapted for children from `resources/AI Around the World
Project.pdf` and `resources/Interactive Google Earth Prompt.pdf`.

## Structure

```
src/
  components/
    Globe/        Earth, ContinentMarker, GlobeControls
    UI/           Header, ContinentPanel, ContinentNavigation, FactCard, InstructionCard
    Background/   SpaceBackground
  data/           continents.ts, datasets.ts, world110m.json
  types/          continent.ts, dataset.ts
  utils/          geo.ts, dataTransform.ts, continentShapes.ts, earthTexture.ts
```
