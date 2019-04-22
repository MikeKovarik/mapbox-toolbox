import {CompoundItem} from './CompoundItem.js'
import {isGeoJson, createGetters} from './util.js'

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
		'circle-stroke-width',
		'circle-stroke-color',
		'circle-stroke-opacity',
	]

	paint = {
		'circle-radius': 8,
	}

	_wrapInGeoJson(coords) {
		return turf.point(coords)
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
					options.radius = arg
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

createGetters(Point)