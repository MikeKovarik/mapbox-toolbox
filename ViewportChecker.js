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
		let w = this.map.transform.width + this.offset
		let h = this.map.transform.height + this.offset
		let angle = this.map.getBearing()
		this.lt = this.map.unproject([zero, zero]).toArray()
		this.rb = this.map.unproject([w, h]).toArray()
		if (angle === 0) {
			let [l, t] = this.lt
			let [r, b] = this.rb
			this.rt = [r, t]
			this.lb = [l, b]
			this.left = l
			this.right = r
			this.top = t
			this.bottom = b
		} else {
			this.rt = this.map.unproject([w, zero]).toArray()
			this.lb = this.map.unproject([zero, h]).toArray()
			this.left   = Math.min(this.lt[0], this.lb[0], this.rt[0], this.rb[0])
			this.right  = Math.max(this.lt[0], this.lb[0], this.rt[0], this.rb[0])
			this.bottom = Math.min(this.lt[1], this.lb[1], this.rt[1], this.rb[1])
			this.top    = Math.max(this.lt[1], this.lb[1], this.rt[1], this.rb[1])
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
			&& this.bottom < lat && lat < this.top 
	}

}

export default ViewportChecker