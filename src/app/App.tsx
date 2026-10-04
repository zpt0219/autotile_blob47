import { useMemo, useState } from 'react';
import type { StudioPorts } from './ports';
import type { StudioBoot } from './services/startup';
import { useStudio } from './state/useStudio';
import { renderTileset } from '../core/renderMap';
import { PresetPanel } from '../panels/PresetPanel';
import { PalettePanel } from '../panels/PalettePanel';
import { BoundaryPanel } from '../panels/BoundaryPanel';
import { RibbonPanel } from '../panels/RibbonPanel';
import { NoisePanel } from '../panels/NoisePanel';
import { TexturePanel } from '../panels/TexturePanel';
import { TexturePickerModal } from '../panels/modals/TexturePickerModal';
import { RestoreModal } from '../panels/modals/RestoreModal';
import { TilesetPanel } from '../panels/canvas/TilesetPanel';
import { PlaygroundPanel } from '../panels/canvas/PlaygroundPanel';

export default function App({ ports, initial }: { ports: StudioPorts; initial: StudioBoot }) {
  const studio = useStudio(ports, initial),
    editor = studio.editor;
  const [picker, setPicker] = useState<'terrainA' | 'terrainB' | null>(null);
  const tiles = useMemo(() => renderTileset(editor.recipe), [editor.recipe]);
  const status = studio.pendingRecipe
    ? editor.lang === 'zh'
      ? '等待恢复选择'
      : 'Awaiting restore'
    : studio.saveStatus === 'error'
      ? editor.lang === 'zh'
        ? '自动保存失败，请导出配方'
        : 'Autosave failed; export your recipe'
      : studio.saveStatus === 'saved'
        ? editor.lang === 'zh'
          ? '已自动保存'
          : 'Autosaved'
        : '';
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <span
            className={`save-status ${studio.saveStatus === 'error' ? 'field-warn' : ''}`}
            role="status"
          >
            {status}
          </span>
        </div>
        <div className="app-title-group">
          <h1>{editor.t.title}</h1>
          <p>{editor.t.subtitle}</p>
        </div>
        <div className="header-right">
          <button className="btn-lang" onClick={studio.toggleLang}>
            {editor.t.langBtn}
          </button>
        </div>
      </header>
      <main className="main-grid">
        <aside className="sidebar sidebar-left">
          <PresetPanel {...studio} />
          <PalettePanel {...editor} />
          <BoundaryPanel {...editor} />
        </aside>
        <aside className="sidebar sidebar-right">
          <RibbonPanel {...editor} />
          <NoisePanel {...editor} />
          <TexturePanel {...editor} setOpenTexturePicker={setPicker} />
        </aside>
        <div className="content-area">
          <TilesetPanel studio={studio} tiles={tiles} />
          <PlaygroundPanel studio={studio} tiles={tiles} />
        </div>
      </main>
      {picker && (
        <TexturePickerModal
          {...editor}
          openTexturePicker={picker}
          setOpenTexturePicker={setPicker}
        />
      )}
      <RestoreModal {...studio} />
      {studio.toastMsg && (
        <div className="toast-popup" role="alert">
          {studio.toastMsg}
        </div>
      )}
    </div>
  );
}
