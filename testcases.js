map.renderPoints([
	[0, 0],
	[1, 1],
	[2, 2],
]),
map.renderPoints(/* array of Point */)
map.renderPoints(/* FeatureCollection of Point */)

// two different layers based on the same source
let pointSourceId = Math.random().toString()
map.addSource(pointSourceId, {
	'type': 'geojson',
	'data': collection
})
map.renderPoints(pointSourceId, {
	color: '#F00', // green
	size: 5,
	filter: ['==', 'checked', true],
})
map.renderPoints(pointSourceId, {
	color: '#0F0', // red
	size: 5,
	filter: ['!=', 'checked', true],
})




map.renderPoint([0, 0]),
map.renderPoint(/* Point */)