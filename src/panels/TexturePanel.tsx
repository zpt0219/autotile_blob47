import { toHexColour } from '../core/patterns/patternPaint';
import {
  TEXTURE_GROUPS,
  MAX_TEXTURE_SHADES,
  MIN_CELL_SCALE,
  MAX_CELL_SCALE,
  MIN_RIPPLE_SCALE,
  MAX_RIPPLE_SCALE,
  geoScalesFor,
  textureUsesGeoScale,
  textureUsesAmount,
} from '../core/patterns/patternTexture';
import { InfoTip, ColourSwatch, SeedField, ResetLink } from '../components/Controls';
import type { RecipeEditor } from '../app/state/useRecipeEditor';

export function TexturePanel({
  roleColours,
  transparentB,
  textureAlgoA,
  textureAlgoB,
  textureAmountA,
  textureAmountB,
  textureShadesA,
  textureShadesB,
  textureSeedA,
  textureSeedB,
  cellScaleA,
  cellScaleB,
  rippleScaleA,
  rippleScaleB,
  geoScaleA,
  geoScaleB,
  customTexHex,
  setTextureAmountA,
  setTextureAmountB,
  setTextureShadesA,
  setTextureShadesB,
  setTextureSeedA,
  setTextureSeedB,
  setCellScaleA,
  setCellScaleB,
  setRippleScaleA,
  setRippleScaleB,
  setGeoScaleA,
  setGeoScaleB,
  setCustomTexHex,
  lang,
  t,
  textureRamps,
  reachable,
  TEXTURE_SHADE_CHOICES,
  setOpenTexturePicker,
}: Pick<
  RecipeEditor,
  | 'roleColours'
  | 'transparentB'
  | 'textureAlgoA'
  | 'textureAlgoB'
  | 'textureAmountA'
  | 'textureAmountB'
  | 'textureShadesA'
  | 'textureShadesB'
  | 'textureSeedA'
  | 'textureSeedB'
  | 'cellScaleA'
  | 'cellScaleB'
  | 'rippleScaleA'
  | 'rippleScaleB'
  | 'geoScaleA'
  | 'geoScaleB'
  | 'customTexHex'
  | 'setTextureAmountA'
  | 'setTextureAmountB'
  | 'setTextureShadesA'
  | 'setTextureShadesB'
  | 'setTextureSeedA'
  | 'setTextureSeedB'
  | 'setCellScaleA'
  | 'setCellScaleB'
  | 'setRippleScaleA'
  | 'setRippleScaleB'
  | 'setGeoScaleA'
  | 'setGeoScaleB'
  | 'setCustomTexHex'
  | 'lang'
  | 't'
  | 'textureRamps'
  | 'reachable'
  | 'TEXTURE_SHADE_CHOICES'
> & { setOpenTexturePicker: (role: 'terrainA' | 'terrainB' | null) => void }) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">{t.terrainTexture}</h2>
      <div className="slider-header" style={{ margin: '16px 0 6px' }}>
        <span className="slider-name">
          {t.terrainTexture}
          <InfoTip text={t.textureHint} />
        </span>
      </div>

      {(
        [
          [
            'terrainA',
            textureAlgoA,
            textureAmountA,
            setTextureAmountA,
            textureShadesA,
            setTextureShadesA,
            textureSeedA,
            setTextureSeedA,
            cellScaleA,
            setCellScaleA,
            rippleScaleA,
            setRippleScaleA,
            geoScaleA,
            setGeoScaleA,
            t.textureAlgoA,
            t.textureAmountA,
            t.textureColourA,
            t.textureSeedA,
            t.textureCellScaleA,
            t.textureRippleScaleA,
            t.textureGeoScaleA,
          ],
          [
            'terrainB',
            textureAlgoB,
            textureAmountB,
            setTextureAmountB,
            textureShadesB,
            setTextureShadesB,
            textureSeedB,
            setTextureSeedB,
            cellScaleB,
            setCellScaleB,
            rippleScaleB,
            setRippleScaleB,
            geoScaleB,
            setGeoScaleB,
            t.textureAlgoB,
            t.textureAmountB,
            t.textureColourB,
            t.textureSeedB,
            t.textureCellScaleB,
            t.textureRippleScaleB,
            t.textureGeoScaleB,
          ],
        ] as const
      ).map(
        ([
          role,
          algo,
          val,
          set,
          shadeCount,
          setShadeCount,
          seedValue,
          setSeed,
          cellScaleVal,
          setCellScale,
          rippleScaleVal,
          setRippleScale,
          geoScaleVal,
          setGeoScale,
          algoLabel,
          amountLabel,
          colourLabel,
          seedLabel,
          cellScaleLabel,
          rippleScaleLabel,
          geoScaleLabel,
        ]) => {
          const isWater = algo === 'water';
          const effectiveShadeCount = isWater ? 2 : shadeCount;
          const effectiveColourLabel = isWater ? t.textureWaterEdgeColour : colourLabel;
          const shadeSlots = isWater
            ? [1, 2]
            : Array.from({ length: MAX_TEXTURE_SHADES }, (_, i) => i + 1);
          // A transparent terrain B has no surface to texture. The block is
          // dimmed and shut off rather than hidden, so the row does not reflow
          // out from under the cursor and the picked settings survive the
          // round trip when transparency is switched back off.
          const inert = role === 'terrainB' && transparentB;
          return (
            <div
              key={role}
              className={`texture-material-block texture-material-${role}`}
              style={inert ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
              aria-disabled={inert || undefined}
            >
              <div className="slider-header" style={{ marginBottom: '4px' }}>
                <span className="slider-name">{algoLabel}</span>
                {inert && <span className="slider-val">{t.transparent}</span>}
              </div>
              {(() => {
                let currentGroupLabel = '';
                let currentItemLabel = '';
                for (const g of TEXTURE_GROUPS) {
                  const found = g.items.find((item) => item.id === algo);
                  if (found) {
                    currentGroupLabel = lang === 'zh' ? g.zh : g.en;
                    currentItemLabel = lang === 'zh' ? found.zh : found.en;
                    break;
                  }
                }
                return (
                  <button
                    type="button"
                    className="texture-picker-trigger"
                    onClick={() => setOpenTexturePicker(role)}
                  >
                    <div className="trigger-label-group">
                      <span className="trigger-group-tag">{currentGroupLabel}</span>
                      <span className="trigger-item-name">{currentItemLabel}</span>
                    </div>
                    <span className="trigger-arrow">▼</span>
                  </button>
                );
              })()}

              {algo !== 'none' && (
                <>
                  {algo === 'cells' && (
                    <>
                      <div className="slider-header" style={{ margin: '8px 0 4px' }}>
                        <span className="slider-name" style={{ fontSize: '11px' }}>
                          {cellScaleLabel}
                        </span>
                        <span className="slider-val">
                          {cellScaleVal}×{cellScaleVal}
                        </span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        style={{ width: '100%' }}
                        min={MIN_CELL_SCALE}
                        max={MAX_CELL_SCALE}
                        step={1}
                        value={cellScaleVal}
                        onChange={(e) => setCellScale(parseInt(e.target.value, 10))}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </>
                  )}

                  {/* Motif size. Named sizes, not a slider: only the divisors of
                      32 that leave the motif on whole pixels are usable, and the
                      list is per texture — nonslip's motif is built on an 8px
                      cell, so it scales up only. */}
                  {textureUsesGeoScale(algo) && (
                    <>
                      <div className="slider-header" style={{ margin: '8px 0 4px' }}>
                        <span className="slider-name" style={{ fontSize: '11px' }}>
                          {geoScaleLabel}
                        </span>
                      </div>
                      <div className="type-tabs">
                        {geoScalesFor(algo).map((g) => (
                          <button
                            key={g.id}
                            className={`tab-btn ${geoScaleVal === g.id ? 'active' : ''}`}
                            style={{ fontSize: '11px' }}
                            onClick={() => setGeoScale(g.id)}
                          >
                            {lang === 'zh' ? g.zh : g.en}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {(algo === 'ripple' || algo === 'ripple_diag') && (
                    <>
                      <div className="slider-header" style={{ margin: '8px 0 4px' }}>
                        <span className="slider-name" style={{ fontSize: '11px' }}>
                          {rippleScaleLabel}
                        </span>
                        <span className="slider-val">{rippleScaleVal}</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        style={{ width: '100%' }}
                        min={MIN_RIPPLE_SCALE}
                        max={MAX_RIPPLE_SCALE}
                        step={1}
                        value={rippleScaleVal}
                        onChange={(e) => setRippleScale(parseInt(e.target.value, 10))}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </>
                  )}

                  {/* Hidden on the pavings. There it did not thin anything — it
                      quantised the shade ladder, which merged the four picked
                      colours into two and could drop the grout onto the same
                      colour as a tile. See textureUsesAmount. */}
                  {textureUsesAmount(algo) && (
                    <>
                      <div className="slider-header" style={{ margin: '8px 0 4px' }}>
                        <span className="slider-name">
                          {algo === 'nonslip'
                            ? role === 'terrainA'
                              ? t.textureDashLengthA
                              : t.textureDashLengthB
                            : amountLabel}
                        </span>
                        <span className="slider-val">
                          {val === 0 ? t.noiseOff : `${Math.round(val * 100)}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        style={{ width: '100%' }}
                        min={0}
                        max={1}
                        step={0.05}
                        value={val}
                        onChange={(e) => set(parseFloat(e.target.value))}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </>
                  )}

                  <div className="slider-header" style={{ margin: '8px 0 4px' }}>
                    <span className="slider-name" style={{ fontSize: '11px' }}>
                      {seedLabel}
                      <InfoTip text={t.textureSeedHint} />
                    </span>
                  </div>
                  <SeedField
                    value={seedValue}
                    onChange={setSeed}
                    diceTitle={t.randomSeed}
                    resetTitle={t.resetSeed}
                  />

                  <div className="slider-header" style={{ margin: '8px 0 4px' }}>
                    <span className="slider-name" style={{ fontSize: '11px' }}>
                      {effectiveColourLabel}
                    </span>
                    {customTexHex[role]?.some(Boolean) && (
                      <ResetLink
                        label={t.reset}
                        title={t.resetTextureColoursHint}
                        onClick={() => setCustomTexHex((p) => ({ ...p, [role]: null }))}
                      />
                    )}
                  </div>
                  <div className="swatch-row">
                    {shadeSlots.map((k) => {
                      // Every slot is drawn whatever the settings, so the row
                      // never reflows; the ones the texture cannot currently
                      // reach are crossed out rather than hidden. That covers
                      // both a step count below the slot and a density too low
                      // for the ramp to climb this far, which otherwise leaves a
                      // swatch that silently does nothing when clicked.
                      const isDisabled = !reachable[role].has(k);
                      const ramp = textureRamps[role];
                      const targetIdx = isDisabled ? effectiveShadeCount : k;
                      const rampColour =
                        ramp[targetIdx] ??
                        ramp[Math.min(targetIdx, ramp.length - 1)] ??
                        roleColours[role];
                      const hex = toHexColour(rampColour);
                      const swatchLabel =
                        isWater && k === 2 ? t.textureWaterDotColour : effectiveColourLabel;
                      return (
                        <ColourSwatch
                          key={k}
                          hex={hex}
                          disabled={isDisabled}
                          isCustom={Boolean(customTexHex[role]?.[k])}
                          title={
                            isDisabled
                              ? `${swatchLabel} ${k} — ${t.textureShadeDisabled}`
                              : `${swatchLabel} ${k} (${hex}) — ${t.clickToCustomize}`
                          }
                          onChange={(next) =>
                            setCustomTexHex((p) => {
                              // Start from an override of the RIGHT LENGTH; a stale
                              // one from a different step count would mis-index.
                              const prev = p[role];
                              const base =
                                prev && prev.length === effectiveShadeCount + 1
                                  ? [...prev]
                                  : new Array<string | undefined>(effectiveShadeCount + 1).fill(
                                      undefined,
                                    );
                              base[k] = next;
                              return { ...p, [role]: base };
                            })
                          }
                        />
                      );
                    })}
                  </div>
                  {!isWater && (
                    <>
                      <div className="slider-header" style={{ margin: '8px 0 4px' }}>
                        <span className="slider-name" style={{ fontSize: '11px' }}>
                          {t.textureShades}
                        </span>
                        <span className="slider-val">{shadeCount}</span>
                      </div>
                      <div className="type-tabs" style={{ marginBottom: '6px' }}>
                        {TEXTURE_SHADE_CHOICES.map((n) => (
                          <button
                            key={n}
                            className={`tab-btn ${shadeCount === n ? 'active' : ''}`}
                            onClick={() => setShadeCount(n)}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        },
      )}
    </section>
  );
}
