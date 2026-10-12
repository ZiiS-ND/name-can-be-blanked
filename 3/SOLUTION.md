# Problem 3: Messy React

Line numbers refer to the snippet in the task (first line of the code block = line 1).

## Issues

| # | Severity | Line | Issue | Why it matters / fix |
|---|----------|------|-------|----------------------|
| 1 | Critical | 38 | `lhsPriority` is never defined (`balancePriority` is declared on line 37) | `ReferenceError` on first render. Use `balancePriority`. |
| 2 | Critical | 39 | Filter is inverted: keeps `amount <= 0` | Zero and negative balances are shown, real balances are hidden. Should be `amount > 0`. |
| 3 | Critical | 63-64 | `rows` maps `sortedBalances` but types items as `FormattedWalletBalance` | `balance.formatted` is `undefined`, so `formattedAmount` is empty. Map the formatted list instead. |
| 4 | Critical | 1-4, 37 | `blockchain` is read but missing from `WalletBalance` | TypeScript compile error. Add `blockchain: string` to the interface. |
| 5 | Medium | 48-52 | Sort comparator returns nothing when priorities are equal | Returns `undefined`, so the order of ties is inconsistent. Use `rightPriority - leftPriority`. |
| 6 | Medium | 54 | `prices` in `useMemo` deps, but never used inside it | Re-sorts on every price update for nothing. Deps should be `[balances]`. |
| 7 | Medium | 17 | `getPriority` is redefined on every render | It is pure and uses no props or state. Move it outside the component (a lookup object is simpler than the switch). |
| 8 | Medium | 69 | `key={index}` | Rows reorder when balances change, so React reuses the wrong DOM and state. Use a stable key like `blockchain + currency`. |
| 9 | Medium | 56-61 | `formattedBalances` is unused (dead code) and is not memoized | Wasted work every render. Do the formatting in the same `useMemo` as the sort. |
| 10 | Medium | 65 | `prices[balance.currency]` can be `undefined` | `usdValue` becomes `NaN`. Default to `0`. |
| 11 | Low | 17 | `blockchain: any` | Loses type safety. Type it as `string` (or a union of known chains). |
| 12 | Low | 59 | `toFixed()` with no argument | Rounds to a whole number, so `0.45` shows as `0`. Use `toFixed(2)` or `Intl.NumberFormat`. |
| 13 | Low | 5-9 | `FormattedWalletBalance` repeats fields of `WalletBalance` | Use `extends WalletBalance`. |
| 14 | Low | 13 | `children` is destructured but never used | Dead variable. Spread `props` directly. |

## Refactor

Assumption: the intent of the filter is "show balances with a known chain and amount > 0".

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

// Assume priority starts from 0, so -99 (unknown chain) is always below every valid priority.
const PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};
const getPriority = (blockchain: string) => PRIORITY[blockchain] ?? -99;

const WalletPage: React.FC<BoxProps> = (props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo<FormattedWalletBalance[]>(
    () =>
      balances
        .filter((b) => getPriority(b.blockchain) > -99 && b.amount > 0)
        .sort((l, r) => getPriority(r.blockchain) - getPriority(l.blockchain))
        .map((b) => ({ ...b, formatted: b.amount.toFixed(2) })),
    [balances],
  );

  // Not wrapped in useMemo: rows depend on `prices` (changes often) and building JSX is cheap.
  // If rendering gets slow, wrap WalletRow in React.memo instead.
  return (
    <div {...props}>
      {sortedBalances.map((b) => (
        <WalletRow
          className={classes.row}
          key={`${b.blockchain}-${b.currency}`}
          amount={b.amount}
          usdValue={(prices[b.currency] ?? 0) * b.amount}
          formattedAmount={b.formatted}
        />
      ))}
    </div>
  );
};
```
