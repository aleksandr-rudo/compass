import { WebpackPluginInstance } from 'webpack';
import { merge } from 'webpack-merge';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error no types exist for this library
import DuplicatePackageCheckerPlugin from '@cerner/duplicate-package-checker-webpack-plugin';
import path from 'path';
import { builtinModules } from 'module';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { WebpackPluginStartElectron } from './webpack-plugin-start-electron';
import {
  ConfigArgs,
  isServe,
  WebpackConfig,
  webpackArgsWithDefaults,
  WebpackCLIArgs,
} from './args';
import {
  javascriptLoader,
  nodeLoader,
  sourceLoader,
  cssLoader,
  lessLoader,
  assetsLoader,
} from './loaders';
import {
  entriesToNamedEntries,
  toCommonJsExternal,
  entriesToHtml,
  camelCase,
} from './util';
import { sharedExternals } from './externals';
import { WebpackPluginMulticompilerProgress } from './webpack-plugin-multicompiler-progress';

export function createElectronMainConfig(
  args: Partial<ConfigArgs>
): WebpackConfig {
  const opts = webpackArgsWithDefaults(args, { target: 'electron-main' });
  const namedEntry = entriesToNamedEntries(opts.entry);

  const config = {
    entry: namedEntry,
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].[contenthash].main.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [javascriptLoader(opts), nodeLoader(opts), sourceLoader(opts)],
    },
    node: false as const,
    resolve: {
      // To avoid resolving the `browser` field
      aliasFields: [],
      extensions: ['.jsx', '.tsx', '.ts', '...'],
      // Prefer source to bundled code (so that compass plugins are processed
      // from source)
      mainFields: ['source', 'module', 'main'],
    },
    externals: toCommonJsExternal(sharedExternals),
  };

  return merge<WebpackConfig>(
    config,
    opts.mode === 'development'
      ? {
          output: {
            filename: opts.outputFilename ?? '[name].main.js',
            assetModuleFilename: 'assets/[name][ext]',
          },
        }
      : {},
    isServe(opts) ? { plugins: [new WebpackPluginStartElectron()] } : {},
    opts.analyze
      ? {
          plugins: [
            // Plugin types are not matching Webpack 5, but they work
            new BundleAnalyzerPlugin({
              logLevel: 'silent',
              analyzerPort: 'auto',
            }) as unknown as WebpackPluginInstance,

            new DuplicatePackageCheckerPlugin(),
          ],
        }
      : {},
    process.stdout.isTTY
      ? {
          plugins: [
            new WebpackPluginMulticompilerProgress({ activeModules: true }),
          ],
        }
      : {}
  );
}

export function createElectronRendererConfig(
  args: Partial<ConfigArgs>
): WebpackConfig {
  const opts = webpackArgsWithDefaults(args, { target: 'electron-renderer' });
  const entries = entriesToNamedEntries(opts.entry);

  const config = {
    entry: entries,
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].[contenthash].renderer.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
        javascriptLoader(opts),
        nodeLoader(opts),
        cssLoader(opts),
        lessLoader(opts),
        assetsLoader(opts),
        sourceLoader(opts),
      ],
    },
    plugins: [...entriesToHtml(entries)],
    node: false as const,
    externals: toCommonJsExternal(sharedExternals),
    resolve: {
      // To avoid resolving the `browser` field
      aliasFields: [],
      extensions: ['.jsx', '.tsx', '.ts', '...'],
      // Prefer source to bundled code (so that compass plugins are processed
      // from source)
      mainFields: ['source', 'module', 'main'],
    },
  };

  return merge<WebpackConfig>(
    config,
    opts.mode === 'development'
      ? {
          output: {
            filename: opts.outputFilename ?? '[name].renderer.js',
            assetModuleFilename: 'assets/[name][ext]',
          },
        }
      : {},
    isServe(opts)
      ? {
          devServer: {
            magicHtml: false,
            port: opts.devServerPort,
            devMiddleware: {
              // It's slower than in-memory fs, but required so that we can
              // start the electron app
              writeToDisk: true,
            },
            client: {
              overlay: {
                errors: true,
                warnings: false,
              },
            },
            https: false,
            hot: opts.hot,
          },
          plugins: [new WebpackPluginStartElectron()].concat(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            opts.hot
              ? [
                  // Plugin types are not matching Webpack 5, but they work
                  new ReactRefreshWebpackPlugin() as unknown as WebpackPluginInstance,
                ]
              : []
          ),
        }
      : {},
    opts.analyze
      ? {
          plugins: [
            // Plugin types are not matching Webpack 5, but they work
            new BundleAnalyzerPlugin({
              logLevel: 'silent',
              analyzerPort: 'auto',
            }) as unknown as WebpackPluginInstance,

            new DuplicatePackageCheckerPlugin(),
          ],
        }
      : {},
    process.stdout.isTTY
      ? {
          plugins: [
            new WebpackPluginMulticompilerProgress({ activeModules: true }),
          ],
        }
      : {}
  );
}

export function createWebConfig(args: Partial<ConfigArgs>): WebpackConfig {
  const opts = webpackArgsWithDefaults(args, { target: 'web' });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { name, productName, peerDependencies = {} } = require(path.join(
    opts.cwd,
    'package.json'
  ));

  const library = camelCase(productName || name);

  return {
    entry: entriesToNamedEntries(opts.entry),
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].js',
      assetModuleFilename: 'assets/[name][ext]',
      library,
      libraryTarget: 'umd',
      publicPath: './',
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
        javascriptLoader(opts),
        nodeLoader(opts),
        cssLoader(opts),
        lessLoader(opts),
        assetsLoader(opts),
        sourceLoader(opts),
      ],
    },
    // This follows current Compass plugin behavior and is here more or less to
    // keep compat for the external plugin users
    externals: {
      ...toCommonJsExternal(sharedExternals),
      ...toCommonJsExternal(Object.keys(peerDependencies)),
      ...toCommonJsExternal(builtinModules),
    },
    resolve: {
      extensions: ['.jsx', '.tsx', '.ts', '...'],
    },
  };
}

export function compassPluginConfig(
  _env: WebpackCLIArgs['env'],
  _args: Partial<WebpackCLIArgs>
): WebpackConfig[] {
  const args = webpackArgsWithDefaults(_args);
  const opts = { ...args, outputPath: path.join(args.cwd, 'lib'), hot: true };

  process.env.NODE_ENV = opts.nodeEnv;

  if (isServe(opts)) {
    return [
      createElectronMainConfig({
        ...opts,
        entry: path.join(opts.cwd, 'electron', 'index.js'),
      }),
      createElectronRendererConfig({
        ...opts,
        entry: path.join(opts.cwd, 'electron', 'renderer', 'index.js'),
      }),
    ];
  }

  return [
    createElectronRendererConfig({
      ...opts,
      entry: path.join(opts.cwd, 'src', 'index.js'),
      outputFilename: 'index.js',
    }),
    createWebConfig({
      ...opts,
      entry: path.join(opts.cwd, 'src', 'index.js'),
      outputFilename: 'browser.js',
    }),
  ];
}

export { webpack } from 'webpack';

export { merge } from 'webpack-merge';

export { webpackArgsWithDefaults } from './args';
