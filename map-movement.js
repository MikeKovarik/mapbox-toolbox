import {extend, isGeoJson, isCoord, isBbox} from './util.js'


var {Map} = mapboxgl

var _easeTo = Map.prototype.easeTo
var _panTo = Map.prototype.panTo
var _fitBounds = Map.prototype.fitBounds

class MapExtension {

	// TODO: get/set current center. alternative for get center() {}
	//get lon() {}
	//get lng() {}
	//get lat() {}

	get center() {return this.getCenter().toArray()}
	set center(center) {this.flyTo({center})}

	// basics

	get zoom() {return this.getZoom()}
	set zoom(zoom) {this._queueAnimation('zoom', zoom)}
	//set zoom(zoom) {this.easeTo({zoom})}

	get bearing() {return this.getBearing()}
	set bearing(bearing) {this._queueAnimation('bearing', bearing)}
	//set bearing(bearing) {this.easeTo({bearing})}

	get pitch() {return this.getPitch()}
	set pitch(pitch) {this._queueAnimation('pitch', pitch)}
	//set pitch(pitch) {this.easeTo({pitch})}

	_queueAnimation(key, value) {
		clearTimeout(this._animationTimeout)
		this._animationQueue = this._animationQueue || {}
		this._animationQueue[key] = value
		this._animationTimeout = setTimeout(() => {
			this.easeTo(this._animationQueue)
			this._animationQueue = undefined
		})
	}

	// aliases

	get rotation() {return this.bearing}
	set rotation(bearing) {this.bearing = bearing}

	get tilt() {return this.pitch}
	set tilt(pitch) {this.pitch = pitch}

	// canvas width

	get width()  {return this.transform.width}
	get height() {return this.transform.height}

	get effectiveWidth()  {return this.width  - this.offset.left - this.offset.right}
	get effectiveHeight() {return this.height - this.offset.top  - this.offset.bottom}

	get computedPadding() {
		let {offset, padding} = this
		return {
			top:    offset.top    + padding.top,
			right:  offset.right  + padding.right,
			bottom: offset.bottom + padding.bottom,
			left:   offset.left   + padding.left,
		}
	}

	get computedOffset() {
		let {offset} = this
		return [
			(offset.left - offset.right) / 2,
			(offset.top - offset.bottom) / 2
		]
	}

	get padding() {
		if (this._padding) return this._padding
		var horizontal = this.width  / 14
		var vertical   = this.height / 14
		return {
			top: vertical,
			right: horizontal,
			bottom: vertical,
			left: horizontal
		}
	}
	set padding(padding) {
		this._padding = padding
	}

	get offset() {
		return Object.assign({top: 0, right: 0, bottom: 0, left: 0}, this._offset)
	}
	set offset(offset) {
		this._offset = offset
	}

	// TODO: remove geojson support, keep as close to original API as possible
	panTo(center, options = {}, e) {
		if (isGeoJson(center))
			center = center.geometry.coordinates
		if (typeof options === 'number')
			options = {duration: options}
		return _panTo.call(this, center, options, e)
	}

	// TODO: remove geojson support, keep as close to original API as possible
	// only keep padding/offset support
	easeTo(options, e) {
		if (isGeoJson(options.center))
			options.center = options.center.geometry.coordinates
		if (options.offset === undefined)
			options.offset = this.computedOffset
		return _easeTo.call(this, options, e)
	}

	// TODO: remove geojson support, keep as close to original API as possible
	// only keep padding/offset support
	fitBounds(bounds, options = {}, e) {
		if (isGeoJson(bounds)) {
			let coords = bounds.geometry.coordinates
			bounds = new mapboxgl.LngLatBounds(coords[0], coords[0])
			coords.reduce((bounds, coord) => bounds.extend(coord), bounds)
		}
		if (options.padding === undefined)
			options.padding = this.computedPadding
		return _fitBounds.call(this, bounds, options, e)
	}


	// TODO: rework to use custom methods instead of modifying original API
	animateTo(coords) {
		if (isGeoJson(coords)) {
			if (coords.geometry.type === 'Point')
				return this.easeTo({center: coords})
			else
				return this.fitBounds(coords)
		} else if (isCoord(coords)) {
			return this.easeTo({center: coords})
		} else if (isBbox(coords)) {
			return this.fitBounds(coords)
		}
	}

	// TODO: polish these custom methods

	_transformArgsToMapOptions(args) {
		var [mapOptions, arg] = args.reverse()
		if (Array.isArray(mapOptions)) {
			arg = mapOptions
			mapOptions = {}
		}
		if (arg) {
			if (isBbox(arg))
				mapOptions.bounds = arg
			else if (isCoord(arg))
				mapOptions.center = arg
		}
		return mapOptions
	}

	jump(...args) {
		var mapOptions = this._transformArgsToMapOptions(args)
		if (mapOptions.bounds) {
			var bounds = mapOptions.bounds
			delete mapOptions.bounds
			mapOptions.duration = 0
			this.fitBounds(bounds, mapOptions)
		} else {
			this.jumpTo(mapOptions)
		}
	}

	animate(...args) {
		var mapOptions = this._transformArgsToMapOptions(args)
		if (mapOptions.duration === undefined) {
			var distance = 3 // TODO
			var baseDuration = 200
			mapOptions.duration = baseDuration * distance
		}
		if (mapOptions.bounds) {
			var bounds = mapOptions.bounds
			delete mapOptions.bounds
			this.fitBounds(bounds, mapOptions)
		} else {
			this.easeTo(mapOptions)
		}
		return Promise.timeout(mapOptions.duration)
	}

}

extend(Map, MapExtension)