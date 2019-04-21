import {isGeoJson, createRandomId, EventEmitter, featuresMap} from './util.js'


function isSource(obj) {
	return obj
		&& obj.id
		&& obj.type === 'geojson'
}

export class CompoundItem extends EventEmitter {
	
	// cached values like bbox. resets by updating coords and data
	_cached = {}

	constructor(args) {
		super()

		this.id = createRandomId()

		if (isSource(args[0]))
			this.source = args.shift()
		if (isGeoJson(args[0]))
			this._createSourceOptions(args.shift())
		else if (Array.isArray(args[0]))
			this._createSourceOptions(this._wrapInGeoJson(args.shift()))
		else
			this._createSourceOptions(this._createDummy())

		this.options = {paint: {}, layout: {}}
		if (typeof args[args.length - 1] === 'object')
			this._handleOptionsObject(args.pop())
		if (this._createOptionsFromArgs && args.length > 0)
			this._handleOptionsObject(this._createOptionsFromArgs(...args))

		this.onPointDragStart = this.onPointDragStart.bind(this)
		this.onPointDragMove = this.onPointDragMove.bind(this)
		this.onPointDragEnd = this.onPointDragEnd.bind(this)
	}

	_createSourceOptions(data) {
		this.sourceOptions = {data, type: 'geojson'}
	}

	// TODO: detect paint/layout with the new static arrays
	_handleOptionsObject(object) {
		if (object.paint || object.layout)
			Object.assign(this.options, object)
		else
			this._parseOptionsObject(object)
	}

	_parseOptionsObject(object) {
		let Class = this.constructor
		for (let [prop, value] of Object.entries(object)) {
			if (Class.paint.includes(prop)) {
				this.options.paint[prop] = value
			} else if (Class.layout.includes(prop)) {
				this.options.layout[prop] = value
			} else if (Class.paintKeys.includes(prop)) {
				let index = Class.paintKeys.indexOf(prop)
				prop = Class.paint[index]
				this.options.paint[prop] = value
			} else if (Class.layoutKeys.includes(prop)) {
				let index = Class.layoutKeys.indexOf(prop)
				prop = Class.layout[index]
				this.options.layout[prop] = value
			}
		}
	}

	// NOTE: this is not part of constructor, because we're tapping into instance
	// properties created by classes inheriting from this one. Their data is not
	// available to use here during instationation.
	_ensureLayerOptions() {
		if (this.optionsReady) return
		this.optionsReady = true

		var Class = this.constructor
		var paintProps  = Class.paint  || []
		var layoutProps = Class.layout || []

		this.layerOptions = Object.assign(this.layerOptions || {}, {
			id: this.id,
			source: this.id,
			type: Class.type,
		})

		this.layerOptions.layout = Object.assign({}, this.layout, this.layerOptions.layout, this.options.layout)
		this.layerOptions.paint  = Object.assign({}, this.paint,  this.layerOptions.paint,  this.options.paint)

		for (let [key, value] of Object.entries(this.options)) {
			// transform current value
			if (value === undefined || value === null) continue
			if (layoutProps[key]) {
				var prop = layoutProps[key]
				this.layerOptions.layout[prop] = value
			} else if (paintProps[key]) {
				var prop = paintProps[key]
				this.layerOptions.paint[prop] = value
			}
		}

		if (this._processOptions)
			this._processOptions()
	}

	addTo(map) {
		this._ensureLayerOptions()

		this.map = map

		if (this.source) {
			this.layerOptions.source = this.source.id
		} else {
			this.map.addSource(this.id, this.sourceOptions)
			this.source = this.map.getSource(this.id)
		}

		this.map.addLayer(this.layerOptions)
		this.layer = this.map.getLayer(this.id)

		//featuresMap.set(this.source, this)
		featuresMap.set(this.layer, this)

		return this
	}

	render(data = this.data) {
		this.data = data
	}

	update() {
		this.render()
	}

	remove() {
		this.map.removeLayer(this.id)
		this.map.removeSource(this.id)
		this.draggable = false
	}

	async fadeIn(duration = 240) {
		var opacityProp = this.constructor.paint.opacity
		var transitionProp = opacityProp + '-transition'
		this.map.setPaintProperty(this.id, transitionProp, {duration: 0})
		this.map.setPaintProperty(this.id, opacityProp, 0)
		await Promise.timeout()
		this.map.setPaintProperty(this.id, transitionProp, {duration})
		this.map.setPaintProperty(this.id, opacityProp, 1)
		return Promise.timeout(duration)
	}

	async fadeOut(duration = 240) {
		var opacityProp = this.constructor.paint.opacity
		var transitionProp = opacityProp + '-transition'
		this.map.setPaintProperty(this.id, transitionProp, {duration: 0})
		this.map.setPaintProperty(this.id, opacityProp, 1)
		await Promise.timeout()
		this.map.setPaintProperty(this.id, transitionProp, {duration})
		this.map.setPaintProperty(this.id, opacityProp, 0)
		return Promise.timeout(duration)
	}

	// GEOJSON mimic

