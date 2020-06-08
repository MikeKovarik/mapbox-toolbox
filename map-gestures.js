import {extend} from './util.js'


const gestureKeys = ['scrollZoom', 'boxZoom', 'dragRotate', 'dragPan', 'keyboard', 'doubleClickZoom', 'touchZoomRotate']

class MapExtension {

	getGestureState() {
		let state = {}
		for (let key of gestureKeys)
			state[key] = this[key].isEnabled()
		return state
	}

	setGesturesState(state) {
		for (let key of gestureKeys) {
			let value = state[key]
			if (value !== undefined) {
				let method = value ? 'enable' : 'disable'
				this[key][method]()
			}
		}
	}

	_ensureGestureCounter() {
		if (this._gestureCacheCounter === undefined)
			this._gestureCacheCounter = 0
	}

	disableGestures(force = false) {
		// WARNING: disable may be called multiple times before restoring.
		// for example (in multitouch with every finger's touchstart).
		// This keeps track of how many times disable was called.
		// Only disable and create snapshot on the first disable.
		if (force) {
			// only disable
			this._previousGestureState = undefined
			this._gestureCacheCounter = 0
			this._disableGestures()
		} else {
			this._ensureGestureCounter()
			// warning: do not change the incrementation from prefix to suffix!
			if (++this._gestureCacheCounter == 1) {
				// cache and disable
				this._previousGestureState = this.getGestureState()
				this._disableGestures()
			}
		}
	}

	restoreGestures() {
		this._ensureGestureCounter()
		if (--this._gestureCacheCounter === 0) {
			this.setGesturesState(this._previousGestureState)
		}
	}

	_disableGestures() {
		let state = {}
		for (let key of gestureKeys) state[key] = false
		this.setGesturesState(state)
	}

}

extend(mapboxgl.Map, MapExtension)