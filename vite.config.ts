import path from 'path';
import type { Options as TerserOptions } from '@rollup/plugin-terser';
import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';

const entry = path.resolve(__dirname, 'src/index.ts');
type TerserCompressOptions = Exclude<NonNullable<TerserOptions['compress']>, boolean>;

const sharedTerserCompress: TerserCompressOptions = {
	drop_debugger: true,
	ecma: 2020,
	global_defs: {
		IS_MINIFIED: true,
	},
};

const sharedTerserOptions: TerserOptions = {
	compress: sharedTerserCompress,
	mangle: {
		toplevel: false,
		properties: {
			keep_quoted: true,
			regex: /^_/,
		},
		reserved: ['TextmodeAccurate'],
	},
	format: {
		comments: false,
		ecma: 2020,
	},
};

function createTerserOptions(isESM: boolean): TerserOptions {
	return {
		...sharedTerserOptions,
		compress: {
			...sharedTerserCompress,
			toplevel: isESM,
			unsafe: isESM,
		},
		module: isESM,
	};
}

export default defineConfig({
	root: __dirname,
	resolve: {
		alias: {
			'textmode.accurate.js': entry,
		},
	},
	server: {
		open: '/examples/index.html',
	},
	build: {
		minify: 'esbuild',
		emptyOutDir: true,
		lib: {
			entry,
		},
		rollupOptions: {
			external: ['textmode.js'],
			output: [
				{
					format: 'es',
					entryFileNames: 'textmode.accurate.esm.js',
					plugins: [terser(createTerserOptions(true))],
				},
				{
					format: 'umd',
					name: 'TextmodeAccurate',
					entryFileNames: 'textmode.accurate.umd.js',
					globals: {
						'textmode.js': 'textmode',
					},
					plugins: [terser(createTerserOptions(false))],
				},
			],
			treeshake: {
				preset: 'recommended',
				moduleSideEffects: true,
			},
		},
	},
});