	get properties() {
		return this.data.properties
	}
	set properties(newData) {
		this.data.properties = newData
	}

	get geometry() {
		return this.data.geometry
	}
	set geometry(newData) {
		this.data.geometry = newData
		this.render()
	}

	toJSON() {
		return JSON.stringify(this.data)
	}

	// GEOJSON sugar

	get data() {
		return this.source._data
		//return this.data.source.serialize()
	}
	set data(data) {
		this._cached = {}
		if (!data)
			data = this._createDummy()
		else
			data = this._wrapInGeoJson(data)
		this.source.setData(data)
	}

	get coords() {
		return this.data
			&& this.data.geometry
			&& this.data.geometry.coordinates
	}
	set coords(coords) {
		this._cached = {}
		if (!coords) {
			this.data = undefined
		} else if (this.empty) {
			this.data = turf.lineString(coords)
		} else {
			this.data.geometry.coordinates = coords
			this.render()
		}
	}

	get empty() {
		return this.data.type === 'FeatureCollection'
	}

	get name() {
		return this.data.properties.name
	}
	set name(newData) {
		this.data.properties.name = newData
	}

	get description() {
		return this.data.properties.description
	}
	set description(newData) {
		this.data.properties.description = newData
	}

	// VISIBILITY

	// map.isHidden()

	get visible() {
		return this.layer.getLayoutProperty('visibility') === 'visible'
	}
	set visible(value) {
		if (value === true) value = 'visible'
		if (value === false) value = 'none'
		return this.map.setLayoutProperty(this.id, 'visibility', value)
	}

	get hidden() {return !this.visible}
	set hidden(value) {this.visible = !value}

	show() {
		this.visible = true
	}

	hide() {
		this.visible = false
	}

	// EVENTS ////////////////////////////////////////

	// We want simple mouse/touch event to propagate down to our component
	// but keep the custom events created locally away from mixing up with
	// similarly names events from the map.
	localEvents = ['dragstart', 'drag', 'dragend']

	on(name, handler) {
		if (this.localEvents.includes(name))
			this._on(name, handler)
		else
			return this.map.on(name, this.id, handler)
	}
	off(name, handler) {
		if (this.localEvents.includes(name))
			this._off(name, handler)
		else
			return this.map.off(name, this.id, handler)
	}
	once(name, handler) {
		if (this.localEvents.includes(name))
			this._once(name, handler)
		else
			return this.map.once(name, this.id, handler)
	}

	// DRAGGABLE ////////////////////////////////////////

	get draggable() {
		return !!this._draggable
	}
	set draggable(value) {
		if (this._draggable === value) return
		this._draggable = value
		if (value) {
			this.map.on('mousedown',  this.id, this.onPointDragStart)
			this.map.on('touchstart', this.id, this.onPointDragStart)
		} else {
			this.map.off('mousedown',  this.id, this.onPointDragStart)
			this.map.off('touchstart', this.id, this.onPointDragStart)
		}
	}

	onPointDragStart(e) {
		// giving time to pointer and other more important touchpoints to react to the event
		//await Promise.timeout()
		if (e.defaultPrevented) return
		// Pinch to zoom gets caught by the touch events of the line sometimes, even though both touch points are outside of the line.
		// Ignore these multipoint events. 'points' property only appears on touch* events, not on mouse* events.
		if (e.points && e.points.length > 1) return
		e.preventDefault()
		this.map.on('mousemove', this.onPointDragMove)
		this.map.on('touchmove', this.onPointDragMove)
		this.map.once('mouseup', this.onPointDragEnd)
		this.map.once('touchend', this.onPointDragEnd)
		this.emit('dragstart', createEventData(e))
	}

	onPointDragMove(e) {
		e.preventDefault()
		this.emit('drag', createEventData(e))
	}

	onPointDragEnd(e) {
		e.preventDefault()
		this.map.off('mousemove', this.onPointDragMove)
		this.map.off('touchmove', this.onPointDragMove)
		this.map.off('mouseup', this.onPointDragEnd)
		this.map.off('touchend', this.onPointDragEnd)
		this.emit('dragend', createEventData(e))
	}
/*
	get source() {
		return this._source
	}

	set source(newSource) {
		if (typeof newSource === 'string')
			this._source = this.map.getSource(newSource)
		else
			this._source = newSource
	}

	changeSource(layerId, source, sourceLayer) {
		const oldLayers = map.getStyle().layers
		const layerIndex = oldLayers.findIndex(l => l.id === layerId)
		const layerDef = oldLayers[layerIndex]
		const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id
		layerDef.source = source
		if (sourceLayer)
			layerDef['source-layer'] = sourceLayer
		map.removeLayer(layerId)
		map.addLayer(layerDef, before)
	}
*/
}

function createEventData(e) {
	return {
		lngLat: e.lngLat,
		coords: e.lngLat.toArray(),
	}
}

CompoundItem.prototype._on   = EventEmitter.prototype.on
CompoundItem.prototype._off  = EventEmitter.prototype.off
CompoundItem.prototype._once = EventEmitter.prototype.once