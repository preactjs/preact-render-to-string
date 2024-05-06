import { h } from 'preact';
import { Deferred } from '../src/lib/util';

/**
 * tag to remove leading whitespace from tagged template
 * literal.
 * @param {TemplateStringsArray}
 * @returns {string}
 */
export function dedent([str]) {
	return str
		.split('\n' + str.match(/^\n*(\s+)/)[1])
		.join('\n')
		.replace(/(^\n+|\n+\s*$)/g, '');
}

export function createSuspender() {
	const deferred = new Deferred();
	let resolved;

	deferred.promise.then(() => (resolved = true));
	function Suspender({ children = null }) {
		if (!resolved) {
			throw deferred.promise;
		}

		return children;
	}

	return {
		getResolved() {
			return resolved;
		},
		suspended: deferred,
		Suspender
	};
}
export const svgAttributes = {
	accentHeight: 'accent-height',
	accumulate: 'accumulate',
	additive: 'additive',
	alignmentBaseline: 'alignment-baseline',
	allowReorder: 'allowReorder', // unsure
	alphabetic: 'alphabetic',
	amplitude: 'amplitude',
	arabicForm: 'arabic-form',
	ascent: 'ascent',
	attributeName: 'attributeName',
	attributeType: 'attributeType',
	autoReverse: 'autoReverse', // unsure
	azimuth: 'azimuth',
	baseFrequency: 'baseFrequency',
	baselineShift: 'baseline-shift',
	baseProfile: 'baseProfile',
	bbox: 'bbox',
	begin: 'begin',
	bias: 'bias',
	by: 'by',
	calcMode: 'calcMode',
	capHeight: 'cap-height',
	class: 'class',
	clip: 'clip',
	clipPathUnits: 'clipPathUnits',
	clipPath: 'clip-path',
	clipRule: 'clip-rule',
	color: 'color',
	colorInterpolation: 'color-interpolation',
	colorInterpolationFilters: 'color-interpolation-filters',
	colorProfile: 'color-profile',
	colorRendering: 'color-rendering',
	contentScriptType: 'contentScriptType',
	contentStyleType: 'contentStyleType',
	crossorigin: 'crossorigin',
	cursor: 'cursor',
	cx: 'cx',
	cy: 'cy',
	d: 'd',
	decelerate: 'decelerate',
	descent: 'descent',
	diffuseConstant: 'diffuseConstant',
	direction: 'direction',
	display: 'display',
	divisor: 'divisor',
	dominantBaseline: 'dominant-baseline',
	dur: 'dur',
	dx: 'dx',
	dy: 'dy',
	edgeMode: 'edgeMode',
	elevation: 'elevation',
	enableBackground: 'enable-background',
	end: 'end',
	exponent: 'exponent',
	fill: 'fill',
	fillOpacity: 'fill-opacity',
	fillRule: 'fill-rule',
	filter: 'filter',
	filterRes: 'filterRes',
	filterUnits: 'filterUnits',
	floodColor: 'flood-color',
	floodOpacity: 'flood-opacity',
	fontFamily: 'font-family',
	fontSize: 'font-size',
	fontSizeAdjust: 'font-size-adjust',
	fontStretch: 'font-stretch',
	fontStyle: 'font-style',
	fontVariant: 'font-variant',
	fontWeight: 'font-weight',
	format: 'format',
	from: 'from',
	fx: 'fx',
	fy: 'fy',
	g1: 'g1',
	g2: 'g2',
	glyphName: 'glyph-name',
	glyphOrientationHorizontal: 'glyph-orientation-horizontal',
	glyphOrientationVertical: 'glyph-orientation-vertical',
	glyphRef: 'glyphRef',
	gradientTransform: 'gradientTransform',
	gradientUnits: 'gradientUnits',
	hanging: 'hanging',
	horizAdvX: 'horiz-adv-x',
	horizOriginX: 'horiz-origin-x',
	ideographic: 'ideographic',
	imageRendering: 'image-rendering',
	in: 'in',
	in2: 'in2',
	intercept: 'intercept',
	k: 'k',
	k1: 'k1',
	k2: 'k2',
	k3: 'k3',
	k4: 'k4',
	kernelMatrix: 'kernelMatrix',
	kernelUnitLength: 'kernelUnitLength',
	kerning: 'kerning',
	keyPoints: 'keyPoints',
	keySplines: 'keySplines',
	keyTimes: 'keyTimes',
	lengthAdjust: 'lengthAdjust',
	letterSpacing: 'letter-spacing',
	lightingColor: 'lighting-color',
	limitingConeAngle: 'limitingConeAngle',
	local: 'local',
	markerEnd: 'marker-end',
	markerMid: 'marker-mid',
	markerStart: 'marker-start',
	markerHeight: 'markerHeight',
	markerUnits: 'markerUnits',
	markerWidth: 'markerWidth',
	mask: 'mask',
	maskContentUnits: 'maskContentUnits',
	maskUnits: 'maskUnits',
	mathematical: 'mathematical',
	numOctaves: 'numOctaves',
	offset: 'offset',
	opacity: 'opacity',
	operator: 'operator',
	order: 'order',
	orient: 'orient',
	orientation: 'orientation',
	origin: 'origin',
	overflow: 'overflow',
	overlinePosition: 'overline-position',
	overlineThickness: 'overline-thickness',
	panose1: 'panose-1',
	paintOrder: 'paint-order',
	pathLength: 'pathLength',
	patternContentUnits: 'patternContentUnits',
	patternTransform: 'patternTransform',
	patternUnits: 'patternUnits',
	pointerEvents: 'pointer-events',
	points: 'points',
	pointsAtX: 'pointsAtX',
	pointsAtY: 'pointsAtY',
	pointsAtZ: 'pointsAtZ',
	preserveAlpha: 'preserveAlpha',
	preserveAspectRatio: 'preserveAspectRatio',
	primitiveUnits: 'primitiveUnits',
	r: 'r',
	radius: 'radius',
	refX: 'refX',
	refY: 'refY',
	rel: 'rel',
	renderingIntent: 'rendering-intent',
	repeatCount: 'repeatCount',
	repeatDur: 'repeatDur',
	requiredExtensions: 'requiredExtensions',
	requiredFeatures: 'requiredFeatures',
	restart: 'restart',
	result: 'result',
	rotate: 'rotate',
	rx: 'rx',
	ry: 'ry',
	scale: 'scale',
	seed: 'seed',
	shapeRendering: 'shape-rendering',
	slope: 'slope',
	spacing: 'spacing',
	specularConstant: 'specularConstant',
	specularExponent: 'specularExponent',
	speed: 'speed',
	spreadMethod: 'spreadMethod',
	startOffset: 'startOffset',
	stdDeviation: 'stdDeviation',
	stemh: 'stemh',
	stemv: 'stemv',
	stitchTiles: 'stitchTiles',
	stopColor: 'stop-color',
	stopOpacity: 'stop-opacity',
	strikethroughPosition: 'strikethrough-position',
	strikethroughThickness: 'strikethrough-thickness',
	string: 'string',
	stroke: 'stroke',
	strokeDasharray: 'stroke-dasharray',
	strokeDashoffset: 'stroke-dashoffset',
	strokeLinecap: 'stroke-linecap',
	strokeLinejoin: 'stroke-linejoin',
	strokeMiterlimit: 'stroke-miterlimit',
	strokeOpacity: 'stroke-opacity',
	strokeWidth: 'stroke-width',
	surfaceScale: 'surfaceScale',
	systemLanguage: 'systemLanguage',
	tableValues: 'tableValues',
	targetX: 'targetX',
	targetY: 'targetY',
	textAnchor: 'text-anchor',
	textDecoration: 'text-decoration',
	textRendering: 'text-rendering',
	textLength: 'textLength',
	to: 'to',
	transform: 'transform',
	transformOrigin: 'transform-origin',
	u1: 'u1',
	u2: 'u2',
	underlinePosition: 'underline-position',
	underlineThickness: 'underline-thickness',
	unicode: 'unicode',
	unicodeBidi: 'unicode-bidi',
	unicodeRange: 'unicode-range',
	unitsPerEm: 'units-per-em',
	vAlphabetic: 'v-alphabetic',
	vHanging: 'v-hanging',
	vIdeographic: 'v-ideographic',
	vMathematical: 'v-mathematical',
	values: 'values',
	vectorEffect: 'vector-effect',
	version: 'version',
	vertAdvY: 'vert-adv-y',
	vertOriginX: 'vert-origin-x',
	vertOriginY: 'vert-origin-y',
	viewBox: 'viewBox',
	viewTarget: 'viewTarget',
	visibility: 'visibility',
	widths: 'widths',
	wordSpacing: 'word-spacing',
	writingMode: 'writing-mode',
	x: 'x',
	xHeight: 'x-height',
	x1: 'x1',
	x2: 'x2',
	xChannelSelector: 'xChannelSelector',
	xlinkActuate: 'xlink:actuate',
	xlinkArcrole: 'xlink:arcrole',
	xlinkHref: 'xlink:href',
	xlinkRole: 'xlink:role',
	xlinkShow: 'xlink:show',
	xlinkTitle: 'xlink:title',
	xlinkType: 'xlink:type',
	xmlBase: 'xml:base',
	xmlLang: 'xml:lang',
	xmlSpace: 'xml:space',
	y: 'y',
	y1: 'y1',
	y2: 'y2',
	yChannelSelector: 'yChannelSelector',
	z: 'z',
	zoomAndPan: 'zoomAndPan'
};

