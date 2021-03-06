import {Point} from './Point.js'
import {Line} from './Line.js'
import {Polygon} from './Polygon.js'
import {Label} from './Label.js'
//import {Marker} from './Marker.js'
import {extend} from './util.js'
import {isCoord, isCoords, isBbox, isGeoJson, createRandomId} from './util.js'
import {ViewportedMarker} from './CustomMarker.js'


function getNewNode(size, color) {
	var node = document.createElement('div')
	Object.assign(node.style, {
		backgroundColor: color,
		width:  `${size}px`,
		height: `${size}px`,
		borderRadius: '100%',
		willChange: 'transform, background, width, height',
		// TODO: rework marker to use container as well.
		// transitions break since the marker itself is transformed (translate) by mapbox
		transitionDuration: '180ms',
		transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
		transitionProperty: 'transform, background, width, height',
	})
	return node
}


class MapExtension {

	render(data, ...args) {
		if (Array.isArray(data)) {
			if (isCoord(data)) {
				return this.renderPoint(data, ...args)
			} else if (isCoords(data)) {
				return this.renderLine(data, ...args)
			} else if (isBbox(data)) {
				return this.renderPolygon(data, ...args)
			}
		} else if (isGeoJson(data)) {
			if (data.type === 'Feature') {
				switch (data.geometry.type) {
					case 'Point':      return this.renderPoint(data, ...args)
					case 'LineString': return this.renderLine(data, ...args)
					case 'Polygon':    return this.renderPolygon(data, ...args)
				}
			}
			return this.renderGeoJson(data, ...args)
		} else if (typeof data === 'string' || typeof data === 'number') {
			this.renderLabel(data, ...args)
		} else {
			console.warn('unknown data to render', data)
		}
	}
	

	renderLine(...args) {
		return (new Line(args)).addTo(this)
	}
	
	renderPoint(...args) {
		return (new Point(args)).addTo(this)
	}

	renderLabel(...args) {
		return (new Label(args)).addTo(this)
	}

	renderPolygon(...args) {
		return (new Polygon(args)).addTo(this)
	}

	renderSquare(...args) {
		return (new Polygon(args)).addTo(this)
	}

	renderCircle(...args) {
		// todo
	}

	renderLines(...args)    {this.renderLine(...args)}
	renderLabels(...args)   {this.renderLabel(...args)}
	renderPolygons(...args) {this.renderPolygon(...args)}

	renderPoints(arg, options) {
		let sourceId
		let layerId
		if (typeof arg === 'string') {
			sourceId = arg
			layerId = Math.random().toString()
		} else {
			sourceId = Math.random().toString()
			layerId = sourceId
			map.addSource(sourceId, {
				'type': 'geojson',
				'data': arg
			})
		}
		let layer = {
			id: layerId,
			source: sourceId,
			type: 'circle',
			paint: {
				'circle-radius': options.size || options.radius,
				'circle-color': options.color,
			},
		}
		if (options.filter) layer.filter = options.filter
		map.addLayer(layer)
		return layerId
	}

	// TODO: rework marker to use container as well
	// TODO: deprecate in favor of v2
	renderMarkerLegacy(...args) {
		var node = args[0] instanceof HTMLElement ? args.shift() : undefined
		var [coords, color, size] = args
		if (!node) {
			if (typeof color === 'object') {
				node = getNewNode(10, '#000')
				let style = color
				Object.assign(node.style, style)
			} else {
				if (size === undefined) size = 10
				node = getNewNode(size, color)
			}
		}
		let marker = new mapboxgl.Marker(node)
		marker.map = this
		if (coords) marker.coords = coords
		return marker
	}

	// TODO: replace the main one with this
	renderMarker(...args) {
		let node
		if (args[0] instanceof HTMLElement || (typeof args[0] === 'string' && args[0].startsWith('<')))
			node = args.shift()
		var [coords, color, size] = args
		if (!node) {
			if (typeof color === 'object') {
				node = getNewNode(10, '#000')
				let style = color
				console.log('style', style)
				Object.assign(node.style, style)
			} else {
				if (size === undefined) size = 10
				node = getNewNode(size, color)
			}
		}
		return this.renderHtml(node, coords)
	}

	renderHtml(node, coords) {
		return new ViewportedMarker(node, coords, this)
	}

	renderImage(url, coords, size) {
		var node = getNewNode(size)
		Object.assign(node.style, {
			backgroundPosition: 'center',
			backgroundSize: 'cover',
			backgroundImage: `url(${url})`
		})
		var container = document.createElement('div')
		container.appendChild(node)
		var marker = new mapboxgl.Marker(container)
		marker.map = this
		if (coords) marker.coords = coords
		marker.node = node
		return marker
	}

	/*
	renderBbox(bbox, color) {
		var slice = turf.lineSlice(this.startPoint.data, this.endPoint.data, this.line.data)
		var bbox = turf.bbox(slice)
		this.map.renderPolygon(bbox, this.section.color)
	}
	*/

}

extend(mapboxgl.Map, MapExtension)