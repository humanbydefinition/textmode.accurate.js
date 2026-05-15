import { describe, expect, it, vi } from 'vitest';
import type { TextmodeConversionStrategy } from 'textmode.js';

import { AccurateConversionPlugin } from '../../../src';

function createTextmodifierHarness() {
	let registeredStrategy: TextmodeConversionStrategy | undefined;
	let createdShaderSource = '';
	const shader = { dispose: vi.fn() };

	const textmodifier = {
		createFilterShader: vi.fn(async (source: string) => {
			createdShaderSource = source;
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

		expect(shaderSource).toContain('u_sampleGridSize');
		expect(shaderSource).toContain('u_charPaletteTexture');
		expect(shaderSource).toContain('u_charPaletteDimensions');
		expect(shaderSource).toContain('texelFetch');
		expect(shaderSource).not.toContain('u_charList');
		expect(harness.textmodifier.conversions.register).toHaveBeenCalledTimes(1);
		expect(strategy?.id).toBe('accurate');
		expect(strategy?.createShader({} as never)).toBe(harness.shader);

		await AccurateConversionPlugin.uninstall?.(harness.textmodifier as never, {} as never);

		expect(harness.textmodifier.conversions.unregister).toHaveBeenCalledWith('accurate');
	});

	it('adds accurate conversion uniforms on top of source base uniforms', async () => {
		const harness = createTextmodifierHarness();

		await AccurateConversionPlugin.install(harness.textmodifier as never, {} as never);

		const strategy = harness.getRegisteredStrategy();
		const baseUniforms = {
			u_image: 'image-texture',
			u_charCount: 512,
			u_charPaletteTexture: 'palette-texture',
			u_charPaletteDimensions: [23, 23],
		};
		const source = {
			width: 80,
			height: 45,
			createBaseConversionUniforms: vi.fn(() => baseUniforms),
		};
		const font = {
			framebuffer: 'font-framebuffer',
			columns: 16,
			rows: 16,
			cellWidth: 8,
			cellHeight: 10,
		};

		const uniforms = strategy?.createUniforms({ source, glyphAtlas: font } as never);

		expect(source.createBaseConversionUniforms).toHaveBeenCalledTimes(1);
		expect(uniforms).toMatchObject({
			u_image: 'image-texture',
			u_charCount: 512,
			u_charPaletteTexture: 'palette-texture',
			u_charPaletteDimensions: [23, 23],
			u_characterTexture: 'font-framebuffer',
			u_charsetDimensions: [16, 16],
			u_imageCellDimensions: [80, 45],
			u_sampleGridSize: 10,
		});
	});
});
