import { run as apiKeyRun } from './apiKey';
import { run as claudeCliRun } from './claudeCli';
import { run as openclawRun } from './openclaw';

const adapters = {
  'api-key': apiKeyRun,
  'claude-cli': claudeCliRun,
  'openclaw': openclawRun,
};

export function getAdapter(adapterType) {
  const adapter = adapters[adapterType || 'api-key'];
  if (!adapter) {
    throw new Error(`Unknown adapter type: ${adapterType}`);
  }
  return adapter;
}
