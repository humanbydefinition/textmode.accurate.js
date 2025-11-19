import { defineConfig } from 'vite';
import path from 'path';
import terser from '@rollup/plugin-terser';
import { createGLSLPlugin } from '../../vite-plugins/glsl-minify';

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        'textmode.accurate.js': path.resolve(__dirname, 'src/index.ts'),
      },
    },
    build: {
      minify: 'esbuild',
      emptyOutDir: true,
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'textmodeAccurate',
        fileName: (format) => `textmode-accurate.${format === 'es' ? 'esm' : format}.js`,
        formats: ['es', 'umd'],
      },
      rollupOptions: {
        external: ['textmode.js'],
        output: {
          globals: {
            'textmode.js': 'textmode',
          },
        },
        plugins: [
          terser({
            compress: {
              drop_debugger: true,
              ecma: 2020,
              toplevel: true,
              unsafe: true,
            },
            mangle: {
              toplevel: false,
              properties: {
                keep_quoted: true,
                regex: /^[_$]/,
              },
              reserved: ['t'],
            },
            format: {
              comments: false,
              ecma: 2020,
            },
            module: true,
          }) as any,
        ],
      },
    },
    plugins: [createGLSLPlugin(true)],
  };
});
