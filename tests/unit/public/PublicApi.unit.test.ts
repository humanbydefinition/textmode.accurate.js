import { describe, expect, it } from 'vitest';
import packageJson from '../../../package.json';

import { AccurateConversionPlugin } from '../../../src';

describe('textmode.accurate.js public API unit', () => {
	it('exports the plugin with the expected name and version', () => {
		expect(AccurateConversionPlugin.name).toBe(packageJson.name);
		expect(AccurateConversionPlugin.version).toBe(packageJson.version);
	});

	it('exposes install and uninstall hooks on the plugin export', () => {
		expect(typeof AccurateConversionPlugin.install).toBe('function');
		expect(typeof AccurateConversionPlugin.uninstall).toBe('function');
	});

	it('registers the runtime package export on window for UMD consumers', () => {
		const umdGlobals = window as typeof window & Record<string, unknown>;

		expect(umdGlobals.AccurateConversionPlugin).toBe(AccurateConversionPlugin);
		expect(umdGlobals.createAccurateConversionPlugin).toBeUndefined();
	});
});
