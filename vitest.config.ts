import { defineConfig } from 'vitest/config';

export default defineConfig({
	esbuild: {
		jsx: 'transform',
		jsxFactory: 'h',
		jsxFragment: 'Fragment',
		jsxDev: false
	},
	test: {}
});
