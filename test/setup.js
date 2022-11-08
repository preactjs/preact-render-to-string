/*global globalThis*/
import chai from 'chai';
import sinonChai from 'sinon-chai';
import {
	ReadableStream,
	WritableStream,
	CountQueuingStrategy
} from 'node:stream/web';

globalThis.ReadableStream = ReadableStream;
globalThis.WritableStream = WritableStream;
globalThis.CountQueuingStrategy = CountQueuingStrategy;

chai.use(sinonChai);
