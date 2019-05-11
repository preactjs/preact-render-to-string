import stream from 'stream';

export default function createReadableStream() {
	const readable = new stream.Readable();
	readable._read = () => {}; // see https://stackoverflow.com/a/22085851
	return readable;
}
