# Exoform

Exoform takes a module defined in CommonJS style, and recursively transforms it, and its dependencies into asynchronous content-addressed require calls.

This gives you the whole program, and its dependencies, in a content-addressable manner, that you could later require from other programs.

Exoform uses [cdump](https://github.com/krl/cdump), for now, to store its blobs

## Example

Input: test/req/one.js

```js
var a = require('./two.js')
var b = require('./two.js').blorp
var c = require('./two.js').blorp()

var x = { y: { z: {} } }
x.y.z.two = require('./two.js')

console.log(x.y.z.two.blorp())
console.log(a.blorp())
console.log(b())
console.log(c)
```

```bash
exoform test/req/one.js | xargs cdump get
```

Output:

```js
var __meta
if (typeof arguments !== 'undefined') {
  __meta = arguments[0]
} else {
  __meta = {
    exoform: require('exoform'),
    define: function () {},
    refs: [] } }
var exoform = __meta.exoform
var exports = __meta.mod
var module = { exports: exports }
;
__meta.exoform.require(__meta.refs, '6aa7e2e45e38d55c765ac44dbd98f5ce09f27c60696b823e70cf547816c38d31', function (a) {
__meta.exoform.require(__meta.refs, '6aa7e2e45e38d55c765ac44dbd98f5ce09f27c60696b823e70cf547816c38d31', function (b) {
b = b.blorp
__meta.exoform.require(__meta.refs, '6aa7e2e45e38d55c765ac44dbd98f5ce09f27c60696b823e70cf547816c38d31', function (c) {
c = c.blorp()

var x = { y: { z: {} } }
__meta.exoform.require(__meta.refs, '6aa7e2e45e38d55c765ac44dbd98f5ce09f27c60696b823e70cf547816c38d31', function (two) {
x.y.z.two = two

console.log(x.y.z.two.blorp())
console.log(a.blorp())
console.log(b())
console.log(c)
;
__meta.define(module.exports)
})})})})
```

The dependency loaded (test/req/two.js):

```bash
cdump get 6aa7e2e45e38d55c765ac44dbd98f5ce09f27c60696b823e70cf547816c38d31
```

outputs:

```js
var __meta
if (typeof arguments !== 'undefined') {
  __meta = arguments[0]
} else {
  __meta = {
    exoform: require('exoform'),
    define: function () {},
    refs: [] } }
var exoform = __meta.exoform
var exports = __meta.mod
var module = { exports: exports }
;__meta.exoform.require(__meta.refs, '47171d069057c67c3f6e8cd2b409e3ea38920881f58407ed1b1ac00b27d8f8ab', function (three) {

module.exports = { blorp: function () { return 'testblorp ' + three('extra')} }
;
__meta.define(module.exports)
})
```

## Todo

Extended support for the browserify ecosystem and browser ports of node modules