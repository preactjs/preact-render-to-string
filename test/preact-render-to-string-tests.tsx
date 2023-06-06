import render from '../src/index.js';
import { h } from 'preact';

let vdom = <div class="foo">content</div>;

let html = render(vdom);
console.log(html);
