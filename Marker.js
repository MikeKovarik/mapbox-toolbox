import {extend} from './util.js'


export var Marker = mapboxgl.Marker

var _on = Marker.prototype.on
var _emit = Marker.prototype.emit

class MarkerExtension {

	get node() {
		return this._node || (this._node = this.getElement().firstElementChild)
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
		return this.node.style.transform = Number(scale.match(/[\d\.]+/g))
	}
	set scale(scale) {
		this.node.style.transform = `scale(${scale})`
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
	set coords(newData) {
		this.setLngLat(turf.getCoord(newData))
	}

	get draggable() {
		return this.isDraggable()
	}
	set draggable(newData) {
		this.setDraggable(newData)
	}

	// VISIBILITY

	get visible() {
		return this.node.style.display === 'none'
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
extend(Marker, MarkerExtension)