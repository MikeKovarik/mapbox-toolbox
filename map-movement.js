import {extend, isGeoJson, isCoord, isCoords, isBbox, coordsToBbox, promiseTimeout} from './util.js'


var {Map} = mapboxgl

var _easeTo = Map.prototype.easeTo
var _panTo = Map.prototype.panTo
var _fitBounds = Map.prototype.fitBounds

class MapExtension {

	// TODO: move this to separate class? map-core or something
	get isReady() {
		return this.style !== undefined
			&& this.style._loaded
	}

	get ready() {
		if (this.isReady) return Promise.resolve()
		// WARNING: 'style.load' will be removed once 'styledata' is fixed
		// https://github.com/mapbox/mapbox-gl-js/issues/3970#issuecomment-275722197
		//map.once('styledata', e => map.isStyleLoaded())
		return new Promise(resolve => this.once('style.load', resolve))
	}


	// TODO: get/set current center. alternative for get center() {}
	//get lon() {}
	//get lng() {}
	//get lat() {}

	get center() {return this.getCenter().toArray()}
	set center(center) {this._queueAnimation('center', center)}
	//set center(center) {this.animate({center})}
	//set center(center) {this.flyTo({center})}

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
			this.animate(this._animationQueue)
			//this.easeTo(this._animationQueue)
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

	//////////////////////////////////////////////////////////////////////
	// CLEAN CUSTOM API //////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////

	_transformArgsToMapOptions(args) {
		var [mapOptions, arg] = args.reverse()
		if (Array.isArray(mapOptions) || isGeoJson(mapOptions)) {
			arg = mapOptions
			mapOptions = {}
		}
		if (arg) {
			if (isBbox(arg)) {
				mapOptions.bounds = arg
			} else if (isCoord(arg)) {
				mapOptions.center = arg
			} else if (isCoords(arg)) {
				mapOptions.bounds = coordsToBbox(arg)
			} else if (isGeoJson(arg)) {
				// TODO: handle feature collection
				if (arg.geometry.type === 'Point')
					mapOptions.center = arg.geometry.coordinates
				else if (arg.geometry.coordinates)
					mapOptions.bounds = coordsToBbox(arg.geometry.coordinates)
				else
					mapOptions.bounds = turf.bbox(arg) // warning: turf
			}
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

	// multipurpose, accepts anything:
	// bbox, (center, zoom), bearing, pitch, duration
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
		return promiseTimeout(mapOptions.duration)
	}

	// TODO: one function to rule them all
	fit(...args) {
		if (this.isReady) {
			return this.animate(...args)
		} else {
			this.jump(...args)
			return this.ready
		}
	}

}

extend(Map, MapExtension)