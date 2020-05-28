class MapExtension {

	getGestureState() {
		return {
			dragRotate: this.dragRotate.isEnabled(),
			touchPitch: this.touchPitch.isEnabled(),
			touchZoomRotate: this.touchZoomRotate.isEnabled(),
		}
	}

	setGesturesState(options) {
		this.dragRotate[options.dragRotate ? 'enable' : 'disable']()
		this.touchPitch[options.touchPitch ? 'enable' : 'disable']()
		this.touchZoomRotate[options.touchZoomRotate ? 'enable' : 'disable']()
	}

	cacheGestures() {
		this._previousGestureState = this.getGestureState()
	}

	restoreGestures() {
		this.setGesturesState(this._previousGestureState)
	}

	disableGestures() {
		this.setGesturesState({
			dragRotate: false,
			touchZoomRotate: false,
			touchPitch: false,
		})
	}

}

extend(mapboxgl.Map, MapExtension)