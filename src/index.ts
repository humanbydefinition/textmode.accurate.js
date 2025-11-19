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

export const createAccurateConversionPlugin = (): TextmodePlugin => ({
	name: 'textmode-accurate-conversion',
	version: '1.0.0',
	async install(textmodifier) {
		accurateShader = await textmodifier.createFilterShader(accurateFragmentShader);
		registerConversionStrategy(accurateStrategy);

	},
	async uninstall() {
		unregisterConversionStrategy(strategyId);
		if (accurateShader) {
			accurateShader.$dispose();
			accurateShader = null;
		}
	},
});

if (typeof window !== 'undefined') {
	(window as any).createTextmodeAccurateConversionPlugin = createAccurateConversionPlugin;
}

export type { TextmodeConversionStrategy } from 'textmode.js';
