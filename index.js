'use strict'

const {Transform} = require('stream')
const distance = require('gps-distance')

const minute = 60 * 1000
const hour = 60 * minute

const threshold = .01 // 10m

const generatePairs = (a, b, done) => {
	// todo: check a b distance

	const state = Object.create(null) // by vehicle ID

	function transform (update, _, cb) {
		const t = +new Date(update.created_at)
		const lat = parseFloat(update.latitude)
		const lon = parseFloat(update.longitude)
		const doors = update.doors === 't'

		let s = state[update.vehicle_id]
		if (!s) s = state[update.vehicle_id] = {legs: [], onLeg: false}

		if (
			(t - s.prevT) >= minute || // end of service
			s.onLeg && (t - s.t) >= 5 * hour // round too long
		) {
			if (s.legs.length > 0) this.push(s.legs) // todo: vehicle ID
			s.legs = []
			s.lat = s.lon = s.t = null
			s.onLeg = false
			s.doorsOpened = 0
		}

		if (!s.onLeg) {
			if (distance(lat, lon, a.latitude, a.longitude) <= threshold) { // passes A
				// todo: take start time once it has moved again, not now
				s.lat = lat
				s.lon = lon
				s.t = t
				s.onLeg = true
			}
		} else if (distance(lat, lon, b.latitude, b.longitude) <= threshold) {
			s.legs.push({
				a: {lat: s.lat, lon: s.lon, t: s.t},
				b: {lat, lon, t},
				doorsOpened: s.doorsOpened
			})
			s.lat = s.lon = s.t = null
			s.onLeg = false
			s.doorsOpened = 0
		}

		if (s.onLeg && !s.prevDoors && doors) s.doorsOpened++

		s.prevT = t
		s.prevDoors = doors
		cb()
	}

	return new Transform({objectMode: true, transform})
}

module.exports = generatePairs
