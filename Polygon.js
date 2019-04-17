import {CompoundItem} from './CompoundItem.js'
import {isGeoJson} from './util.js'


export class Polygon extends CompoundItem {

	static type = 'fill'

	static paint = [
		'fill-color',
		'fill-opacity',
	]

	paint = {
		'fill-opacity': 0.1,
	}

	_wrapInGeoJson(arg) {
		if (isGeoJson(arg)) {
			return arg
		} else if (Array.isArray(arg)) {
			if (arg.length === 4 && typeof arg[0] === 'number')
				return turf.bboxPolygon(arg)
			else
				return turf.polygon(arg)
		}
	}

	_createDummy() {
		return turf.polygon([])
	}

	_createOptionsFromArgs(color, opacity) {
		return {color, opacity}
	}

	get opacity() {
		return this.layer.paint['fill-opacity']
	}

	set opacity(value) {
		this.layer.paint['fill-opacity'] = value
		this.render()
	}


/*
	foobar() {
		this.map.addSource(this.id, this.sourceOptions)

		this.map.addLayer(this.layerOptions)

		var polygonLine = turf.polygonToLine(polygon)
		this.renderLine(polygonLine, color, 1)
	}
*/
}
