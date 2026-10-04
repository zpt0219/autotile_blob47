import { toHexColour } from '../core/patterns/patternPaint';
import { NOISE_PRESETS, NOISE_TARGETS, MAX_NOISE_STRENGTH } from '../core/patterns/patternNoise';
import { InfoTip, ColourSwatch, SeedField, ResetLink } from '../components/Controls';
import type { RecipeEditor } from '../app/state/useRecipeEditor';

export function NoisePanel({
  transparentB,
  noiseTargets,
  customNoiseHex,
  patternNoise,
  patternNoiseSeed,
  patternNoiseStrength,
  setCustomNoiseHex,
  setPatternNoiseSeed,
  setPatternNoiseStrength,
  lang,
  t,
  toggleNoise,
  toggleNoiseTarget,
  derivedRamp,
}: Pick<
  RecipeEditor,
  | 'transparentB'
  | 'noiseTargets'
  | 'customNoiseHex'
  | 'patternNoise'
  | 'patternNoiseSeed'
  | 'patternNoiseStrength'
  | 'setCustomNoiseHex'
  | 'setPatternNoiseSeed'
  | 'setPatternNoiseStrength'
  | 'lang'
  | 't'
  | 'toggleNoise'
  | 'toggleNoiseTarget'
  | 'derivedRamp'
>) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">{t.patternNoise}</h2>
      <div className="slider-header" style={{ marginBottom: '6px' }}>
        <span className="slider-name">
          {t.patternNoise}
          <InfoTip text={t.noiseStackHint} />
        </span>
        <span className="slider-val">
          {patternNoise.length === 0 ? t.noiseOff : `${patternNoise.length}`}
        </span>
      </div>
      <div className="noise-preset-tabs" style={{ marginBottom: '8px' }}>
        {NOISE_PRESETS.map((n) => {
          const isActive = patternNoise.includes(n.id);
          const shortLabel = lang === 'zh' ? n.zh.split(' · ')[0] : n.en.split(' — ')[0];
          return (
            <button
              key={n.id}
              type="button"
              className={`noise-preset-btn ${isActive ? 'active' : ''}`}
              onClick={() => toggleNoise(n.id)}
              title={lang === 'zh' ? n.zh : n.en}
            >
              {shortLabel}
            </button>
          );
        })}
      </div>

      {patternNoise.length > 0 && (
        <div style={{ margin: '2px 0 10px' }}>
          <div className="slider-header" style={{ marginBottom: '6px' }}>
            <span className="slider-name">{t.noiseAmount}</span>
            <span className="slider-val">
              {patternNoiseStrength === 0
                ? t.noiseOff
                : `${Math.round(patternNoiseStrength * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            className="slider-input"
            style={{ marginBottom: '12px' }}
            min={0}
            max={MAX_NOISE_STRENGTH}
            step={0.05}
            value={patternNoiseStrength}
            onChange={(e) => setPatternNoiseStrength(parseFloat(e.target.value))}
            onDragStart={(e) => e.preventDefault()}
          />

          <div className="slider-header" style={{ marginBottom: '6px' }}>
            <span className="slider-name">
              {t.noiseSeed}
              <InfoTip text={t.noiseSeedHint} />
            </span>
          </div>
          <SeedField
            value={patternNoiseSeed}
            onChange={setPatternNoiseSeed}
            diceTitle={t.randomSeed}
            resetTitle={t.resetSeed}
          />

          <div className="slider-header" style={{ margin: '10px 0 4px' }}>
            <span className="slider-name" style={{ fontSize: '11px' }}>
              {t.noiseTargets}
              <InfoTip text={t.noiseTargetsHint} />
            </span>
          </div>
          <div className="noise-preset-tabs" style={{ marginBottom: '10px' }}>
            {NOISE_TARGETS.map((tTarget) => {
              const isActive = noiseTargets.includes(tTarget.id);
              // With terrain B transparent there is no terrain-B side of the
              // band to move a pixel out of, so this target cannot do
              // anything but erode the outline into the hole.
              const inert = tTarget.id === 'terrainB' && transparentB;
              return (
                <button
                  key={tTarget.id}
                  type="button"
                  disabled={inert}
                  className={`noise-preset-btn compact ${isActive && !inert ? 'active' : ''}`}
                  style={inert ? { opacity: 0.4 } : undefined}
                  onClick={() => toggleNoiseTarget(tTarget.id)}
                  title={inert ? t.transparentBInert : lang === 'zh' ? tTarget.zh : tTarget.en}
                >
                  {lang === 'zh' ? tTarget.shortZh : tTarget.shortEn}
                </button>
              );
            })}
          </div>

          <div className="slider-header" style={{ margin: '12px 0 6px' }}>
            <span className="slider-name" style={{ fontSize: '11px' }}>
              {t.noiseColours}
            </span>
            {customNoiseHex && (customNoiseHex.b || customNoiseHex.edge || customNoiseHex.a) && (
              <ResetLink
                label={t.reset}
                title={t.resetNoiseColoursHint}
                onClick={() => setCustomNoiseHex(null)}
              />
            )}
          </div>
          <div className="swatch-row" style={{ marginBottom: '12px' }}>
            {(['b', 'edge', 'a'] as const).map((side) => {
              // Three pickers over a band that can have up to five steps:
              // each stands for a DIRECTION the grain nudges a pixel, not
              // for one particular level.
              const defaultHex = toHexColour(
                side === 'b'
                  ? derivedRamp[1]
                  : side === 'edge'
                    ? derivedRamp[2]
                    : derivedRamp[derivedRamp.length - 2],
              );
              const hex = customNoiseHex?.[side] ?? defaultHex;
              const label =
                side === 'b'
                  ? t.noiseColourB
                  : side === 'edge'
                    ? t.noiseColourEdge
                    : t.noiseColourA;
              return (
                <div key={side} className="swatch-cell">
                  <span className="swatch-cell-label">{label}</span>
                  <ColourSwatch
                    hex={hex}
                    isCustom={Boolean(customNoiseHex?.[side])}
                    title={`${label} (${hex}) — ${t.clickToCustomize}`}
                    onChange={(next) => setCustomNoiseHex((prev) => ({ ...prev, [side]: next }))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
