import {CompoundItem} from './CompoundItem.js'
import {createGetters, getStyle} from './util.js'
import {DASHED, DOTTED, SOLID} from './util.js'

// TODO: reimplement dashes/dotted line styles

const LAYOUT = {
	'line-cap': 'round',
	'line-join': 'round'
}

const VARIABLE_WIDTH = [
	'interpolate', ['linear'], ['zoom'],
	4, 0.4,
	15, 4,
	20, 10,
]

export class Line extends CompoundItem {

	static type = 'line'

	static paint = [
		'line-width',
		'line-color',
		'line-opacity',
		'line-dasharray',
	]

	static layout = [
		'line-cap',
		'line-join',
	]

	paint = {
		'line-width': VARIABLE_WIDTH,
	}

	_wrapInGeoJson(coords) {
		return turf.lineString(coords)
	}

	_createDummy() {
		return {type: 'FeatureCollection', features: []}
	}

	_createOptionsFromArgs(color, width) {
		return {color, width}
	}

	_processOptions() {
		if (this.options.style) {
			this.layerOptions.paint['line-dasharray'] = getStyle(this.options.style)
		} else {
			this.layerOptions.layout = LAYOUT
		}
	}

	get length() {
		return turf && turf.length(this.data)
	}

	set dashed(bool) {
		console.log('set dashed', bool)
		this['line-dasharray'] = bool ? DASHED : SOLID
	}
	set dotted(bool) {
		console.log('set dotted', bool)
		this['line-dasharray'] = bool ? DOTTED : SOLID
	}

	get gradient() {
		return this.layer.getPaintProperty('line-gradient')
	}
	set gradient(stops) {
		if (Array.isArray(stops)) {
			let gradient = [
				'interpolate',
				['linear'],
				['line-progress'],
				...stops
			]
			this.map.setPaintProperty(this.id, 'line-gradient', gradient)
		} else {
			// TODO
		}
		var opts = this.source.workerOptions.geojsonVtOptions
		if (!opts.lineMetrics) {
			opts.lineMetrics = true
			this.render()
		}
	}

	get bbox() {
		if (this._cached.bbox) return this._cached.bbox
		return this._cached.bbox = turf.bbox(this.data)
	}

	get square() {
		if (this._cached.square) return this._cached.square
		return this._cached.square = turf.square(this.bbox)
	}

	get renderedSize() {
		var bbox = this.bbox
		var leftTop     = this.map.project([bbox[0], bbox[1]])
		var bottomRight = this.map.project([bbox[2], bbox[3]])
		var width  = Math.abs(bottomRight.x - leftTop.x)
		var height = Math.abs(bottomRight.y - leftTop.y)
		return {width, height}
	}

	get visibleRatios() {
		var size = this.renderedSize
		var width  = size.width  / this.map.effectiveWidth
		var height = size.height / this.map.effectiveHeight
		return {width, height}
	}

	get visibleRatio() {
		var {width, height} = this.visibleRatios
		return Math.max(width, height)
	}

}

createGetters(Line)