var {Evented} = mapboxgl
Evented.prototype.emit = Evented.prototype.fire
Evented.prototype.removeAllListeners = function() {
	for (let [name, listeners] of Object.entries(options._listeners))
		for (let listener of listeners)
			this.off(name, listener)
}
Evented.prototype._once = Evented.prototype.once
Evented.prototype.once = function(name, listener) {
	if (listener === undefined)
		return new Promise(resolve => this._once(name, resolve))
	else
		this._once(name, listener)
}
export var EventEmitter = Evented

export var featuresMap = new WeakMap

export var promiseTimeout = millis => new Promise(resolve => setTimeout(resolve, millis))

export function isGeoJson(arg) {
	return arg
		&& arg.type
		&& ((arg.geometry && arg.geometry.type && arg.geometry.coordinates) || arg.features)
}

export function isCoord(arg) {
	return Array.isArray(arg)
		&& arg.length === 2
		&& typeof arg[0] === 'number'
		&& typeof arg[1] === 'number'
}

export function isCoords(arg) {
	return Array.isArray(arg)
		&& isCoord(arg[0])
}

export function isBbox(arg) {
	return Array.isArray(arg)
		&& (isFlatBbox(arg) || isNestedBbox(arg))
}

export function coordsToBbox(coords) {
	let bounds = new mapboxgl.LngLatBounds(coords[0], coords[0])
	for (let coord of coords)
		bounds.extend(coord)
	return bounds
}

function isFlatBbox(arr) {
	return arr.length === 4
		&& typeof arr[0] === 'number'
}

function isNestedBbox(arr) {
	return arr.length === 2
		&& arr[0].length === 2
		&& arr[1].length === 2
		//&& typeof arr[0] === 'number'
}

export function createRandomId() {
	return String(new Date().getTime()) + Math.random().toString().slice(2)
}

export function createRandomId2() {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
}


// paint['line-dasharray'] = [2, 1]
export const SOLID = undefined
export const DOTTED = [0.8, 0.8]
export const DASHED = [2, 1]

export function getStyle(arg) {
	switch (arg) {
		case 'dashed': return DASHED
		case 'dotted': return DOTTED
		default:       return arg
	}
}

export function extend(Target, Source) {
	var staticDesc = Object.getOwnPropertyDescriptors(Source)
	delete staticDesc.name
	delete staticDesc.length
	delete staticDesc.prototype
	var protoDesc = Object.getOwnPropertyDescriptors(Source.prototype)
	delete protoDesc.constructor
	Object.defineProperties(Target, staticDesc)
	Object.defineProperties(Target.prototype, protoDesc)
}


export function createGetters(Class) {
	//var descriptors = Object.getOwnPropertyDescriptors(Class.prototype)
	var descriptors = {}
	if (Class.paint) {
		Class.paintKeys = Class.paint.map(sliceFirstSection)
		Class.paint.forEach((prop, index) => {
			createPaintGetSet(prop, Class.paintKeys[index])
			createPaintGetSet(prop, prop)
		})
		function createPaintGetSet(prop, key) {
			descriptors[key] = {
				get() {return this.layer.getPaintProperty(prop)},
				set(value) {this.map.setPaintProperty(this.id, prop, value)}
			}
		}
	}
	if (Class.layout) {
		Class.layoutKeys = Class.layout.map(sliceFirstSection)
		Class.layout.forEach((prop, index) => {
			createLayoutGetSet(prop, Class.layoutKeys[index])
			createLayoutGetSet(prop, prop)
		})
		function createLayoutGetSet(prop, key) {
			descriptors[key] = {
				get() {return this.layer.getLayoutProperty(prop)},
				set(value) {this.map.setLayoutProperty(this.id, prop, value)}
			}
		}
	}
	Object.defineProperties(Class.prototype, descriptors)
}

function sliceFirstSection(prop) {
	return prop.slice(prop.indexOf('-') + 1)
}