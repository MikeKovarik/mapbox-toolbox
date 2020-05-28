export var {Map} = mapboxgl
import './map-layers.js'
import './map-movement.js'
import './map-render.js'
//export * from './CompoundItem.js'
export * from './Point.js'
export * from './Line.js'
export * from './Polygon.js'
export * from './Label.js'
export * from './Marker.js'
export * from './util.js'
export * from './CustomMarker.js'
export * from './ViewportChecker.js'
import * as geolib from './geolib.js'
export {geolib}

// needed to get hold of map instance, without having to do some nasty get/set Object.defineProperty hacks.
// Maybe will be implemented in the future. Not enough time for now.
Map.prototype.initToolbox = function() {
}