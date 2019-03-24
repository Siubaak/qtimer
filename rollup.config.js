import { uglify } from 'rollup-plugin-uglify'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'patch/index.js',
  output: {
    name: 'qtimer',
    format: 'iife',
    file: 'patch/dist/qtimer.min.js'
  },
  plugins: [
    resolve(),
    uglify()
  ]
}