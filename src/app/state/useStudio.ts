import { useEffect, useMemo, useRef, useState } from 'react';
import type { StudioPorts } from '../ports';
import type { StudioBoot } from '../services/startup';
import { PREFERENCES_KEY } from '../services/startup';
import { AutosaveService } from '../services/AutosaveService';
import { ExportService } from '../services/ExportService';
import { savePresets } from '../services/PresetService';
import { BUILTIN_PRESETS } from '../../data/presets';
import { encodeRecipe, parseRecipeFile, recipesEqual } from '../../core/recipeCodec';
import { sanitizeRecipe } from '../../model/recipe';
import type { PresetItem } from '../../model/preset';
import { useRecipeEditor } from './useRecipeEditor';

export function useStudio(ports: StudioPorts, initial: StudioBoot) {
  const [preferences, setPreferences] = useState(initial.preferences);
  const editor = useRecipeEditor(initial.recipe, preferences.lang);
  const [userPresets, setUserPresets] = useState(initial.presets);
  const [selectedPresetId, setSelectedPresetId] = useState(initial.selectedPresetId);
  const [pendingRecipe, setPendingRecipe] = useState(initial.pendingRecipe);
  const [toastMsg, setToastMsg] = useState<string | null>(initial.error);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importId = useRef(0);
  const mounted = useRef(false);
  const exportBusy = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const notify = (message: string) => {
    if (!mounted.current) return;
    if (timer.current) clearTimeout(timer.current);
    setToastMsg(message);
    timer.current = setTimeout(() => setToastMsg(null), 5000);
  };
  useEffect(() => {
    if (pendingRecipe) return;
    const save = new AutosaveService(ports.storage);
    save.schedule(editor.recipe, (result) => {
      setSaveStatus(result.success ? 'saved' : 'error');
    });
    const flush = () => save.flush();
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      save.cancel();
    };
  }, [editor.recipe, pendingRecipe, ports.storage]);
  // Preference writes are also debounced so restricted storage is visibly reported.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        ports.storage.setItem(
          PREFERENCES_KEY,
          JSON.stringify({ format: 'autotile-blob47-preferences', version: 1, preferences }),
        );
      } catch {
        setSaveStatus('error');
      }
    }, 300);
    return () => clearTimeout(id);
  }, [preferences, ports.storage]);
  const allPresets = useMemo(() => [...BUILTIN_PRESETS, ...userPresets], [userPresets]);
  const activePreset = allPresets.find((p) => p.id === selectedPresetId);
  const replace = (recipe: typeof editor.recipe) => {
    editor.replaceRecipe(recipe);
  };
  const writePresets = (next: PresetItem[]) => {
    setUserPresets(next);
    const result = savePresets(ports.storage, next);
    if (!result.success) notify('保存失败 / Save failed: ' + result.error);
  };
  const exportService = useMemo(() => new ExportService(ports.exports), [ports.exports]);
  return {
    editor,
    preferences,
    setPreferences,
    toastMsg,
    saveStatus,
    busy,
    pendingRecipe,
    userPresets,
    activePreset,
    selectedPresetId,
    isDirty: !activePreset || !recipesEqual(editor.recipe, activePreset.recipe),
    toggleLang: () => setPreferences((p) => ({ ...p, lang: p.lang === 'zh' ? 'en' : 'zh' })),
    handleSelectPreset: (id: string) => {
      const target = allPresets.find((p) => p.id === id);
      if (!target) return;
      setSelectedPresetId(id);
      replace(target.recipe);
    },
    handleSaveAsPreset: () => {
      const name = ports.prompt(
        editor.t.presetSavePrompt,
        preferences.lang === 'zh' ? '我的预设' : 'My preset',
      );
      if (!name?.trim()) return;
      const id = 'user_' + crypto.randomUUID();
      writePresets([
        ...userPresets,
        {
          id,
          name: name.trim(),
          recipe: sanitizeRecipe(editor.recipe),
          savedAt: new Date().toISOString(),
        },
      ]);
      setSelectedPresetId(id);
    },
    handleRenamePreset: () => {
      if (!activePreset || activePreset.isBuiltin) return;
      const name = ports.prompt(editor.t.presetRenamePrompt, activePreset.name);
      if (!name?.trim()) return;
      writePresets(
        userPresets.map((p) => (p.id === activePreset.id ? { ...p, name: name.trim() } : p)),
      );
    },
    handleDeletePreset: () => {
      if (
        !activePreset ||
        activePreset.isBuiltin ||
        !ports.confirm(editor.t.presetDeleteConfirm.replace('{name}', activePreset.name))
      )
        return;
      writePresets(userPresets.filter((p) => p.id !== activePreset.id));
      setSelectedPresetId(BUILTIN_PRESETS[0].id);
      replace(BUILTIN_PRESETS[0].recipe);
    },
    handleCopyShareLink: async () => {
      try {
        await ports.sharing.copyLink(encodeRecipe(editor.recipe));
        notify(editor.t.presetLinkCopied);
      } catch (e) {
        notify(e instanceof Error ? e.message : String(e));
      }
    },
    downloadRecipe: () => {
      try {
        exportService.exportRecipe(editor.recipe);
      } catch (e) {
        notify(String(e));
      }
    },
    importRecipe: async (file: File) => {
      const id = ++importId.current,
        documentGeneration = editor.getRevision();
      try {
        const recipe = parseRecipeFile(await file.text());
        if (
          !mounted.current ||
          id !== importId.current ||
          documentGeneration !== editor.getRevision()
        )
          return;
        replace(recipe);
        setSelectedPresetId('custom');
        notify(editor.t.recipeImported);
      } catch (e) {
        if (mounted.current && id === importId.current)
          notify(editor.t.recipeImportFailed + ': ' + String(e));
      }
    },
    downloadTilesetBundle: async () => {
      if (exportBusy.current) return;
      exportBusy.current = true;
      setBusy(true);
      try {
        await exportService.exportTileset(editor.recipe);
      } catch (e) {
        notify('导出失败 / Export failed: ' + String(e));
      } finally {
        exportBusy.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    dismissRestore: () => setPendingRecipe(null),
    restore: () => {
      if (!pendingRecipe) return;
      replace(pendingRecipe);
      setSelectedPresetId('custom');
      setPendingRecipe(null);
    },
  };
}
export type Studio = ReturnType<typeof useStudio>;
