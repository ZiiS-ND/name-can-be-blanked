// Divide and conquer: split 1..n in half, sum each half recursively.
// Time: O(n), Space: O(log n) call stack. Returns 0 for n < 1.
var sum_to_n = function (n) {
  const sumRange = (start, end) => {
    if (start === end) return start;
    const mid = Math.floor((start + end) / 2);
    return sumRange(start, mid) + sumRange(mid + 1, end);
  };
  return n < 1 ? 0 : sumRange(1, n);
};

console.assert(sum_to_n(5) === 15);
console.assert(sum_to_n(1) === 1);
console.assert(sum_to_n(0) === 0);
console.assert(sum_to_n(-3) === 0);
