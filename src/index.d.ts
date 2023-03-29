import { VNode } from 'preact';

export default function renderToString(vnode: VNode, context?: any): string;

export function render(vnode: VNode, context?: any): string;
export function renderToString(vnode: VNode, context?: any): string;
export function renderToStaticMarkup(vnode: VNode, context?: any): string;
