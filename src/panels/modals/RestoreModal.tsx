import type { Studio } from '../../app/state/useStudio';
import { RecipePreviewCanvas } from '../canvas/RecipePreviewCanvas';

export function RestoreModal({
  pendingRecipe,
  editor,
  restore,
  dismissRestore,
}: Pick<Studio, 'pendingRecipe' | 'editor' | 'restore' | 'dismissRestore'>) {
  if (!pendingRecipe) return null;
  const t = editor.t;
  return (
    <>
      <div className="texture-picker-backdrop" />
      <div
        className="restore-session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-title"
      >
        <div className="restore-modal-header">
          <h3 id="restore-title">{t.restoreTitle}</h3>
        </div>
        <div className="restore-modal-body">
          <RecipePreviewCanvas recipe={pendingRecipe} />
          <p className="restore-desc">{t.restoreDesc}</p>
        </div>
        <div className="restore-modal-footer">
          <button className="btn-action btn-secondary" onClick={dismissRestore}>
            {t.startFreshBtn}
          </button>
          <button className="btn-action" onClick={restore}>
            {t.restoreBtn}
          </button>
        </div>
      </div>
    </>
  );
}
