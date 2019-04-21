import {CompoundItem} from './CompoundItem.js'
import {isGeoJson, createGetters, isCoord, isCoords} from './util.js'


export class Label extends CompoundItem {

	static type = 'symbol'

	static layout = [
		'text-field',
		'text-size',
	]

	static paint = [
		'text-color',
		'text-opacity',
	]

	constructor(...args) {
		super(...args)
		var data = this.sourceOptions.data
		if (data.geometry.type === 'LineString') {
			let line = data
			let length = turf.length(line)
			this.sourceOptions.data = turf.along(line, length / 2)
		}
	}

	_wrapInGeoJson(arg) {
		if (isGeoJson(arg)) return arg
		if (isCoord(arg)) return turf.point(arg)
		if (isCoords(arg)) {
			var line = turf.lineString(arg)
			var length = turf.length(line)
			return turf.along(line, length / 2)
		}
		console.warn('unknown label data')
	}

	_createOptionsFromArgs(text, color, size) {
		return {text, color, size}
	}

	layerOptions = {
		minzoom: 3,
	}

	layout = {
		'text-size': 12,
	}

	paint = {
		'text-color': '#000',
		'text-halo-color': '#EEE',
		'text-halo-width': 5
	}

}

createGetters(Label)