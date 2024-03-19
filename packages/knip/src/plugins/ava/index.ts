import { getDependenciesFromScripts, hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import type { AvaConfig } from './types.js';

// https://github.com/avajs/ava/blob/main/docs/06-configuration.md

const title = 'Ava';

const enablers = ['ava'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['ava.config.{js,cjs,mjs}', 'package.json'];

const entry = [
  `test.{js,cjs,mjs,ts}`,
  `{src,source}/test.{js,cjs,mjs,ts}`,
  `**/__tests__/**/*.{js,cjs,mjs,ts}`,
  `**/*.spec.{js,cjs,mjs,ts}`,
  `**/*.test.{js,cjs,mjs,ts}`,
  `**/test-*.{js,cjs,mjs,ts}`,
  `**/test/**/*.{js,cjs,mjs,ts}`,
  `**/tests/**/*.{js,cjs,mjs,ts}`,
  '!**/__tests__/**/__{helper,fixture}?(s)__/**/*',
  '!**/test?(s)/**/{helper,fixture}?(s)/**/*',
];

const resolveEntryPaths: ResolveEntryPaths<AvaConfig> = localConfig => {
  if (typeof localConfig === 'function') localConfig = localConfig();
  return (localConfig?.files ?? []).map(toEntryPattern);
};

const resolveConfig: ResolveConfig<AvaConfig> = async (localConfig, options) => {
  if (typeof localConfig === 'function') localConfig = localConfig();

  const nodeArgs = localConfig.nodeArguments ?? [];
  const requireArgs = (localConfig.require ?? []).map(require => `--require ${require}`);
  const fakeCommand = `node ${nodeArgs.join(' ')} ${requireArgs.join(' ')}`;

  const dependencies = getDependenciesFromScripts([fakeCommand], { ...options, knownGlobalsOnly: true });

  return [...dependencies];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;
