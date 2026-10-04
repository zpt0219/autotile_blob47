import type { Recipe } from '../model/recipe';
import {
  patternLevelsFor,
  PATTERN_OFFSET_RANGE,
  RESEEDABLE_PATTERNS,
  outlineWidthPx,
} from './patterns/blob47Pattern';
import { patternRamp, parseHexColour, DEFAULT_TEXTURE_COLOURS } from './patterns/patternPaint';
import {
  textureRamp,
  usedTextureShades,
  textureUsesAmount,
  WATER_DOT_COLOUR,
} from './patterns/patternTexture';
import { RIBBON_MIN_WIDTH, usedRibbonShades } from './patterns/patternRibbon';
import { SHEET_TILE_SIZE } from './renderSheet';

export function deriveRecipeView(r: Recipe) {
  const roleColours = {
    terrainA: parseHexColour(r.roleHex.terrainA),
    terrainB: parseHexColour(r.roleHex.terrainB),
    edge: parseHexColour(r.roleHex.edge),
  };
  const levels = patternLevelsFor(r.bandSteps);
  const derivedRamp = patternRamp(roleColours, r.bandSteps);
  const currentRampRGB =
    r.customShadesHex?.length === derivedRamp.length
      ? derivedRamp.map((c, i) =>
          r.customShadesHex?.[i] ? parseHexColour(r.customShadesHex[i]) : c,
        )
      : derivedRamp;
  const outlineLevel = levels.findIndex((l) => l.role === 'edge');
  const [lo, hi] = PATTERN_OFFSET_RANGE[r.patternId];
  const textureRamps = {} as Record<'terrainA' | 'terrainB', ReturnType<typeof textureRamp>>;
  const reachable = {} as Record<'terrainA' | 'terrainB', Set<number>>;
  for (const role of ['terrainA', 'terrainB'] as const) {
    const suffix = role === 'terrainA' ? 'A' : 'B';
    const algo = r[`textureAlgo${suffix}`];
    const shades = algo === 'water' ? 2 : r[`textureShades${suffix}`];
    const custom = r.customTexHex[role]
      ?.slice(0, shades + 1)
      .map((h) => (h ? parseHexColour(h) : undefined));
    const ramp = custom
      ? [...custom]
      : Array<ReturnType<typeof parseHexColour> | undefined>(shades + 1).fill(undefined);
    if (algo === 'water') ramp[2] ??= WATER_DOT_COLOUR;
    textureRamps[role] = textureRamp(
      roleColours[role],
      DEFAULT_TEXTURE_COLOURS[role],
      shades,
      ramp,
    );
    reachable[role] = usedTextureShades(
      algo,
      textureUsesAmount(algo) ? r[`textureAmount${suffix}`] : 1,
      shades,
      r[`cellScale${suffix}`],
      r[`rippleScale${suffix}`],
      r[`geoScale${suffix}`],
      r[`textureSeed${suffix}`],
    );
  }
  const ribbonWidthPx = outlineWidthPx(
    r.patternId,
    r.bandSteps,
    r.hardEdgeB,
    r.outlineWidth,
    SHEET_TILE_SIZE,
  );
  const ribbonRamp = textureRamp(
    currentRampRGB[outlineLevel],
    undefined,
    r.ribbonShades,
    r.customRibbonHex?.map((h) => (h ? parseHexColour(h) : undefined)),
  );
  return {
    roleColours,
    levels,
    derivedRamp,
    currentRampRGB,
    outlineLevel,
    textureRamps,
    reachable,
    ribbonRamp,
    ribbonWidthPx,
    bandShadeIndices: levels.map((l, i) => (l.shade > 0 ? i : -1)).filter((i) => i >= 0),
    bandOffsetPx: r.bandBias < 0 ? -r.bandBias * lo : r.bandBias * hi,
    canReseed: RESEEDABLE_PATTERNS.has(r.patternId),
    ribbonTooNarrow: r.ribbonAlgo !== 'none' && ribbonWidthPx < RIBBON_MIN_WIDTH[r.ribbonAlgo],
    ribbonReachable: usedRibbonShades(
      r.ribbonAlgo,
      ribbonWidthPx,
      r.ribbonAmount,
      r.ribbonShades,
      r.ribbonPeriod,
      r.ribbonInvert,
    ),
    BAND_STEP_CHOICES: [3, 4, 5],
    TEXTURE_SHADE_CHOICES: [1, 2, 3, 4],
    RIBBON_SHADE_CHOICES: [1, 2, 3, 4],
  };
}
