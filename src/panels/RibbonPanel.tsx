import { toHexColour } from '../core/patterns/patternPaint';
import {
  RIBBON_GROUPS,
  RIBBON_MIN_WIDTH,
  RIBBON_PERIODS,
  MAX_RIBBON_SHADES,
  ribbonUsesInvert,
  ribbonUsesPeriod,
  type RibbonId,
} from '../core/patterns/patternRibbon';
import { InfoTip, ColourSwatch, ResetLink } from '../components/Controls';
import type { RecipeEditor } from '../app/state/useRecipeEditor';

export function RibbonPanel({
  ribbonAlgo,
  ribbonAmount,
  ribbonPeriod,
  ribbonShades,
  ribbonInvert,
  customRibbonHex,
  setRibbonAlgo,
  setRibbonAmount,
  setRibbonPeriod,
  setRibbonShades,
  setRibbonInvert,
  setCustomRibbonHex,
  lang,
  t,
  ribbonRamp,
  ribbonWidthPx,
  ribbonTooNarrow,
  ribbonReachable,
  RIBBON_SHADE_CHOICES,
}: Pick<
  RecipeEditor,
  | 'ribbonAlgo'
  | 'ribbonAmount'
  | 'ribbonPeriod'
  | 'ribbonShades'
  | 'ribbonInvert'
  | 'customRibbonHex'
  | 'setRibbonAlgo'
  | 'setRibbonAmount'
  | 'setRibbonPeriod'
  | 'setRibbonShades'
  | 'setRibbonInvert'
  | 'setCustomRibbonHex'
  | 'lang'
  | 't'
  | 'ribbonRamp'
  | 'ribbonWidthPx'
  | 'ribbonTooNarrow'
  | 'ribbonReachable'
  | 'RIBBON_SHADE_CHOICES'
>) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">{t.ribbonTitle}</h2>
      {/* The outline is a ribbon with width, so it gets a motif of its
                own. Separate from the band grain below, which erodes the band
                rather than decorating the line inside it. */}
      <div className="slider-header" style={{ marginBottom: '4px' }}>
        <span className="slider-name">
          {t.ribbonAlgo}
          <InfoTip text={t.ribbonHint} />
        </span>
      </div>
      <select
        className="text-input"
        value={ribbonAlgo}
        onChange={(e) => setRibbonAlgo(e.target.value as RibbonId)}
      >
        {RIBBON_GROUPS.map((g) => (
          <optgroup key={g.en} label={lang === 'zh' ? g.zh : g.en}>
            {g.items.map((r) => (
              <option key={r.id} value={r.id}>
                {lang === 'zh' ? r.zh : r.en}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {ribbonAlgo !== 'none' && (
        <>
          {/* Said outright rather than dropping the motif from the menu: a
                  motif that needs three pixels is a reason to widen the outline,
                  not a reason to hide it. */}
          {ribbonTooNarrow && (
            <p className="field-note field-warn">
              {t.ribbonTooNarrow
                .replace('{n}', String(RIBBON_MIN_WIDTH[ribbonAlgo]))
                .replace('{w}', String(Math.round(ribbonWidthPx * 10) / 10))}
            </p>
          )}

          <div className="slider-header" style={{ margin: '8px 0 4px' }}>
            <span className="slider-name">
              {t.ribbonAmount}
              <InfoTip text={t.ribbonAmountHint} />
            </span>
            <span className="slider-val">
              {ribbonAmount === 0 ? t.noiseOff : `${Math.round(ribbonAmount * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            className="slider-input"
            min={0}
            max={1}
            step={0.05}
            value={ribbonAmount}
            onChange={(e) => setRibbonAmount(parseFloat(e.target.value))}
          />

          {ribbonUsesPeriod(ribbonAlgo) && (
            <>
              <div className="slider-header" style={{ margin: '10px 0 4px' }}>
                <span className="slider-name" style={{ fontSize: '11px' }}>
                  {t.ribbonPeriod}
                  <InfoTip text={t.ribbonPeriodHint} />
                </span>
              </div>
              <div className="type-tabs" style={{ marginBottom: '6px' }}>
                {RIBBON_PERIODS.map((n) => (
                  <button
                    key={n}
                    className={`tab-btn ${ribbonPeriod === n ? 'active' : ''}`}
                    onClick={() => setRibbonPeriod(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}

          {ribbonUsesInvert(ribbonAlgo) && (
            <label className="checkbox-group" style={{ margin: '8px 0' }}>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={ribbonInvert}
                onChange={(e) => setRibbonInvert(e.target.checked)}
              />
              <span className="checkbox-label">{t.ribbonInvert}</span>
            </label>
          )}

          <div className="slider-header" style={{ margin: '8px 0 4px' }}>
            <span className="slider-name" style={{ fontSize: '11px' }}>
              {t.ribbonColours}
            </span>
            {customRibbonHex?.some(Boolean) && (
              <ResetLink
                label={t.reset}
                title={t.resetRibbonColoursHint}
                onClick={() => setCustomRibbonHex(null)}
              />
            )}
          </div>
          <div className="swatch-row">
            {Array.from({ length: MAX_RIBBON_SHADES }, (_, i) => i + 1).map((k) => {
              // Same rule as the terrain swatches: every slot is drawn so the
              // row never reflows, and the ones this motif cannot reach at
              // its current width and strength are crossed out rather than
              // silently doing nothing when clicked.
              const isDisabled = !ribbonReachable.has(k);
              const hex = toHexColour(ribbonRamp[Math.min(k, ribbonShades)]);
              return (
                <ColourSwatch
                  key={k}
                  hex={hex}
                  disabled={isDisabled}
                  isCustom={Boolean(customRibbonHex?.[k])}
                  title={
                    isDisabled
                      ? `${t.ribbonColours} ${k} — ${t.textureShadeDisabled}`
                      : `${t.ribbonColours} ${k} (${hex}) — ${t.clickToCustomize}`
                  }
                  onChange={(next) =>
                    setCustomRibbonHex((prev) => {
                      // Start from an override of the RIGHT LENGTH; a stale one
                      // from a different shade count would mis-index.
                      const base =
                        prev && prev.length === ribbonShades + 1
                          ? [...prev]
                          : new Array<string | undefined>(ribbonShades + 1).fill(undefined);
                      base[k] = next;
                      return base;
                    })
                  }
                />
              );
            })}
          </div>

          <div className="slider-header" style={{ margin: '8px 0 4px' }}>
            <span className="slider-name" style={{ fontSize: '11px' }}>
              {t.ribbonShades}
            </span>
            <span className="slider-val">{ribbonShades}</span>
          </div>
          <div className="type-tabs" style={{ marginBottom: '6px' }}>
            {RIBBON_SHADE_CHOICES.map((n) => (
              <button
                key={n}
                className={`tab-btn ${ribbonShades === n ? 'active' : ''}`}
                onClick={() => setRibbonShades(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
