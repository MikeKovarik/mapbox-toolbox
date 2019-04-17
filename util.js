var {Evented} = mapboxgl
Evented.prototype.emit = Evented.prototype.fire
Evented.prototype.removeAllListeners = function() {
	for (let [name, listeners] of Object.entries(options._listeners))
		for (let listener of listeners)
			this.off(name, listener)
}
export var EventEmitter = Evented

export var featuresMap = new WeakMap

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


export var colors = {
	default: document.querySelector('meta[name="theme-color"]').content || '#16a6df',
	blue: '#16a6df',
	pink: '#df16a6',
	green: '#7dc02f',
	red: 'rgb(174, 0, 32)'
}

export function mapColor(nameOrHex, fallback = nameOrHex) {
	return colors[nameOrHex] || fallback
}

// paint['line-dasharray'] = [2, 1]
export const SOLID = undefined
//export const DOTTED = [1, 1]
export const DOTTED = [0.8, 0.8]
export const DASHED = [2, 1]

export function getColor(arg) {
	return mapColor(arg) || colors.default
}

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