import { DEFAULT_ROLE_COLOURS, toHexColour } from '../core/patterns/patternPaint';
import { InfoTip } from '../components/Controls';
import type { RecipeEditor } from '../app/state/useRecipeEditor';

export function PalettePanel({
  roleHex,
  transparentB,
  setRoleHex,
  setTransparentB,
  setCustomShadesHex,
  t,
}: Pick<
  RecipeEditor,
  'roleHex' | 'transparentB' | 'setRoleHex' | 'setTransparentB' | 'setCustomShadesHex' | 't'
>) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">{t.sectionTerrain}</h2>

      <div className="slider-header" style={{ marginBottom: '8px' }}>
        <span className="slider-name">{t.patternColours}</span>
      </div>
      {(
        [
          ['terrainA', t.colourTerrainA],
          ['terrainB', t.colourTerrainB],
          ['edge', t.colourEdge],
        ] as const
      ).map(([role, label]) => {
        // Terrain B's colour drives nothing once it is transparent: it owns
        // exactly two levels and both are discarded.
        const inert = role === 'terrainB' && transparentB;
        return (
          <div
            key={role}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              opacity: inert ? 0.4 : 1,
            }}
          >
            <input
              type="color"
              value={roleHex[role]}
              disabled={inert}
              onChange={(e) => setRoleHex((p) => ({ ...p, [role]: e.target.value }))}
              style={{
                width: '38px',
                height: '28px',
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: inert ? 'default' : 'pointer',
              }}
              aria-label={label}
            />
            <span style={{ fontSize: '12px', flex: 1 }}>{label}</span>
            <code style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {inert ? t.transparent : roleHex[role]}
            </code>
          </div>
        );
      })}

      <label className="checkbox-group" style={{ margin: '2px 0 4px' }}>
        <input
          type="checkbox"
          checked={transparentB}
          onChange={(e) => setTransparentB(e.target.checked)}
        />
        <span className="checkbox-label">
          {t.transparentB}
          <InfoTip text={t.transparentBHint} />
        </span>
      </label>

      <button
        className="btn-preset"
        style={{ marginTop: '12px', width: '100%' }}
        onClick={() => {
          setRoleHex({
            terrainA: toHexColour(DEFAULT_ROLE_COLOURS.terrainA),
            terrainB: toHexColour(DEFAULT_ROLE_COLOURS.terrainB),
            edge: toHexColour(DEFAULT_ROLE_COLOURS.edge),
          });
          setCustomShadesHex(null);
        }}
      >
        {t.resetColours}
      </button>
    </section>
  );
}
