import { describe, expect, it, vi } from 'vitest';
import type { TextmodeConversionStrategy } from 'textmode.js';

import { AccurateConversionPlugin } from '../../../src';

function createTextmodifierHarness() {
	let registeredStrategy: TextmodeConversionStrategy | undefined;
	let createdShaderSource = '';
	const shader = { dispose: vi.fn() };
	const hooks = new Map<string, (() => unknown)[]>();

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

	const context = {
		on: vi.fn((hook: string, callback: () => unknown) => {
			const list = hooks.get(hook) ?? [];
			list.push(callback);
			hooks.set(hook, list);
			return () => {
				const index = list.indexOf(callback);
				if (index !== -1) list.splice(index, 1);
			};
		}),
	};

	const runPreSetup = async () => {
		for (const cb of hooks.get('preSetup') ?? []) {
			await cb();
		}
	};

	return {
		context,
		shader,
		textmodifier,
		runPreSetup,
		getRegisteredStrategy: () => registeredStrategy,
		getCreatedShaderSource: () => createdShaderSource,
	};
}

describe('AccurateConversionPlugin integration', () => {
	it('registers and unregisters the accurate conversion strategy', async () => {
		const harness = createTextmodifierHarness();

		const cleanup = AccurateConversionPlugin.install(harness.textmodifier as never, harness.context as never);

		const strategy = harness.getRegisteredStrategy();
		expect(harness.textmodifier.conversions.register).toHaveBeenCalledTimes(1);
		expect(strategy?.id).toBe('accurate');

		expect(() => strategy?.createShader({} as never)).toThrowError(/shader is not ready/);

		await harness.runPreSetup();
		expect(harness.textmodifier.createMaterialShader).toHaveBeenCalledTimes(1);

		const shader = strategy?.createShader({} as never);
		const shaderSource = harness.getCreatedShaderSource();

		expect(shader).toBe(harness.shader);
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

		cleanup?.();

		expect(harness.textmodifier.conversions.unregister).toHaveBeenCalledWith('accurate');
		expect(harness.shader.dispose).toHaveBeenCalledTimes(1);
	});

	it('adds accurate conversion uniforms on top of context base uniforms', () => {
		const harness = createTextmodifierHarness();

		AccurateConversionPlugin.install(harness.textmodifier as never, harness.context as never);

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

	it('preserves conversion-stack base uniforms for the active pass', () => {
		const harness = createTextmodifierHarness();

		AccurateConversionPlugin.install(harness.textmodifier as never, harness.context as never);

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
			u_brightnessStart: 0.25,
			u_brightnessEnd: 0.75,
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
			u_brightnessStart: 0.25,
			u_brightnessEnd: 0.75,
			u_accurateBrightnessStart: 0.25,
			u_accurateBrightnessEnd: 0.75,
		});
		expect(uniforms).toMatchObject(baseUniforms);
		expect(createBaseUniforms).toHaveBeenCalledTimes(1);
	});
});
