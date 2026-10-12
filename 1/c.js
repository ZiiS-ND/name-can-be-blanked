// Array + reduce. O(n) time and space. Returns 0 for n < 1.
var sum_to_n_c = function (n) {
  return Array.from({ length: Math.max(n, 0) }, (_, i) => i + 1).reduce((a, b) => a + b, 0);
};

console.assert(sum_to_n_c(5) === 15);
console.assert(sum_to_n_c(1) === 1);
console.assert(sum_to_n_c(0) === 0);
console.assert(sum_to_n_c(-3) === 0);
