import type { TextmodePlugin, Shader, TextmodeConversionStrategy } from 'textmode.js';
import {
	registerConversionStrategy,
	unregisterConversionStrategy,
} from 'textmode.js';
import accurateFragmentShader from './shaders/image-to-mrt-accurate.frag?raw';

const strategyId = 'accurate';
let accurateShader: Shader | null = null;

const accurateStrategy: TextmodeConversionStrategy = {
	id: strategyId,

	createShader() {
		return accurateShader;
	},

	createUniforms({ source, font, gridWidth, gridHeight }) {
		const uniforms = source.createBaseConversionUniforms();
		Object.assign(uniforms, {
			u_characterTexture: font.fontFramebuffer,
			u_charsetDimensions: [font.textureColumns, font.textureRows],
			u_imageCellDimensions: [gridWidth, gridHeight],
			u_sampleGridSize: font.fontSize,
		});
		return uniforms;
	},
};

/**
 * Creates a textmode.js plugin that provides an accurate glyph matching conversion strategy.
 * @returns A textmode.js plugin instance.
 */
export const createAccurateConversionPlugin = (): TextmodePlugin => ({
	name: 'textmode.accurate',

	version: '1.0.0',

	/**
	 * Installs the accurate conversion strategy into textmode.js.
	 * @param textmodifier The textmodifier instance to install the plugin into.
	 */
	async install(textmodifier) {
		accurateShader = await textmodifier.createFilterShader(accurateFragmentShader);
		registerConversionStrategy(accurateStrategy);

	},

	/**
	 * Uninstalls the accurate conversion strategy from textmode.js.
	 */
	async uninstall() {
		unregisterConversionStrategy(strategyId);
		if (accurateShader) {
			accurateShader.dispose();
			accurateShader = null;
		}
	},
});

if (typeof window !== 'undefined') {
	(window as any).createAccurateConversionPlugin = createAccurateConversionPlugin;
}

export type { TextmodeConversionStrategy } from 'textmode.js';
