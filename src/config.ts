import { homedir } from 'node:os';
import { join } from 'node:path';

/** Where the Trood services live. Each can be overridden for local work or a stub. */
export const config = {
  identityUrl: process.env.TROOD_IDENTITY_URL ?? 'https://identity.trood.com',
  engineUrl: process.env.TROOD_ENGINE_URL ?? 'https://trood-productengine-back-test.up.railway.app',
  treeUrl: process.env.TROOD_TREE_URL ?? 'https://trood-tree-back-test.up.railway.app',
  sessionFile: process.env.TROOD_SESSION_FILE ?? join(homedir(), '.trood', 'mcp-session.json'),
  timeoutMs: 15000,
};
