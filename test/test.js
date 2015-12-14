var test = require('tape')

test('simple test', function (t) {
  t.plan(2)
  t.equal('a', 'a')
  t.deepEqual({a: 'b', b: 'c'}, {a: 'b', b: 'c'})
})
