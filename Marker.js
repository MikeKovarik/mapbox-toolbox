import {extend} from './util.js'


export var Marker = mapboxgl.Marker

class MarkerExtension {

	addTo(map) {
		this.added = true
		this._addTo(map)
	}

	// _node is custom, _element is Mapbox thing
	get container() {
		return this._element
	}
	get node() {
		return this._node || this._element
	}
	// setter is good for containarized nodes (images) with custom transform behavior
	set node(node) {
		this._node = node
	}

	get color() {
		return this.node.style.backgroundColor
	}
	set color(color) {
		this.node.style.backgroundColor = color
	}

	get size() {
		return parseInt(this.node.style.width)
	}
	set size(size) {
		this.node.style.width  = `${size}px`
		this.node.style.height = `${size}px`
	}

	get scale() {
		let match = this.node.style.transform.match(/scale\((.*?)\)/)
		if (match) return Number(match[1])
		return 1
	}
	set scale(scale) {
		let {transform} = this.node.style
		if (transform.includes('scale'))
			this.node.style.transform = transform.replace(/scale\(.*?\)/, `scale(${scale})`)
		else
			this.node.style.transform += ` scale(${scale})`
	}

	get zIndex() {
		return this.container.style.zIndex
	}
	set zIndex(zIndex) {
		this.container.style.zIndex = zIndex
	}

	get data() {
		return turf.point(this.coords)
	}
	set data(newData) {
		this.coords = newData.geometry.coords
		// TODO
	}

	get coords() {
		return this.getLngLat().toArray()
	}
	set coords(arg) {
		if (!arg) return
		if (arg.lat && (arg.lon || arg.lng))
			this.setLngLat(arg)
		else
			this.setLngLat(turf.getCoord(arg))
		if (this.added === undefined) this.addTo(this.map)
	}

	get draggable() {
		return this.isDraggable()
	}
	set draggable(newData) {
		this.setDraggable(newData)
	}

	// VISIBILITY

	get visible() {
		return this.node.style.display !== 'none'
	}
	set visible(value) {
		this.node.style.display = value ? '' : 'none'
	}

	get hidden() {return !this.visibility}
	set hidden(value) {this.visibility = !value}

	show() {
		this.visible = true
	}

	hide() {
		this.visible = false
	}

	// EVENTS ////////////////////////////////////////

	static nodeEvents = ['click', 'pointerdown', 'pointerup', 'pointerover', 'pointerout']

	on(name, listener) {
		if (this.constructor.nodeEvents.includes(name))
			this.node.addEventListener(name, listener)
		else
			this._on(name, listener)
	}

	once(name, listener) {
		if (this.constructor.nodeEvents.includes(name))
			this.node.addEventListener(name, listener, {once: true})
		else
			this._once(name, listener)
	}

	off(name, listener) {
		if (this.constructor.nodeEvents.includes(name))
			this.node.removeEventListener(name, listener)
		else
			this._off(name, listener)
	}

}

Marker.prototype._on = Marker.prototype.on
Marker.prototype._once = Marker.prototype.once
Marker.prototype._emit = Marker.prototype.emit
Marker.prototype._addTo = Marker.prototype.addTo
extend(mapboxgl.Marker, MarkerExtension)