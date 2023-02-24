import { renderToPipeableStream } from '../../src/stream-node';
import { App } from './App';

export function render({ res, head }) {
	res.socket.on('error', (error) => {
		console.error('Fatal', error);
	});
	const { pipe, abort } = renderToPipeableStream(<App head={head} />, {
		onShellReady() {
			res.statusCode = 200;
			res.setHeader('Content-type', 'text/html');
			pipe(res);
		},
		onErrorShell(error) {
			res.statusCode = 500;
			res.send(
				`<!doctype html><p>An error ocurred:</p><pre>${error.message}</pre>`
			);
		}
	});

	// Abandon and switch to client rendering if enough time passes.
	// Try lowering this to see the client recover.
	setTimeout(abort, 10000);
}
