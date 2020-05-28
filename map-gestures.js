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

	cacheGestures() {
		this._previousGestureState = this.getGestureState()
	}

	restoreGestures() {
		this.setGesturesState(this._previousGestureState)
	}

	disableGestures(cache = false) {
		if (cache) this.cacheGestures()
		let state = {}
		for (let key of gestureKeys) state[key] = false
		this.setGesturesState(state)
	}

}

extend(mapboxgl.Map, MapExtension)