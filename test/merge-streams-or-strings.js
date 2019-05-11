import mergeStreamsOrStrings from '../src/utils/merge-streams-or-strings';
import stringToStream from '../src/utils/string-to-stream';

import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

function expectStream(stream, expected) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		stream.on('data', (c) => { chunks.push(c); });
		stream.on('end', () => {
			expect(Buffer.concat(chunks).toString('utf8')).to.equal(expected);
			resolve();
		});
		stream.on('error', reject);
	});
}

describe('mergeStreamsOrStrings', () => {
	it('should merge an array of strings', () => {
		const stream = mergeStreamsOrStrings(['foo','bar','baz']);

		return expectStream(stream, 'foobarbaz');
	});

	it('should merge an array of Streams', () => {
		const stream = mergeStreamsOrStrings(['foo','bar','baz'].map(stringToStream));

		return expectStream(stream, 'foobarbaz');
	});

	it('should merge a mixed array of streams and strings', () => {
		const stream = mergeStreamsOrStrings(['foo','bar',stringToStream('stream#foo'),stringToStream('stream#bar'),'baz',stringToStream('stream#baz')]);

		return expectStream(stream, ['foo','bar','stream#foo','stream#bar','baz','stream#baz'].join(''));
	});
});
