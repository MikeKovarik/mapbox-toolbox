import {CompoundItem} from './CompoundItem.js'
import {isGeoJson, createGetters, isCoord, isCoords} from './util.js'


// TODO: enable rendering label without base style - https://github.com/mapbox/mapbox-gl-js/issues/4808

export class Label extends CompoundItem {

	static type = 'symbol'

	static layout = [
		'symbol-placement',
		'text-image',
		'text-field',
		'text-font',
		'text-size',
		'text-justify',
		'text-anchor',
		'text-offset',
	]

	static paint = [
		'text-color',
		'text-opacity',
		'text-halo-color',
		'text-halo-width',
	]
/*
	constructor(...args) {
		super(...args)
		var data = this.sourceOptions.data
		if (data.geometry.type === 'LineString') {
			let line = data
			let length = turf.length(line)
			this.sourceOptions.data = turf.along(line, length / 2)
		}
	}
*/
	_wrapInGeoJson(arg) {
		if (isCoord(arg)) return turf.point(arg)
		if (isCoords(arg)) {
			var line = turf.lineString(arg)
			var length = turf.length(line)
			return turf.along(line, length / 2)
		}
		console.warn('unknown label data')
	}

	_createOptionsFromArgs(text, color, size) {
		return {field: text, color, size}
	}

	_createDummy() {
		return turf.point([])
	}

	layerOptions = {
		minzoom: 3,
	}

	layout = {
		'text-size': 12,
	}

	paint = {
		'text-color': '#000',
		//'text-halo-color': '#EEE',
		//'text-halo-width': 5
	}

}

createGetters(Label)