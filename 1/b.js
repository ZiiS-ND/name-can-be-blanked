// Closed-form (Gauss) formula. O(1) time and space. Returns 0 for n < 1.
var sum_to_n_b = function (n) {
  return n < 1 ? 0 : (n * (n + 1)) / 2;
};

console.assert(sum_to_n_b(5) === 15);
console.assert(sum_to_n_b(1) === 1);
console.assert(sum_to_n_b(0) === 0);
console.assert(sum_to_n_b(-3) === 0);
