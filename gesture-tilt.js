import {extend, createRandomId} from './util.js'


// inspired by https://github.com/mapbox/mapbox-gl-js/blob/f705fd2a4ddd8a33a13c6af048212d0f697d5c59/src/ui/handler/dblclick_zoom.js

class DragTiltHandler {

	constructor(map) {
		this.map = map
	}

	isEnabled() {
		return this._enabled
	}

	enable() {
		if (this.isEnabled()) return
		this._enabled = true
		this.map.on('touchstart', this.onTouchStart)
		this.map.on('touchmove', this.onTouchMove)
		this.map.on('touchend', this.onTouchEnd)
		this.map.on('touchcancel', this.onTouchEnd)
	}

	disable() {
		if (!this.isEnabled()) return
		this._enabled = false
		this.map.off('touchstart', this.onTouchStart)
		this.map.off('touchmove', this.onTouchMove)
		this.map.off('touchend', this.onTouchEnd)
		this.map.off('touchcancel', this.onTouchEnd)
	}

	onTouchStart = e => {
		if (e.points.length !== 2) return
		const diffY = Math.abs(e.points[0].y - e.points[1].y)
		const diffX = Math.abs(e.points[0].x - e.points[1].x)
		if (diffY > 40) return
		if (diffX > 150) return
		// prevent browser refresh on pull down
		e.originalEvent.preventDefault()
		// disable native touch controls
		this.touchZoomRotateWasEnabled = this.map.touchZoomRotate.isEnabled()
		this.dragPanWasEnabled = this.map.dragPan.isEnabled()
		if (this.touchZoomRotateWasEnabled)
			this.map.touchZoomRotate.disable()
		if (this.dragPanWasEnabled)
			this.map.dragPan.disable()
		this.point = e.point
		this.pitch = this.map.getPitch()
	}

	onTouchMove = e => {
		if (!this.point) return
		e.preventDefault()
		e.originalEvent.preventDefault()
		var diff = (this.point.y - e.point.y) * 0.5
		this.map.setPitch(this.pitch + diff)
	}

	onTouchEnd = e => {
		if (!this.point) return
		if (this.touchZoomRotateWasEnabled)
			this.map.touchZoomRotate.enable()
		if (this.dragPanWasEnabled)
			this.map.dragPan.enable()
		this.point = undefined
	}

}

export default function init(map) {
	map.dragTilt = new DragTiltHandler(map)
	map.dragTilt.enable()
}