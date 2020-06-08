// this may (or may not) be a replacement for turf.
// turf has some questionable choices and is no longer maintained.

// LON: left/right
// LAT: top/bottom
// COORD: [lon, lat] = [left/right, top/bottom]
// BBOX: [left, bottom, right, top]
// MAPBOX IMAGE LAYER: [[left, top], [right, top], [right, bottom], [left, bottom]]


import {isFlatBbox, isNestedBbox} from './util.js'

function feature(type, coordinates, properties) {
	let geojson = {
		type: 'Feature',
		geometry: {type, coordinates}
	}
	if (properties)
		geojson.properties = Object.assign({}, properties)
	return geojson
}

export function lineString(coords, properties) {
	return feature('LineString', coords, properties)
}

export function point(coord, properties) {
	return feature('Point', coord, properties)
}

export function polygon(coords, properties) {
	// copy data, do not modify user's data
	coords = [...coords]
	let firstCoord = coords[0]
	let lastCoord = coords[coords.length - 1]
	if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1])
		coords.push(firstCoord)
	// yes, two nested arrays. what a stupid format.
	return feature('Polygon', [coords], properties)
}

export function bboxCenter(bbox) {
	if (isFlatBbox(bbox)) {
		var [left, bottom, right, top] = bbox
	} else if (isNestedBbox(bbox)) {
		// TODO: ???
	}
	let lon = ((right - left) / 2) + left
	let lat = ((bottom - top) / 2) + top
	return [lon, lat]
}
