import {extend, createRandomId, isGeoJson} from './util.js'


class MapExtension {

	// creates empty geojson source. empty feature collection by default. should be replaced by user
	// If data is specified, it should be geojson.
	// If user inserts array of coords we're not sure if it should be linestring or feature collection of points
	// use lineSource or pointSource instead
	createSource(data) {
		let source = this.addGeoJson()
		if (data) {
			if (isGeoJson(data))
				source.setData(data)
			else
				console.warn('createSource() expects geojson')
		}
		return source
	}

	lineSource(data) {
		if (!isGeoJson(data))
			data = turf.lineString(data)
		return this.addGeoJson(data)
	}

	pointSource(data) {
		if (!isGeoJson(data))
			data = turf.lineString(data.map(coord => turf.point(coord)))
		return this.addGeoJson(data)
	}

	addGeoJson(data) {
		var id = createRandomId()
		if (data === undefined)
			data = {type: 'FeatureCollection', features: []}
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
		console.log('options', options)
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
				console.log('id', id)
				console.log('source._data', source._data)
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

	get bbox() {return this.getBounds().toArray().flat()}

	get canvas() {
		if (this.__canvas) return this.__canvas
		return this.__canvas = this.getCanvas()
	}

}

extend(mapboxgl.Map, MapExtension)