export const htmlAttributes = {
	accept: 'accept',
	acceptCharset: 'accept-charset',
	accessKey: 'accesskey',
	action: 'action',
	allow: 'allow',
	// allowFullScreen: '', // unsure?
	// allowTransparency: '', // unsure?
	alt: 'alt',
	as: 'as',
	async: 'async',
	autocomplete: 'autocomplete',
	autoComplete: 'autocomplete',
	autocorrect: 'autocorrect',
	autoCorrect: 'autocorrect',
	autofocus: 'autofocus',
	autoFocus: 'autofocus',
	autoPlay: 'autoplay',
	capture: 'capture',
	cellPadding: 'cellPadding',
	cellSpacing: 'cellSpacing',
	charSet: 'charset',
	challenge: 'challenge',
	checked: 'checked',
	cite: 'cite',
	class: 'class',
	className: 'class',
	cols: 'cols',
	colSpan: 'colspan',
	content: 'content',
	contentEditable: 'contenteditable',
	contextMenu: 'contextmenu',
	controls: 'controls',
	coords: 'coords',
	crossOrigin: 'crossorigin',
	data: 'data',
	dateTime: 'datetime',
	default: 'default',
	defaultChecked: 'checked',
	defaultValue: 'value',
	defer: 'defer',
	dir: 'dir',
	disabled: 'disabled',
	download: 'download',
	decoding: 'decoding',
	draggable: 'draggable',
	encType: 'enctype',
	enterkeyhint: 'enterkeyhint',
	for: 'for',
	form: 'form',
	formAction: 'formaction',
	formEncType: 'formenctype',
	formMethod: 'formmethod',
	formNoValidate: 'formnovalidate',
	formTarget: 'formtarget',
	frameBorder: 'frameborder',
	headers: 'headers',
	height: 'height',
	hidden: 'hidden',
	high: 'high',
	href: 'href',
	hrefLang: 'hreflang',
	htmlFor: 'for',
	httpEquiv: 'http-equiv',
	icon: 'icon',
	id: 'id',
	indeterminate: 'indeterminate',
	inputMode: 'inputmode',
	integrity: 'integrity',
	is: 'is',
	kind: 'kind',
	label: 'label',
	lang: 'lang',
	list: 'list',
	loading: 'loading',
	loop: 'loop',
	low: 'low',
	manifest: 'manifest',
	max: 'max',
	maxLength: 'maxlength',
	media: 'media',
	method: 'method',
	min: 'min',
	minLength: 'minlength',
	multiple: 'multiple',
	muted: 'muted',
	name: 'name',
	nomodule: 'nomodule',
	nonce: 'nonce',
	noValidate: 'novalidate',
	open: 'open',
	optimum: 'optimum',
	part: 'part',
	pattern: 'pattern',
	ping: 'ping',
	placeholder: 'placeholder',
	playsInline: 'playsinline',
	poster: 'poster',
	preload: 'preload',
	readonly: 'readonly',
	readOnly: 'readonly',
	referrerpolicy: 'referrerpolicy',
	rel: 'rel',
	required: 'required',
	reversed: 'reversed',
	role: 'role',
	rows: 'rows',
	rowSpan: 'rowspan',
	sandbox: 'sandbox',
	scope: 'scope',
	scoped: 'scoped',
	scrolling: 'scrolling',
	seamless: 'seamless',
	selected: 'selected',
	shape: 'shape',
	size: 'size',
	sizes: 'sizes',
	slot: 'slot',
	span: 'span',
	spellcheck: 'spellcheck',
	spellCheck: 'spellcheck',
	src: 'src',
	srcset: 'srcset',
	srcDoc: 'srcdoc',
	srcLang: 'srclang',
	srcSet: 'srcset',
	start: 'start',
	step: 'step',
	style: 'style',
	summary: 'summary',
	tabIndex: 'tabindex',
	target: 'target',
	title: 'title',
	type: 'type',
	useMap: 'useMap',
	value: 'value',
	volume: 'volume',
	width: 'width',
	wmode: 'wmode',
	wrap: 'wrap',

	// Non-standard Attributes
	autocapitalize: 'autocapitalize',
	autoCapitalize: 'autocapitalize',
	results: 'results',
	translate: 'translate',

	// RDFa Attributes
	about: 'about',
	datatype: 'datatype',
	inlist: 'inlist',
	prefix: 'prefix',
	property: 'property',
	resource: 'resource',
	typeof: 'typeof',
	vocab: 'vocab',

	// Microdata Attributes
	itemProp: 'itemprop',
	itemScope: 'itemscope',
	itemType: 'itemtype',
	itemID: 'itemid',
	itemRef: 'itemref'
};
