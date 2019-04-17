import {extend, createRandomId} from './util.js'


var {Map} = mapboxgl

class MapExtension {

	addGeoJson(data) {
		var id = createRandomId()
		this.addSource(id, {type: 'geojson', data})
		return this.getSource(id)
	}

	get allLayers() {
		var styleObject = this.getStyle()
		return styleObject && styleObject.layers || []
	}

	get layers() {
		return this.allLayers
			.filter(l => l.source !== 'composite')
			.filter(l => l.type !== 'background')
			.map(l => this.getLayer(l.id))
	}

	get allSources() {
		return Object.keys(this.getStyle().sources)
			.map(id => this.getSource(id))
	}

	get sources() {
		return this.allSources
			.filter(feature => feature.id !== 'composite')
	}

	get renderedFeatures() {
		var ids = []
		var options = {
			layers: this.layers.map(l => l.id)
		}
		return this.queryRenderedFeatures(options)
			//.filter(fd => fd.source !== 'composite')
			.filter(fd => {
				var {id} = fd.properties
				if (!ids.includes(id)) {
					ids.push(id)
					return true
				}
				return false
			})
			.map(fd => {
				var {id} = fd.properties
				var source = map.getSource(fd.source)
				return source._data.features.find(f => f.properties.id === id)
			})
	}

	get renderedSources() {
		var ids = this.renderedFeatures.map(feature => feature.source)
		ids = [...new Set(ids)]
		return ids.map(id => this.getSource(id))
	}

	get lines() {
		return this.features.filter(feature => feature.constructor.name === 'Line')
	}

	get points() {
		return this.features.filter(feature => feature.constructor.name === 'Point')
	}

	get cursor() {return this.canvas.style.cursor}
	set cursor(cursor) {this.canvas.style.cursor = cursor}

	get zoom() {return this.getZoom()}
	set zoom(zoom) {this.easeTo({zoom})}

	get bearing() {return this.getBearing()}
	set bearing(bearing) {this.easeTo({bearing})}

	get pitch() {return this.getPitch()}
	set pitch(pitch) {this.easeTo({pitch})}

	get rotation() {return this.bearing}
	set rotation(bearing) {this.bearing = bearing}

	get tilt() {return this.pitch}
	set tilt(pitch) {this.pitch = pitch}

	get center() {return this.getCenter().toArray()}
	set center(center) {this.flyTo({center})}

	get bounds() {return this.getBounds().toArray().flat()}
	set bounds(bounds) {
		console.warn('not implemented')
	}
	get bbox() {return this.bounds}
	set bbox(bbox) {this.bounds = bbox}

	get canvas() {
		if (this.__canvas) return this.__canvas
		return this.__canvas = this.getCanvas()
	}

}

extend(Map, MapExtension)