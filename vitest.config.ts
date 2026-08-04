import path from 'path';

import { defineTextmodeProject } from '@textmode/vitest-config';

export default defineTextmodeProject({
	projects: [
		{
			test: {
				name: 'unit',
				include: ['tests/unit/**/*.test.ts'],
			},
		},
		{
			test: {
				name: 'integration',
				include: ['tests/integration/**/*.test.ts'],
			},
		},
	],
	alias: {
		'textmode.accurate.js': path.resolve(__dirname, 'src/index.ts'),
	},
});
