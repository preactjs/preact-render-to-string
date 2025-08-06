import render from '../../src/index.js';
import { signal } from '@preact/signals-core';
import { h } from 'preact';
import { expect, describe, it } from 'vitest';

/** @jsx h */

describe('signals', () => {
	it('should render signals', () => {
		const disabled = signal(false);

		const vdom = <input draggable={false} disabled={disabled} />;

		expect(render(vdom)).to.equal('<input draggable="false"/>');
	});
});
