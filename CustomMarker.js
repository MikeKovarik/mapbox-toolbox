import ViewportChecker from './ViewportChecker.js'
var {Evented, LngLat, Point} = mapboxgl


export class SimpleMarker extends Evented {

	constructor(node, ...args) {
		super()

		this._updatePos = this._updatePos.bind(this)
		this._updatePosRound = this._updatePosRound.bind(this)

		if (typeof node === 'string')
			this.node = domNodeFromString(node)
		else
			this.node = node

		this.container = document.createElement('div')
		this.container.append(this.node)
		// needed to remove 4px inline spaces
		this.container.style.display = 'flex'
		this.container.classList.add('mapboxgl-marker')

		let options = this._processOptions(args)
		if (options.coords)
			this._lngLat = LngLat.convert(options.coords)
		else if (options.x !== undefined && options.y !== undefined)
			this.move(options.x, options.y, true)
		if (options.map) this.addTo(options.map)
		this.dragging = false
	}

	_processOptions(args) {
		let coords
		let map
		let options = {}
		for (let arg of args) {
			if (arg instanceof mapboxgl.Map)
				map = arg
			else if (Array.isArray(arg))
				coords = arg
			else
				options = arg
		}
		options.coords = options.coords || coords
		options.map = options.map || map
		return options
	}

	addTo(map) {
		this.remove()
		this._map = map
		this._map.getCanvasContainer().appendChild(this.container)
		this._map.on('move', this._updatePos)
		this._map.on('moveend', this._updatePosRound)

		this.draggable = this.draggable
		if (this._lngLat) this._updatePosRound()

		this.container.addEventListener('click', this._onClick)
		return this
	}

	remove() {
		if (this._map) {
			this._map.off('move', this._updatePos)
			this._map.off('moveend', this._updatePosRound)
			delete this._map
		}
		this.container.removeEventListener('click', this._onClick)
		this.container.remove()
		return this
	}

	// RENDERING

	get coords() {
		if (this._lngLat === undefined)
			return this._map.unproject(this._pos).toArray()
		else
			return this._lngLat.toArray()
	}

	set coords(coords) {
		this._lngLat = LngLat.convert(coords)
		this._updatePosRound()
	}

	get position() {
		if (this._pos === undefined) {
			this._pos = this._map.project(this._lngLat).round()
		}
		return this._pos
	}

	get positionArray() {
		let {x, y} = this.position
		return [x, y]
	}

	get x() {
		return this.position.x
	}

	set x(x) {
		// TODO
	}

	get y() {
		return this.position.y
	}

	set y(y) {
		// TODO
	}

	_updatePos() {
		this._pos = this._map.project(this._lngLat)
		this._renderPos()
	}

	_updatePosRound() {
		this._pos = this._map.project(this._lngLat).round()
		this._renderPos()
	}

	_renderPos = () => {
		this.rafPending = false
		this.container.style.transform = this.transform
		if (this.debug) {
			let {x, y} = this._pos
			this.node.innerText = `${Math.round(x)} ${Math.round(y)}`
		}
	}

	get transform() {
		return `translate(-50%, -50%) translate(${this._pos.x}px, ${this._pos.y}px)`
	}

	_onClick = e => {
		// prevent click from bubbling up to map
		prevent(e)
		this.emit('click', e)
	}

	// MANIPULATION

	get draggable() {
		return this._draggable
	}

	set draggable(shouldBeDraggable) {
		if (this._draggable === !!shouldBeDraggable) return
		this._draggable = !!shouldBeDraggable
		if (!this._map) return
		if (this._draggable) {
			this.container.addEventListener('pointerdown', this._onPointerDown)
			// Pointer Events are now available everywhere, but chrome still files touch events afterwards
			// and we need to prevent it, othewise map begins panning.
			this.container.addEventListener('touchstart', prevent)
		} else {
			this.container.removeEventListener('pointerdown', this._onPointerDown)
			this.container.removeEventListener('touchstart', prevent)
		}
	}

	_onPointerDown = e => {
		// prevent events from reaching map (map would pan)
		prevent(e)
		// calculate diff between cursor position and marker center/anchor
		this._nodeCenterDelta = (new Point(e.x, e.y)).sub(this._pos)
		// remove internal lnglat because it won't be kept up to date while dragging.
		this._lngLat = undefined
		// start listening on global events because we'd loose the node when dragging it
		document.addEventListener('pointermove', this._onPointerMove)
		document.addEventListener('pointerup', this._onPointerUp)
	}

