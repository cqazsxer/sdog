const R = require('ramda');

var add = num => x => x + num;

function IO(f) {
  this._v = f;
}
IO.of = function(x) {
  return new IO(() => x);
};
IO.prototype.join = function() {
  return this._v();
}
IO.prototype.map = function(f) {
  return new IO(R.compose(f, this._v));
};
IO.prototype.chain = function(m) {
  return m.map(f).join();
};
var print = function(x) {
  return new IO(function() {
    return x;
  });
};
var map = f => functor => functor.map(f);
var join = functor => functor.join();
var chain = R.curry(function(f, m){
  return m.map(f).join(); // 或者 compose(join, map(f))(m)
});
const a = R.compose(chain(print), map(add(3)), IO.of)(10);

// var a = R.map(add(2))(IO.of(1))
console.log(a);
console.log(a._v());
// console.log(a._v()._v());
