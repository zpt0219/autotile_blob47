import type { Studio } from '../app/state/useStudio';
import { BUILTIN_PRESETS } from '../data/presets';

type Props = Pick<
  Studio,
  | 'editor'
  | 'selectedPresetId'
  | 'activePreset'
  | 'userPresets'
  | 'isDirty'
  | 'handleSelectPreset'
  | 'handleSaveAsPreset'
  | 'handleRenamePreset'
  | 'handleDeletePreset'
  | 'handleCopyShareLink'
>;
export function PresetPanel(p: Props) {
  const t = p.editor.t;
  return (
    <section className="panel-card">
      <h2 className="panel-title">{t.presetTitle}</h2>
      <select
        className="select-input"
        aria-label={t.presetSelect}
        value={p.isDirty ? 'custom' : p.selectedPresetId}
        onChange={(e) => p.handleSelectPreset(e.target.value)}
      >
        <optgroup label={t.presetBuiltinGroup}>
          {BUILTIN_PRESETS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </optgroup>
        {!!p.userPresets.length && (
          <optgroup label={t.presetUserGroup}>
            {p.userPresets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </optgroup>
        )}
        {p.isDirty && (
          <option value="custom" disabled>
            ● {t.presetDirtyMark}
          </option>
        )}
      </select>
      <div className="preset-actions">
        <button className="btn-action btn-secondary" onClick={p.handleSaveAsPreset}>
          {t.presetSaveAs}
        </button>
        <button
          className="btn-action btn-secondary"
          disabled={!p.activePreset || p.activePreset.isBuiltin}
          onClick={p.handleRenamePreset}
        >
          {t.presetRename}
        </button>
        <button
          className="btn-action btn-secondary"
          disabled={!p.activePreset || p.activePreset.isBuiltin}
          onClick={p.handleDeletePreset}
        >
          {t.presetDelete}
        </button>
      </div>
      <button className="btn-action" onClick={() => void p.handleCopyShareLink()}>
        {t.presetCopyLink}
      </button>
    </section>
  );
}
