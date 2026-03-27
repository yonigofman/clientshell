import { Plugin } from 'vite';
import { ManifestOptions, SchemaShape } from '@clientshell/core';

interface ClientshellPluginOptions extends ManifestOptions {
    /** The schema shape to derive the manifest from. */
    schema: SchemaShape;
    /** Dev-mode stub values for local development. */
    devValues?: Record<string, unknown>;
}
/**
 * Vite plugin for clientshell.
 *
 * - **Build**: Writes `clientshell.manifest.json` into the build output.
 * - **Dev**: Serves a stub `env-config.js` from memory so local dev uses
 *   the same `window.__CLIENT_CONFIG__` contract.
 */
declare function clientshellPlugin(options: ClientshellPluginOptions): Plugin;

export { type ClientshellPluginOptions, clientshellPlugin };
