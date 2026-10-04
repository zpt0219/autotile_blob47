import { useEffect } from 'react';
import {
  TEXTURE_GROUPS,
  naturalGeoScale,
  naturalTextureAmount,
  type TextureId,
} from '../../core/patterns/patternTexture';
import type { RecipeEditor } from '../../app/state/useRecipeEditor';

export function TexturePickerModal({
  textureAlgoA,
  textureAlgoB,
  setTextureAlgoA,
  setTextureAlgoB,
  setTextureAmountA,
  setTextureAmountB,
  setGeoScaleA,
  setGeoScaleB,
  lang,
  t,
  openTexturePicker,
  setOpenTexturePicker,
}: Pick<
  RecipeEditor,
  | 'textureAlgoA'
  | 'textureAlgoB'
  | 'setTextureAlgoA'
  | 'setTextureAlgoB'
  | 'setTextureAmountA'
  | 'setTextureAmountB'
  | 'setGeoScaleA'
  | 'setGeoScaleB'
  | 'lang'
  | 't'
> & {
  openTexturePicker: 'terrainA' | 'terrainB';
  setOpenTexturePicker: (role: 'terrainA' | 'terrainB' | null) => void;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenTexturePicker(null);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [setOpenTexturePicker]);
  return (() => {
    const role = openTexturePicker;
    const currentAlgo = role === 'terrainA' ? textureAlgoA : textureAlgoB;
    const setAlgo = role === 'terrainA' ? setTextureAlgoA : setTextureAlgoB;
    const setGeoScale = role === 'terrainA' ? setGeoScaleA : setGeoScaleB;
    const setAmount = role === 'terrainA' ? setTextureAmountA : setTextureAmountB;

    const handleSelect = (nextId: TextureId) => {
      setAlgo(nextId);
      setGeoScale(naturalGeoScale(nextId));
      setAmount(naturalTextureAmount(nextId));
      setOpenTexturePicker(null);
    };

    const GROUP_ICONS: Record<string, string> = {
      无纹理: '🚫',
      None: '🚫',
      自然与有机: '🌿',
      'Nature & Organic': '🌿',
      程序与几何: '📐',
      'Procedural & Geometry': '📐',
      砖石与石板铺装: '🧱',
      'Masonry & Paving': '🧱',
      散点与半调噪声: '✨',
      'Speckle & Noise': '✨',
    };

    return (
      <>
        <div className="texture-picker-backdrop" onClick={() => setOpenTexturePicker(null)} />
        <div className="texture-picker-modal" role="dialog" aria-modal="true">
          <div className="texture-picker-header">
            <div className="texture-picker-title">
              <span className={`picker-role-badge picker-badge-${role}`}>
                {role === 'terrainA'
                  ? lang === 'zh'
                    ? '地形 A'
                    : 'Terrain A'
                  : lang === 'zh'
                    ? '地形 B'
                    : 'Terrain B'}
              </span>
              <h3>{t.selectTextureTitle}</h3>
            </div>
            <button
              className="picker-close-btn"
              onClick={() => setOpenTexturePicker(null)}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
          <div className="texture-picker-body">
            {TEXTURE_GROUPS.map((g) => {
              const groupName = lang === 'zh' ? g.zh : g.en;
              const icon = GROUP_ICONS[g.zh] || '🎨';
              return (
                <div key={g.en} className="texture-group-col">
                  <div className="group-col-header">
                    <span className="group-col-icon">{icon}</span>
                    <span className="group-col-title">{groupName}</span>
                    <span className="group-col-count">({g.items.length})</span>
                  </div>
                  <div className="group-col-items">
                    {g.items.map((p) => {
                      const isSelected = p.id === currentAlgo;
                      const itemName = lang === 'zh' ? p.zh : p.en;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`texture-item-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => handleSelect(p.id)}
                        >
                          <span className="item-name-text">{itemName}</span>
                          {isSelected && <span className="item-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  })();
}
