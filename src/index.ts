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

const BASE_UNIFORM_BEFORE_BRIGHTNESS = 'u_charRotation';
const BASE_UNIFORM_AFTER_BRIGHTNESS = 'u_charColorFixed';

function getAccurateBrightnessRange(baseUniforms: Record<string, unknown>): [number, number] {
	const brightnessStart = baseUniforms.u_brightnessStart;
	const brightnessEnd = baseUniforms.u_brightnessEnd;

	if (typeof brightnessStart === 'number' && typeof brightnessEnd === 'number') {
		return [brightnessStart, brightnessEnd];
	}

	// textmode.js 0.17's production build currently minifies these two keys even
	// though createBaseUniforms() exposes them as part of its public contract. Read
	// their stable position between rotation and color-mode uniforms without
	// depending on build-specific minified names such as "U6" and "U5".
	const entries = Object.entries(baseUniforms);
	const beforeIndex = entries.findIndex(([key]) => key === BASE_UNIFORM_BEFORE_BRIGHTNESS);
	const afterIndex = entries.findIndex(([key]) => key === BASE_UNIFORM_AFTER_BRIGHTNESS);
	const hiddenBrightnessValues = entries
		.slice(beforeIndex + 1, afterIndex)
		.map(([, value]) => value)
		.filter((value): value is number => typeof value === 'number');

	if (beforeIndex >= 0 && afterIndex > beforeIndex && hiddenBrightnessValues.length === 2) {
		return [hiddenBrightnessValues[0], hiddenBrightnessValues[1]];
	}

	return [0, 1];
}

function createAccurateUniforms(context: TextmodeConversionContext) {
	const { source, glyphAtlas } = context;
	const baseUniforms = context.createBaseUniforms();
	const [brightnessStart, brightnessEnd] = getAccurateBrightnessRange(baseUniforms);

	return {
		...baseUniforms,
		u_accurateBrightnessStart: brightnessStart,
		u_accurateBrightnessEnd: brightnessEnd,
		u_characterTexture: glyphAtlas.framebuffer,
		u_charsetDimensions: [glyphAtlas.columns, glyphAtlas.rows],
		u_imageCellDimensions: [source.width, source.height],
		u_sampleGridSize: Math.max(glyphAtlas.cellWidth, glyphAtlas.cellHeight),
	};
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
 */
export const AccurateConversionPlugin: TextmodePlugin = {
	name: packageJson.name,
	version: packageJson.version,

	async install(textmodifier, _context: TextmodePluginContext): Promise<void> {
		const shader = await textmodifier.createMaterialShader(accurateFragmentShader);
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
