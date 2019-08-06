var {Evented, LngLat, Point} = mapboxgl


export class CustomMarker extends Evented {

	constructor(node, coords, map) {
		super()

		if (typeof node === 'string')
			node = domNodeFromString(node)
		this.node = node

		this.container = document.createElement('div')
		this.container.append(this.node)
		// needed to remove 4px inline spaces
		this.container.style.display = 'flex'
		this.container.classList.add('mapboxgl-marker')

		if (coords) this._lngLat = LngLat.convert(coords)

		if (map) this.addTo(map)

		this._draggable = options && options.draggable || false
		this.dragging = false
	}

	addTo(map) {
		this.remove()
		this._map = map
		map.getCanvasContainer().appendChild(this.container)
		map.on('move', this._updatePos)
		map.on('moveend', this._updatePosRound)

		this.draggable = this.draggable
		this._updatePosRound()

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

	get draggable() {
		return this._draggable
	}

	set draggable(shouldBeDraggable) {
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
			this.container.addEventListener('click', prevent, {capture: true, once: true})
			setTimeout(() => this.container.removeEventListener('click', prevent, {capture: true}))
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

	_updatePos = () => {
		this._pos = this._map.project(this._lngLat)
		this._renderPos()
	}

	_updatePosRound = () => {
		this._pos = this._map.project(this._lngLat)
		this._pos = this._pos.round()
		this._renderPos()
	}

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

	_renderPos = () => {
		this.rafPending = false
		this.container.style.transform = `translate(-50%, -50%) translate(${this._pos.x}px, ${this._pos.y}px)`
	}

	_onClick = e => {
		// prevent click from bubbling up to map
		prevent(e)
		this.emit('click', e)
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

}


CustomMarker.prototype._on    = Evented.prototype.on
CustomMarker.prototype._off   = Evented.prototype.off
CustomMarker.prototype._once  = Evented.prototype.once
CustomMarker.prototype._emit  = Evented.prototype.emit
CustomMarker.prototype._addTo = Evented.prototype.addTo

function prevent(e) {
	e.preventDefault()
	e.stopPropagation()
}

function domNodeFromString(string) {
	return document.createRange()
		.createContextualFragment(string)
		.firstElementChild
}