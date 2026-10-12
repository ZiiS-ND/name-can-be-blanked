// Closed-form (Gauss) formula.
// Time: O(1), Space: O(1). Returns 0 for n < 1.
var sum_to_n = function (n) {
  return n < 1 ? 0 : (n * (n + 1)) / 2;
};

console.assert(sum_to_n(5) === 15);
console.assert(sum_to_n(1) === 1);
console.assert(sum_to_n(0) === 0);
console.assert(sum_to_n(-3) === 0);
