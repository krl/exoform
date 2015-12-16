
var a = require('./two.js')
var b = require('./two.js').blorp
var c = require('./two.js').blorp()

var x = { y: { z: {} } }
x.y.z.two = require('./two.js')

console.log(x.y.z.two.blorp())
console.log(a.blorp())
console.log(b())
console.log(c)
