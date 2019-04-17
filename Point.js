import {CompoundItem} from './CompoundItem.js'
import {isGeoJson, getColor, getStyle} from './util.js'

/*
export const POINT_PAINT = {
	"circle-radius": {
		stops: [
			[3, 3],
			[8, 5]
		]
	},
	"circle-color": "#fff",
	"circle-stroke-color": "#fff",
	"circle-stroke-width": {
		stops: [
			[5, 5],
			[9, 5]
		]
	},
	"circle-stroke-opacity": .2
}
*/
export class Point extends CompoundItem {

	static type = 'circle'

	static paint = [
		'circle-radius',
		'circle-color',
		'circle-opacity',
	]

	paint = {
		'circle-radius': 8,
	}

	_wrapInGeoJson(arg) {
		return isGeoJson(arg) ? arg : turf.point(arg)
	}

	_createDummy() {
		return turf.point([])
	}

	_createOptionsFromArgs(...args) {
		var options = {}
		for (let arg of args) {
			switch (typeof arg) {
				case 'string':
					options.color = arg
					break
				case 'number':
					options.size = arg
					break
			}
		}
		return options
	}

	setLngLat(coords) {
		this.data.geometry.coordinates = coords
		this.update()
		return this
	}

}
