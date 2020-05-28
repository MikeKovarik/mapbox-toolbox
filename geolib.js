// this may (or may not) be a replacement for turf.
// turf has some questionable choices and is no longer maintained.

// LON: left/right
// LAT: top/bottom
// COORD: [lon, lat] = [left/right, top/bottom]
// BBOX: [left, bottom, right, top]
// MAPBOX IMAGE LAYER: [[left, top], [right, top], [right, bottom], [left, bottom]]


import {isFlatBbox, isNestedBbox} from './util.js'

export function point(coord, properties) {
	let geojson = {
		type: 'Feature',
		geometry: {
			type: 'Point',
			coordinates: coord
		}
	}
	return enrichGeoJson(geojson, properties)
}

export function polygon(coords, properties) {
	// copy data, do not modify user's data
	coords = [...coords]
	let firstCoord = coords[0]
	let lastCoord = coords[coords.length - 1]
	if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1])
		coords.push(firstCoord)
	let geojson = {
		type: 'Feature',
		geometry: {
			type: 'Polygon',
			// yes, two nested arrays. what a stupid format.
			coordinates: [coords]
		}
	}
	return enrichGeoJson(geojson, properties)
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

function enrichGeoJson(geojson, properties) {
	if (properties)
		geojson.properties = Object.assign({}, properties)
	return geojson
}