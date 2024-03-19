import { join, relative } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import type { StorybookConfig } from './types.js';

// https://storybook.js.org/docs/react/configure/overview

const title = 'Storybook';

const enablers = [/^@storybook\//, '@nrwl/storybook'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.storybook/{main,test-runner}.{js,ts}'];

const stories = ['**/*.@(mdx|stories.@(mdx|js|jsx|mjs|ts|tsx))'];

const restEntry = ['.storybook/{manager,preview}.{js,jsx,ts,tsx}'];

const entry = [...restEntry, ...stories];

const project = ['.storybook/**/*.{js,jsx,ts,tsx}'];

const resolveEntryPaths: ResolveEntryPaths<StorybookConfig> = async (localConfig, options) => {
  const { cwd, configFileDir } = options;
  const strs = typeof localConfig?.stories === 'function' ? await localConfig.stories(stories) : localConfig?.stories;
  const relativePatterns = strs?.map(pattern => {
    if (typeof pattern === 'string') return relative(cwd, join(configFileDir, pattern));
    return relative(cwd, join(configFileDir, pattern.directory, pattern.files ?? stories[0]));
  });
  const patterns = [...restEntry, ...(relativePatterns && relativePatterns.length > 0 ? relativePatterns : stories)];
  return patterns.map(toEntryPattern);
};

const resolveConfig: ResolveConfig<StorybookConfig> = async localConfig => {
  const addons = localConfig.addons?.map(addon => (typeof addon === 'string' ? addon : addon.name)) ?? [];
  const builder = localConfig?.core?.builder;
  const builderPackages =
    builder && /webpack/.test(builder) ? [`@storybook/builder-${builder}`, `@storybook/manager-${builder}`] : [];
  const frameworks = localConfig.framework?.name ? [localConfig.framework.name] : [];
  return [...addons, ...builderPackages, ...frameworks];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  project,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;
