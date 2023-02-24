import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import { promises as fs } from 'fs';

function ssrPlugin() {
	return {
		name: 'ssrPlugin',

		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				if (req.url !== '/') {
					return next();
				}

				const { render } = await server.ssrLoadModule(
					path.resolve(__dirname, './src/entry-server')
				);

				const indexHtml = await fs.readFile(
					path.resolve(__dirname, './index.html'),
					'utf-8'
				);

				const url = new URL('http://localhost:5173/' + req.url);
				const template = await server.transformIndexHtml(
					url.toString(),
					indexHtml
				);

				/**
				 * Scrape out `head` contents injected by Vite. This is used for React runtime and fast refresh.
				 * It will be injected into the `<Html>` React component shell in the server entrypoint.
				 */
				const head = template.match(/<head>(.+?)<\/head>/s)[1];

				return render({ res, head });
			});
		}
	};
}

export default defineConfig({
	// @ts-ignore
	ssr: {
		noExternal: /./
	},
	build: {
		ssrManifest: true
	},
	resolve: {
		alias: {
			preact: path.resolve(__dirname, './node_modules/preact'),
			'preact/compat': path.resolve(__dirname, './node_modules/preact/compat'),
			'preact/hooks': path.resolve(__dirname, './node_modules/preact/hooks')
		}
	},
	plugins: [ssrPlugin(), preact()]
});
