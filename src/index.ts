/**
 * `textmode.accurate.js` package entrypoint.
 *
 * @packageDocumentation
 */

import type { TextmodeConversionContext, TextmodeConversionStrategy, TextmodeShader } from 'textmode.js';
import type { TextmodePlugin, TextmodePluginContext, Textmodifier } from 'textmode.js';
import packageJson from '../package.json';

import accurateFragmentShader from './shaders/image-to-mrt-accurate.frag?raw';

const ACCURATE_CONVERSION_MODE = 'accurate';

function createAccurateUniforms(context: TextmodeConversionContext) {
	const { source, glyphAtlas } = context;
	const baseUniforms = context.createBaseUniforms();

	return {
		...baseUniforms,
		u_accurateBrightnessStart: (baseUniforms.u_brightnessStart as number | undefined) ?? 0,
		u_accurateBrightnessEnd: (baseUniforms.u_brightnessEnd as number | undefined) ?? 1,
		u_characterTexture: glyphAtlas.framebuffer,
		u_charsetDimensions: [glyphAtlas.columns, glyphAtlas.rows],
		u_imageCellDimensions: [source.width, source.height],
		u_sampleGridSize: Math.max(glyphAtlas.cellWidth, glyphAtlas.cellHeight),
	};
}

function createAccurateStrategy(getShader: () => TextmodeShader): TextmodeConversionStrategy {
	return {
		id: ACCURATE_CONVERSION_MODE,

		createShader() {
			return getShader();
		},

		createUniforms: createAccurateUniforms,
	};
}

/**
 * The `textmode.accurate.js` plugin to install.
 *
 * Install this plugin to enable the `accurate` conversion mode for image and
 * video sources rendered with `image()`.
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
 *
 * @see {@link https://code.textmode.art/api/textmode.accurate.js/variables/AccurateConversionPlugin | AccurateConversionPlugin API reference}
 */
export const AccurateConversionPlugin: TextmodePlugin = {
	name: packageJson.name,

	install(textmodifier: Textmodifier, context: TextmodePluginContext): () => void {
		let shader: TextmodeShader | null = null;
		let isDisposed = false;

		context.on('preSetup', async () => {
			if (shader || isDisposed) return;
			const compiled = await textmodifier.createMaterialShader(accurateFragmentShader);
			if (isDisposed) {
				compiled.dispose();
			} else {
				shader = compiled;
			}
		});

		textmodifier.conversions.register(
			createAccurateStrategy(() => {
				if (!shader) {
					throw new Error(
						'[textmode.accurate.js] Accurate conversion shader is not ready. Make sure setup has completed.'
					);
				}
				return shader;
			})
		);

		return () => {
			isDisposed = true;
			textmodifier.conversions.unregister(ACCURATE_CONVERSION_MODE);
			if (shader) {
				shader.dispose();
				shader = null;
			}
		};
	},
};

if (typeof window !== 'undefined') {
	(window as typeof window & Record<string, unknown>).AccurateConversionPlugin = AccurateConversionPlugin;
}