	_onPointerUp = e => {
		// prevent events from reaching map
		prevent(e)
		// convert current pixel position back to geo coordinates
		this.coords = this._map.unproject(this._pos)
		// emit user facing events and fix internal state
		if (this.dragging) {
			this.dragging = false
			this.emit('dragend')
			// prevent rogue click event which happpens after mouseup/pointerup.
			// it happpens because its triggered on container, but we're listening on document)
			let target = document.body
			//let target = this.container
			target.addEventListener('click', prevent, {capture: true, once: true})
			setTimeout(() => target.removeEventListener('click', prevent, {capture: true}))
		}
		document.removeEventListener('pointermove', this._onPointerMove)
		document.removeEventListener('pointerup', this._onPointerUp)
	}

	_onPointerMove = e => {
		// prevent events from reaching map
		prevent(e)
		// store current cursor position, shifted by a few pixels off markers center
		this._pos = (new Point(e.x, e.y)).sub(this._nodeCenterDelta)
		// request rendering in next animation frame (ensures 60fps)
		if (!this.rafPending) {
			this.rafPending = true
			requestAnimationFrame(this._renderPos)
		}
		// trigger user facing events
		if (this.dragging) {
			this.emit('drag')
		} else {
			this.dragging = true
			this.emit('dragstart')
		}
	}

	move(x, y, forceRender = false) {
		this._pos = new Point(x, y)
		if (forceRender) {
			this._renderPos()
		} else if (!this.rafPending) {
			this.rafPending = true
			requestAnimationFrame(this._renderPos)
		}
	}

	// EVENTS ////////////////////////////////////////

	static _internalEvents = ['click', 'drag', 'dragstart', 'dragend']

	on(name, listener) {
		if (this.constructor._internalEvents.includes(name))
			this._on(name, listener)
		else
			this.node.addEventListener(name, listener)
	}

	once(name, listener) {
		if (this.constructor._internalEvents.includes(name))
			this._once(name, listener)
		else
			this.node.addEventListener(name, listener, {once: true})
	}

	off(name, listener) {
		if (this.constructor._internalEvents.includes(name))
			this._off(name, listener)
		else
			this.node.removeEventListener(name, listener)
	}

	// VISIBILITY

	show() {
		//this.container.style.transform = this.transform + ' scale(0)'
		this.node.style.transition = 'transform 180ms'
		this.node.style.transform = 'scale(1)'
	}

	hide() {
		//this.container.style.transform = this.transform + ' scale(1)'
		this.node.style.transition = 'transform 180ms'
		this.node.style.transform = 'scale(0)'
	}

}


export class ViewportedMarker extends SimpleMarker {

	viewported = true

	addTo(map) {
		if (!map._viewport) map._viewport = new ViewportChecker(map, 20)
		this._viewport = map._viewport
		super.addTo(map)
		return this
	}

	_viewportVisibilityToggle() {
		// allow to short circuit the viewport visibility check
		// note: do not shorten false equality to exclamation mark. the property is undefined
		// at the time of first call becase of class inheritance.
		if (this.viewported === false) return true
		if (this._lngLat === undefined)
			this.inViewport = false
		else
			this.inViewport = this._viewport.isInside(this._lngLat.toArray())
		if (this.wasInViewport && !this.inViewport) {
			this.wasInViewport = false
			this.container.style.display = 'none'
		} else if (!this.wasInViewport && this.inViewport) {
			this.wasInViewport = true
			this.container.style.display = 'flex'
		}
		if (!this.inViewport) {
			this._pos = undefined
		}
		return this.inViewport
	}

	_updatePos() {
		if (!this._viewportVisibilityToggle()) return
		super._updatePos()
	}

	_updatePosRound() {
		if (!this._viewportVisibilityToggle()) return
		super._updatePosRound()
	}

}


SimpleMarker.prototype._on    = Evented.prototype.on
SimpleMarker.prototype._off   = Evented.prototype.off
SimpleMarker.prototype._once  = Evented.prototype.once
SimpleMarker.prototype._emit  = Evented.prototype.emit
SimpleMarker.prototype._addTo = Evented.prototype.addTo

function prevent(e) {
	e.preventDefault()
	e.stopPropagation()
}

function domNodeFromString(string) {
	return document.createRange()
		.createContextualFragment(string)
		.firstElementChild
}