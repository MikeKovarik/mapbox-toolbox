import fs from 'fs'
import notify from 'rollup-plugin-notify'
import acornClassFields from 'acorn-class-fields'
import acornStaticClassFeatures from 'acorn-static-class-features'


var pkg = JSON.parse(fs.readFileSync('package.json').toString())

export default {
	treeshake: false,
	input: 'index.esm.js',
	plugins: [notify()],
	output: {
		file: `index.min.js`,
		format: 'umd',
		name: pkg.name,
		amd: {id: pkg.name},
	},
	// remove once acorn/rollup support class fields.
	context: 'this',
	acornInjectPlugins: [
		acornClassFields,
		acornStaticClassFeatures,
	]
}