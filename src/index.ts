import { TextmodeShader } from 'textmode.js';
import accurateFragmentShader from './shaders/image-to-mrt-accurate.frag?raw';
import { TextmodeConversionStrategy } from 'textmode.js/conversion';
import { TextmodePlugin } from 'textmode.js/plugins';

const strategyId = 'accurate';
let accurateShader: TextmodeShader | null = null;
let textmodifierInstance: any = null;

const accurateStrategy: TextmodeConversionStrategy = {
	id: strategyId,

	createShader() {
		return accurateShader;
	},

	createUniforms(context) {
		const { source, font } = context;
		const uniforms = source.createBaseConversionUniforms();
		Object.assign(uniforms, {
			u_characterTexture: font.fontFramebuffer,
			u_charsetDimensions: [font.textureColumns, font.textureRows],
			u_imageCellDimensions: [source.width, source.height],
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
		textmodifierInstance = textmodifier;
		accurateShader = await textmodifier.createFilterShader(accurateFragmentShader);
		textmodifier.conversions.register(accurateStrategy);
	},

	/**
	 * Uninstalls the accurate conversion strategy from textmode.js.
	 */
	async uninstall() {
		if (textmodifierInstance) {
			// ConversionManager handles shader disposal internally
			textmodifierInstance.conversions.unregister(strategyId);
			textmodifierInstance = null;
		}
		accurateShader = null;
	},
});

if (typeof window !== 'undefined') {
	(window as any).createAccurateConversionPlugin = createAccurateConversionPlugin;
}

export type { TextmodeConversionStrategy } from 'textmode.js/conversion';
