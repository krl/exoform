
// var a = require('./two.js')
// var b = require('./two.js').test
// var c = require('./two.js').test.test().test[3]
var x = { y: { z: {} } }
x.y.z.two = require('./two.js')
// x.y.z.two = require('./two.js')
// x.y.z.two = require('./two.js').test
// x.y.z.two = require('./two.js').test.test
// x.y.z.two = require('./two.js')()
// x.y.z.two = require('./two.js')()()

// // console.log(three)
console.log(x.y.z.two.blorp())
// //console.log(two2())
