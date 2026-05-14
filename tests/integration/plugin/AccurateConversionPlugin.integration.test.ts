import { describe, expect, it, vi } from 'vitest';
import type { TextmodeConversionStrategy } from 'textmode.js/conversion';

import { AccurateConversionPlugin } from '../../../src';

function createTextmodifierHarness() {
	let registeredStrategy: TextmodeConversionStrategy | undefined;
	const shader = { dispose: vi.fn() };

	const textmodifier = {
		createFilterShader: vi.fn(async () => shader),
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
	};
}

describe('AccurateConversionPlugin integration', () => {
	it('registers and unregisters the accurate conversion strategy', async () => {
		const harness = createTextmodifierHarness();

		await AccurateConversionPlugin.install(harness.textmodifier as never, {} as never);

		const strategy = harness.getRegisteredStrategy();
		expect(harness.textmodifier.createFilterShader).toHaveBeenCalledWith(
			expect.stringContaining('u_sampleGridSize')
		);
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
		const baseUniforms = { u_image: 'image-texture' };
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
			u_characterTexture: 'font-framebuffer',
			u_charsetDimensions: [16, 16],
			u_imageCellDimensions: [80, 45],
			u_sampleGridSize: 10,
		});
	});
});
