# Exoform

Exoform takes a module defined in CommonJS style, and recursively transforms it, and its dependencies into asynchronous content-addressed require calls.

This gives you the whole program, and its dependencies, in a content-addressable manner, that you could later require from other programs.

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
exoform test/req/one.js | ipfs cat
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
'use strict';

__meta.exoform.require(__meta.refs, 'QmTg6MAGCTxnqpT6v6A1u7fDip5piterr5cJydzWbhCgX7', function (a) {
__meta.exoform.require(__meta.refs, 'QmTg6MAGCTxnqpT6v6A1u7fDip5piterr5cJydzWbhCgX7', function (b) {
b = b.blorp
__meta.exoform.require(__meta.refs, 'QmTg6MAGCTxnqpT6v6A1u7fDip5piterr5cJydzWbhCgX7', function (c) {
c = c.blorp()

var x = { y: { z: {} } };
__meta.exoform.require(__meta.refs, 'QmTg6MAGCTxnqpT6v6A1u7fDip5piterr5cJydzWbhCgX7', function (two) {
x.y.z.two = two;

console.log(x.y.z.two.blorp());
console.log(a.blorp());
console.log(b());
console.log(c);
__meta.define(module.exports)
})})})})
```

The dependency loaded (test/req/two.js):

```bash
ipfs cat QmTg6MAGCTxnqpT6v6A1u7fDip5piterr5cJydzWbhCgX7
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
'use strict';

__meta.exoform.require(__meta.refs,'QmcJu1cijCd31EgkydhVthdepc8mtABHPjk4HuEtZLiWE7', function (three) {

module.exports = { blorp: function blorp() {
    return 'testblorp ' + three('extra');
  } };
__meta.define(module.exports)
})
```

## Todo

Extended support for the browserify ecosystem and browser ports of node modules