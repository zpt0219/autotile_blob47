import type { StudioPorts } from '../ports';
import { BrowserStorage } from './BrowserStorage';
import { browserExports } from '../browser/export';
import { SHARE_HASH } from '../../core/recipeCodec';

export function createBrowserPorts(): StudioPorts {
  return {
    storage: new BrowserStorage(),
    exports: browserExports,
    sharing: {
      getHash: () => window.location.hash,
      copyLink: async (payload) => {
        const url = new URL(window.location.href);
        url.hash = SHARE_HASH + payload;
        const text = url.toString();
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          throw new Error(text);
        }
        return text;
      },
    },
    prompt: (message, initial) => window.prompt(message, initial),
    confirm: (message) => window.confirm(message),
  };
}
