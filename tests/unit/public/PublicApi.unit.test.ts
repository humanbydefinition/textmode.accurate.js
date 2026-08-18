import { describe, expect, it } from 'vitest';
import packageJson from '../../../package.json';

import { AccurateConversionPlugin } from '../../../src';

describe('textmode.accurate.js public API unit', () => {
	it('exports the plugin with the expected name', () => {
		expect(AccurateConversionPlugin.name).toBe(packageJson.name);
	});

	it('exposes install and a returned cleanup function on the plugin export', () => {
		const textmodifier = {
			conversions: {
				register: () => {},
				unregister: () => {},
			},
		};
		const context = { on: () => () => {} } as never;

		const cleanup = AccurateConversionPlugin.install(textmodifier as never, context) as unknown as () => void;
		expect(cleanup).toBeTypeOf('function');
		expect(() => cleanup()).not.toThrow();
	});

	it('registers the runtime package export on window for UMD consumers', () => {
		const umdGlobals = window as typeof window & Record<string, unknown>;

		expect(umdGlobals.AccurateConversionPlugin).toBe(AccurateConversionPlugin);
		expect(umdGlobals.createAccurateConversionPlugin).toBeUndefined();
	});
});
