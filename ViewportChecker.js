export class ViewportChecker {

	constructor(map, offset = 0) {
		this.map = map
		this.offset = offset
		map.on('move', this.recalculate)
		map.once('remove', this.destroy)
		this.recalculate()
	}

	destroy = () => {
		map.off('move', this.recalculate)
		map.off('remove', this.destroy)
	}

	recalculate = () => {
		let zero = -this.offset
		let w = this.map.transform.width  + this.offset
		let h = this.map.transform.height + this.offset
		this.lt = this.map.unproject([zero, zero]).toArray()
		this.rb = this.map.unproject([w, h]).toArray()
		if (this.map.getBearing() === 0) {
			// angle is 0
			let [l, t] = this.lt
			let [r, b] = this.rb
			this.rt = [r, t]
			this.lb = [l, b]
			// find min and max because of equator and overflow
			this.left   = Math.min(this.lt[0], this.rb[0])
			this.right  = Math.max(this.lt[0], this.rb[0])
			this.top    = Math.min(this.lt[1], this.rb[1])
			this.bottom = Math.max(this.lt[1], this.rb[1])
		} else {
			// angle is not 0
			this.rt = this.map.unproject([w, zero]).toArray()
			this.lb = this.map.unproject([zero, h]).toArray()
			// find min and max because of equator and overflow
			this.left   = Math.min(this.lt[0], this.rb[0], this.lb[0], this.rt[0])
			this.right  = Math.max(this.lt[0], this.rb[0], this.lb[0], this.rt[0])
			this.top    = Math.min(this.lt[1], this.rb[1], this.lb[1], this.rt[1])
			this.bottom = Math.max(this.lt[1], this.rb[1], this.lb[1], this.rt[1])
		}
	}

	get bounds() {
		return [this.lt, this.rt, this.rb, this.lb]
	}

	get bbox() {
		return [
			[this.left, this.top],
			[this.right, this.top],
			[this.right, this.bottom],
			[this.left, this.bottom]
		]
	}

	isInside(coords) {
		let [lon, lat] = coords
		return this.left < lon && lon < this.right 
			&& this.top  < lat && lat < this.bottom
	}

}

export default ViewportChecker