/**
 * `textmode.accurate.js` package entrypoint.
 *
 * @packageDocumentation
 */

import type { TextmodeShader } from 'textmode.js';
import type { TextmodeConversionContext, TextmodeConversionStrategy } from 'textmode.js';
import type { TextmodePlugin, TextmodePluginContext } from 'textmode.js';
import packageJson from '../package.json';

import accurateFragmentShader from './shaders/image-to-mrt-accurate.frag?raw';

const ACCURATE_CONVERSION_MODE = 'accurate';

type ConversionUniforms = ReturnType<TextmodeConversionStrategy['createUniforms']>;
type BaseConversionSource = TextmodeConversionContext['source'] & {
	createBaseConversionUniforms(): ConversionUniforms;
};

function createAccurateUniforms(context: TextmodeConversionContext) {
	const { source, glyphAtlas } = context;
	const uniforms = (source as BaseConversionSource).createBaseConversionUniforms();

	Object.assign(uniforms, {
		u_characterTexture: glyphAtlas.framebuffer,
		u_charsetDimensions: [glyphAtlas.columns, glyphAtlas.rows],
		u_imageCellDimensions: [source.width, source.height],
		u_sampleGridSize: Math.max(glyphAtlas.cellWidth, glyphAtlas.cellHeight),
	});

	return uniforms;
}

function createAccurateStrategy(shader: TextmodeShader): TextmodeConversionStrategy {
	return {
		id: ACCURATE_CONVERSION_MODE,

		createShader() {
			return shader;
		},

		createUniforms: createAccurateUniforms,
	};
}

/**
 * The `textmode.accurate.js` plugin to install.
 *
 * Install this plugin to enable the `accurate` conversion mode on image,
 * video, and texture sources.
 *
 * @example
 * ```javascript
 * import { textmode } from 'textmode.js';
 * import { AccurateConversionPlugin } from 'textmode.accurate.js';
 *
 * const t = textmode.create({
 *   width: 800,
 *   height: 600,
 *   plugins: [AccurateConversionPlugin],
 * });
 *
 * t.setup(async () => {
 *   const image = await t.loadImage('photo.jpg');
 *   image.conversionMode('accurate');
 * });
 * ```
 */
export const AccurateConversionPlugin: TextmodePlugin = {
	name: packageJson.name,
	version: packageJson.version,

	async install(textmodifier, _context: TextmodePluginContext): Promise<void> {
		const shader = await textmodifier.createFilterShader(accurateFragmentShader);
		textmodifier.conversions.register(createAccurateStrategy(shader));
	},

	uninstall(textmodifier, _context: TextmodePluginContext): void {
		textmodifier.conversions.unregister(ACCURATE_CONVERSION_MODE);
	},
};

export type { TextmodeConversionStrategy } from 'textmode.js';

if (typeof window !== 'undefined') {
	(window as typeof window & Record<string, unknown>).AccurateConversionPlugin = AccurateConversionPlugin;
}
