/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global globalThis*/

export function benchmark(name, executor, iterations = 10, timeLimit = 5000) {
	let count = 0;
	let now = performance.now(),
		start = now,
		prev = now;
	const times = [];
	do {
		for (let i = iterations; i--; ) executor(++count);
		prev = now;
		now = performance.now();
		times.push((now - prev) / iterations);
	} while (now - start < timeLimit);
	const elapsed = now - start;
	const hz = ((count / elapsed) * 1000) | 0;
	const average = toFixed(elapsed / count);
	const middle = (times.length / 2) | 0;
	const median = toFixed((times[middle] + times[middle + 1]) / 2);
	const hzStr = hz.toLocaleString();
	const averageStr = average.toLocaleString();
	const n = times.length;
	const stdev = times.reduce((c, t) => c + (t - average) ** 2, 0) / n;
	const p95 = toFixed((1.96 * stdev) / Math.sqrt(n));
	console.log(
		`\x1b[36m${name}:\x1b[0m ${hzStr}/s, average: ${averageStr}ms, median: ${median}ms, ±${p95}`
	);
	return { elapsed, hz, average, median };
}
globalThis.benchmark = benchmark;
const toFixed = (v) => ((v * 100) | 0) / 100;

const queue = [];
let stack = [];
let index = 0;

async function process() {
	const id = index++;
	if (id === queue.length) {
		queue.length = index = 0;
		return;
	}
	const [op, name, fn, extra] = queue[id];
	queue[id] = undefined;
	await processors[op](name, fn, extra);
	await process();
}

const processors = {
	async describe(name, fn, path) {
		stack.push(name);
		log('INFO', name);
		await fn();
		stack.pop();
	},
	async test(name, fn, path) {
		let stackBefore = stack;
		stack = path.concat(name);
		logBuffer = [];
		await new Promise((resolve) => {
			let calls = 0;
			const done = () => {
				if (calls++) throw Error(`Callback called multiple times\n\t${name}`);
				// log('INFO', `${name}`);
				resolve();
			};
			log('INFO', name);
			Promise.resolve(done)
				.then(fn)
				.then(() => calls || done())
				.catch((err) => {
					// log('ERROR', `${name}`);
					log('ERROR', '    🚨 ' + String(err.stack || err.message || err));
					resolve();
				});
		});
		for (let i = 0; i < logBuffer.length; i++) log(...logBuffer[i]);
		logBuffer = undefined;
		stack = stackBefore;
	}
};

let logBuffer;

function wrap(obj, method) {
	obj[method] = function () {
		let out = '  ';
		for (let i = 0; i < arguments.length; i++) {
			let val = arguments[i];
			if (typeof val === 'object' && val) {
				val = JSON.stringify(val);
			}
			if (i) out += ' ';
			out += val;
		}
		if (method !== 'error') out = `\u001b[37m${out}\u001b[0m`;
		if (logBuffer) {
			logBuffer.push([method.toUpperCase(), out, 1]);
		} else {
			log(method.toUpperCase(), out);
		}
	};
}
wrap(console, 'log');
wrap(console, 'info');
wrap(console, 'warn');
wrap(console, 'error');

function log(type, msg) {
	if (type === 'ERROR') {
		msg = `\x1b[31m${msg}\x1b[39m`;
	}
	if (type === 'SUCCESS') {
		msg = `\x1b[32m${msg}\x1b[39m`;
	}
	print(Array.from({ length: stack.length }).fill('  ').join('') + msg);
}

function push(op, name, fn, extra) {
	if (queue.push([op, name, fn, extra]) === 1) {
		setTimeout(process);
	}
}

export function describe(name, fn) {
	push('describe', name, fn, stack.slice());
}

export function test(name, fn) {
	push('test', name, fn, stack.slice());
}

export function expect(subject) {
	return new Expect(subject);
}

globalThis.describe = describe;
globalThis.test = test;
globalThis.expect = expect;

const SUBJECT = Symbol.for('subject');
const NEGATED = Symbol.for('negated');
class Expect {
	constructor(subject) {
		this[SUBJECT] = subject;
		this[NEGATED] = false;
	}
	get not() {
		this[NEGATED] = true;
		return this;
	}
	toBeGreaterThan(value) {
		const subject = this[SUBJECT];
		const negated = this[NEGATED];

		const isOver = subject > value;
		const neg = negated ? ' not' : '';
		const type = isOver !== negated ? 'SUCCESS' : 'ERROR';
		const icon = isOver !== negated ? '✅ ' : '❌ ';
		let msg = `${icon} Expected ${subject}${neg} to be greater than ${value}`;
		if (logBuffer) {
			for (let i = logBuffer.length; i-- > -1; ) {
				if (i < 0 || logBuffer[i][2] === 1) {
					logBuffer.splice(i + 1, 0, [type, msg, 1]);
					break;
				}
			}
		} else {
			log(type, msg);
		}
	}
}
