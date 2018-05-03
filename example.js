'use strict'

const pump = require('pump')
const csvParser = require('csv-parser')
const ndjson = require('ndjson')

const generatePairs = require('.')

const showError = (err) => {
	console.error(err)
	process.exitCode = 1
}

const a = {latitude: 52.48181646725788, longitude: 13.35719704627991}
const b = {latitude: 52.482009219911006, longitude: 13.356692790985107}

pump(
	process.stdin,
	csvParser({separator: ';'}),
	generatePairs(a, b),
	ndjson.stringify(),
	process.stdout,
	(err) => {
		if (err) showError(err)
	}
)
