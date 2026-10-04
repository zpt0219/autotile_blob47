import { toHexColour } from '../core/patterns/patternPaint';
import {
  PATTERN_GROUPS,
  type PatternId,
  MIN_OUTLINE_WIDTH,
  MAX_OUTLINE_WIDTH,
  OUTLINE_WIDTH_STEP,
} from '../core/patterns/blob47Pattern';
import { InfoTip, ColourSwatch, SeedField, ResetLink } from '../components/Controls';
import type { RecipeEditor } from '../app/state/useRecipeEditor';

export function BoundaryPanel({
  patternId,
  edgeSeed,
  outlineWidth,
  bandSteps,
  hardEdgeB,
  transparentB,
  bandBias,
  customShadesHex,
  setPatternId,
  setEdgeSeed,
  setOutlineWidth,
  setBandSteps,
  setHardEdgeB,
  setBandBias,
  setCustomShadesHex,
  lang,
  t,
  canReseed,
  levels,
  derivedRamp,
  currentRampRGB,
  bandShadeIndices,
  bandOffsetPx,
  BAND_STEP_CHOICES,
}: Pick<
  RecipeEditor,
  | 'patternId'
  | 'edgeSeed'
  | 'outlineWidth'
  | 'bandSteps'
  | 'hardEdgeB'
  | 'transparentB'
  | 'bandBias'
  | 'customShadesHex'
  | 'setPatternId'
  | 'setEdgeSeed'
  | 'setOutlineWidth'
  | 'setBandSteps'
  | 'setHardEdgeB'
  | 'setBandBias'
  | 'setCustomShadesHex'
  | 'lang'
  | 't'
  | 'canReseed'
  | 'levels'
  | 'derivedRamp'
  | 'currentRampRGB'
  | 'bandShadeIndices'
  | 'bandOffsetPx'
  | 'BAND_STEP_CHOICES'
>) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">{t.sectionBand}</h2>

      <div className="slider-header" style={{ marginBottom: '6px' }}>
        <span className="slider-name">
          {t.patternStyle}
          <InfoTip text={t.patternHint} />
        </span>
      </div>
      <select
        className="text-input"
        value={patternId}
        onChange={(e) => setPatternId(e.target.value as PatternId)}
      >
        {PATTERN_GROUPS.map((g) => (
          <optgroup key={g.en} label={lang === 'zh' ? g.zh : g.en}>
            {g.items.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'zh' ? p.zh : p.en}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {canReseed && (
        <>
          <div className="slider-header" style={{ margin: '12px 0 6px' }}>
            <span className="slider-name">
              {t.edgeSeed}
              <InfoTip text={t.edgeRerollHint} />
            </span>
            {edgeSeed === 0 && <span className="slider-val">{t.edgeSeedOriginal}</span>}
          </div>
          <SeedField
            value={edgeSeed}
            onChange={setEdgeSeed}
            diceTitle={t.randomSeed}
            resetTitle={t.resetSeed}
          />
        </>
      )}

      <div className="slider-header" style={{ margin: '14px 0 6px' }}>
        <span className="slider-name">
          {t.bandSteps}
          <InfoTip text={t.bandStepsHint} />
        </span>
      </div>
      <div className="type-tabs" style={{ marginBottom: '8px' }}>
        {BAND_STEP_CHOICES.map((n) => (
          <button
            key={n}
            className={`tab-btn ${bandSteps === n ? 'active' : ''}`}
            onClick={() => setBandSteps(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="slider-header" style={{ margin: '12px 0 6px' }}>
        <span className="slider-name" style={{ fontSize: '11px' }}>
          {t.patternShades}
        </span>
        {customShadesHex &&
          bandShadeIndices.some((idx: number) => Boolean(customShadesHex[idx])) && (
            <ResetLink
              label={t.reset}
              title={t.resetShadesHint}
              onClick={() => setCustomShadesHex(null)}
            />
          )}
      </div>
      <div className="swatch-row" style={{ marginBottom: '10px' }}>
        {bandShadeIndices.map((idx: number) => {
          const hex = toHexColour(currentRampRGB[idx]);
          // hardEdgeB collapses the terrain-B shade, and transparency
          // discards it outright — either way its swatch has nothing left
          // to colour. Same swatch, two reasons, so the reason is in the
          // tooltip.
          const isTransparent = transparentB && levels[idx].role === 'terrainB';
          const isDisabled = isTransparent || (hardEdgeB && idx === 1);
          const roleLabel = levels[idx].role === 'terrainA' ? t.shadeSideA : t.shadeSideB;
          return (
            <ColourSwatch
              key={idx}
              hex={hex}
              disabled={isDisabled}
              isCustom={Boolean(customShadesHex && customShadesHex[idx])}
              title={
                isDisabled
                  ? `${roleLabel} — ${isTransparent ? t.transparentB : t.shadeDisabled}`
                  : `${roleLabel} (${hex}) — ${t.clickToCustomize}`
              }
              onChange={(next) => {
                // Start from the derived ramp unless an override of the
                // RIGHT LENGTH is already in force — a stale one from a
                // different step count would mis-index.
                const base =
                  customShadesHex && customShadesHex.length === derivedRamp.length
                    ? [...customShadesHex]
                    : derivedRamp.map(toHexColour);
                base[idx] = next;
                setCustomShadesHex(base);
              }}
            />
          );
        })}
      </div>

      <div className="slider-header" style={{ margin: '12px 0 6px' }}>
        <span className="slider-name">
          {t.outlineWidth}
          <InfoTip text={t.outlineWidthHint} />
        </span>
        <span className="slider-val">{outlineWidth.toFixed(2)} px</span>
      </div>
      <input
        type="range"
        className="slider-input"
        min={MIN_OUTLINE_WIDTH}
        max={MAX_OUTLINE_WIDTH}
        step={OUTLINE_WIDTH_STEP}
        value={outlineWidth}
        onChange={(e) => setOutlineWidth(parseFloat(e.target.value))}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* The marker sits outside the <label>: inside it, clicking the
                button would count as a click on the label and toggle the box. */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0 14px' }}>
        <label className="checkbox-group">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={hardEdgeB}
            onChange={(e) => setHardEdgeB(e.target.checked)}
          />
          <span className="checkbox-label">{t.hardEdgeB}</span>
        </label>
        <InfoTip text={t.hardEdgeBHint} />
      </div>

      <div className="slider-header" style={{ marginBottom: '6px' }}>
        <span className="slider-name">{t.bandBias}</span>
        <span className="slider-val">
          {bandOffsetPx === 0
            ? t.bandBiasZero
            : `${bandOffsetPx > 0 ? '+' : ''}${bandOffsetPx.toFixed(2)} px`}
        </span>
      </div>
      <input
        type="range"
        className="slider-input"
        min={-1}
        max={1}
        step={0.05}
        value={bandBias}
        onChange={(e) => setBandBias(parseFloat(e.target.value))}
        onDragStart={(e) => e.preventDefault()}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10.5px',
          color: 'var(--muted)',
          marginTop: '2px',
        }}
      >
        <span>{t.bandTowardCentre}</span>
        <span>{t.bandTowardBorder}</span>
      </div>
    </section>
  );
}
