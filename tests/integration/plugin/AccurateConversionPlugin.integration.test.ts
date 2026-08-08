import { describe, expect, it, vi } from 'vitest';
import type { TextmodeConversionStrategy } from 'textmode.js';

import { AccurateConversionPlugin } from '../../../src';

function createTextmodifierHarness() {
	let registeredStrategy: TextmodeConversionStrategy | undefined;
	let createdShaderSource = '';
	const shader = { dispose: vi.fn() };

	const textmodifier = {
		createMaterialShader: vi.fn(async (fragmentSource: string) => {
			createdShaderSource = fragmentSource;
			return shader;
		}),
		conversions: {
			register: vi.fn((strategy: TextmodeConversionStrategy) => {
				registeredStrategy = strategy;
			}),
			unregister: vi.fn(),
		},
	};

	return {
		shader,
		textmodifier,
		getRegisteredStrategy: () => registeredStrategy,
		getCreatedShaderSource: () => createdShaderSource,
	};
}

describe('AccurateConversionPlugin integration', () => {
	it('registers and unregisters the accurate conversion strategy', async () => {
		const harness = createTextmodifierHarness();

		await AccurateConversionPlugin.install(harness.textmodifier as never, {} as never);

		const strategy = harness.getRegisteredStrategy();
		const shaderSource = harness.getCreatedShaderSource();

		expect(harness.textmodifier.createMaterialShader).toHaveBeenCalledTimes(1);
		expect(shaderSource).toContain('u_sampleGridSize');
		expect(shaderSource).toContain('u_charPaletteTexture');
		expect(shaderSource).toContain('u_charPaletteDimensions');
		expect(shaderSource).toContain('in vec3 v_worldPosition');
		expect(shaderSource).toContain('tmApplyLighting');
		expect(shaderSource).not.toContain('u_colorFilterEnabled');
		expect(shaderSource).not.toContain('u_colorFilterPalette');
		expect(shaderSource).not.toContain('uniform float u_brightnessStart');
		expect(shaderSource).not.toContain('uniform float u_brightnessEnd');
		expect(shaderSource).toContain('uniform float u_accurateBrightnessStart');
		expect(shaderSource).toContain('uniform float u_accurateBrightnessEnd');
		expect(shaderSource).toContain(
			'avgBrightness < u_accurateBrightnessStart || avgBrightness > u_accurateBrightnessEnd'
		);
		expect(shaderSource.indexOf('avgBrightness < u_accurateBrightnessStart')).toBeGreaterThan(
			shaderSource.indexOf('float avgBrightness')
		);
		expect(shaderSource.indexOf('avgBrightness < u_accurateBrightnessStart')).toBeLessThan(
			shaderSource.indexOf('vec3 primaryAccum')
		);
		expect(shaderSource).toContain('texelFetch');
		expect(shaderSource).not.toContain('u_charList');
		expect(shaderSource).toContain('float splitMask[MAX_GRID_SAMPLES]');
		expect(shaderSource).toContain('layout(location = 3) out vec4 o_statePayload');
		expect(shaderSource).toContain('o_statePayload = vec4(0.0)');

		const candidateLoop = shaderSource.slice(shaderSource.indexOf('for (int charIdx'));
		expect(candidateLoop).not.toContain('texture(u_image');
		expect(harness.textmodifier.conversions.register).toHaveBeenCalledTimes(1);
		expect(strategy?.id).toBe('accurate');
		expect(strategy?.createShader({} as never)).toBe(harness.shader);

		await AccurateConversionPlugin.uninstall?.(harness.textmodifier as never, {} as never);

		expect(harness.textmodifier.conversions.unregister).toHaveBeenCalledWith('accurate');
	});

	it('adds accurate conversion uniforms on top of context base uniforms', async () => {
		const harness = createTextmodifierHarness();

		await AccurateConversionPlugin.install(harness.textmodifier as never, {} as never);

		const strategy = harness.getRegisteredStrategy();
		const baseUniforms = {
			u_image: 'image-texture',
			u_charCount: 512,
			u_charPaletteTexture: 'palette-texture',
			u_charPaletteDimensions: [23, 23],
			u_brightnessStart: 0.25,
			u_brightnessEnd: 0.75,
		};
		const source = {
			width: 80,
			height: 45,
		};
		const font = {
			framebuffer: 'font-framebuffer',
			columns: 16,
			rows: 16,
			cellWidth: 8,
			cellHeight: 10,
		};

		const createBaseUniforms = vi.fn(() => baseUniforms);
		const uniforms = strategy?.createUniforms({ source, glyphAtlas: font, createBaseUniforms } as never);

		expect(createBaseUniforms).toHaveBeenCalledTimes(1);
		expect(uniforms).toMatchObject({
			u_image: 'image-texture',
			u_charCount: 512,
			u_charPaletteTexture: 'palette-texture',
			u_charPaletteDimensions: [23, 23],
			u_brightnessStart: 0.25,
			u_brightnessEnd: 0.75,
			u_accurateBrightnessStart: 0.25,
			u_accurateBrightnessEnd: 0.75,
			u_characterTexture: 'font-framebuffer',
			u_charsetDimensions: [16, 16],
			u_imageCellDimensions: [80, 45],
			u_sampleGridSize: 10,
		});
	});

	it('preserves conversion-stack base uniforms for the active pass', async () => {
		const harness = createTextmodifierHarness();

		await AccurateConversionPlugin.install(harness.textmodifier as never, {} as never);

		const strategy = harness.getRegisteredStrategy();
		const source = {
			width: 80,
			height: 45,
		};
		const font = {
			framebuffer: 'font-framebuffer',
			columns: 16,
			rows: 16,
			cellWidth: 8,
			cellHeight: 10,
		};

		const baseUniforms = {
			u_image: 'stack-image-texture',
			u_invert: false,
			u_flipX: false,
			u_flipY: false,
			u_charRotation: 0,
			U6: 0.25,
			U5: 0.75,
			u_charColorFixed: false,
			u_charCount: 4,
			u_charPaletteTexture: 'pass-palette-texture',
			u_charPaletteDimensions: [2, 2],
		};
		const createBaseUniforms = vi.fn(() => baseUniforms);
		const pass = { index: 1, count: 2, mode: 'accurate', options: { threshold: 0.12 } };

		const uniforms = strategy?.createUniforms({ source, glyphAtlas: font, createBaseUniforms, pass } as never);

		expect(uniforms).toMatchObject({
			u_image: 'stack-image-texture',
			u_charPaletteTexture: 'pass-palette-texture',
			u_charPaletteDimensions: [2, 2],
			U6: 0.25,
			U5: 0.75,
			u_accurateBrightnessStart: 0.25,
			u_accurateBrightnessEnd: 0.75,
		});
		expect(uniforms).toMatchObject(baseUniforms);
		expect(createBaseUniforms).toHaveBeenCalledTimes(1);
	});
});
