import './map-layers.js'
import './map-movement.js'
import './map-render.js'
import initTiltGesture from './gesture-tilt.js'
//import initZoomGesture from './gesture-zoom.js'
//export * from './CompoundItem.js'
export * from './Point.js'
export * from './Line.js'
export * from './Polygon.js'
export * from './Label.js'
export * from './Marker.js'
export * from './util.js'
export var {Map} = mapboxgl
export {CustomMarker} from './CustomMarker.js'

// needed to get hold of map instance, without having to do some nasty get/set Object.defineProperty hacks.
// Maybe will be implemented in the future. Not enough time for now.
Map.prototype.initToolbox = function() {
	initTiltGesture(this)
	//initZoomGesture(this)
}