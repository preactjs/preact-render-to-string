import stringToStream from './string-to-stream';

export default function mergeStreamsOrStrings(streams) {
	const len = streams.length;
	if (len === 0) {
		throw new Error('Passed empty array to mergeStreamsOrStrings');
	}

	if (len === 1) {
		if (typeof streams[0] === 'string') {
			return stringToStream(streams[0]);
		}

		return streams[0];
	}

	const { PassThrough } = require('stream');

	const pass = new PassThrough();
	let i = 0;
	const end = () => {
		if (++i === len) {
			pass.end();
		}
		else {
			doPipe();
		}
	};
	
	const doPipe = () => {
		let stream = streams[i];
		if (typeof stream === 'string') {
			pass.push(stream);
			end();
		}
		else {
			stream.pipe(pass, { end: false });
			stream.once('end', end);
			stream.once('error', (e) => {
				// TODO: handle this
				pass.emit('error', e);
			});
		}
	};

	doPipe();

	return pass;
}
