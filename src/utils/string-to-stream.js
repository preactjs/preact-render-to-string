import createReadableStream from './create-readable-stream';

export default function stringToStream(str) {
	const readable = createReadableStream();
	readable.push(str);
	readable.push(null);
	return readable;
}
