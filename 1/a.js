// Loop. O(n) time, O(1) space. Returns 0 for n < 1.
var sum_to_n = function (n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += i;
  return sum;
};

console.assert(sum_to_n(5) === 15);
console.assert(sum_to_n(1) === 1);
console.assert(sum_to_n(0) === 0);
console.assert(sum_to_n(-3) === 0);
