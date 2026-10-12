import { useEffect, useState } from "react";

const PRICES_URL = "https://interview.switcheo.com/prices.json";
const icon = (c) =>
  `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${c}.svg`;

const FALLBACK_ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#cbd5e1"/><text x="12" y="16.5" font-size="12" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">$</text></svg>',
  );

function TokenIcon({ symbol, size }) {
  return (
    <img
      src={icon(symbol)}
      alt=""
      width={size}
      height={size}
      onError={(e) => (e.currentTarget.src = FALLBACK_ICON)}
    />
  );
}

function Token({ symbol }) {
  return (
    <b className="inline-token">
      <TokenIcon symbol={symbol} size={18} /> {symbol}
    </b>
  );
}

// prices.json has several entries per currency; keep the latest one.
function latestPrices(rows) {
  const latest = {};
  for (const { currency, price, date } of rows) {
    if (!price) continue;
    if (!latest[currency] || date > latest[currency].date) latest[currency] = { price, date };
  }
  return Object.fromEntries(Object.entries(latest).map(([c, v]) => [c, v.price]));
}

function TokenSelect({ value, onChange, tokens }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const pick = (t) => {
    onChange(t);
    close();
  };
  const shown = tokens.filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <button type="button" className="token" onClick={() => setOpen(true)}>
        <TokenIcon symbol={value} size={24} />
        {value} ▾
      </button>
      {open && (
        <div className="overlay" onClick={close}>
          <div className="picker" role="dialog" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              placeholder="Search currency"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid">
              {shown.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={t === value ? "cell selected" : "cell"}
                  onClick={() => pick(t)}
                >
                  <TokenIcon symbol={t} size={20} />
                  {t}
                </button>
              ))}
              {!shown.length && <p className="empty">No match.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [prices, setPrices] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [from, setFrom] = useState("ETH");
  const [to, setTo] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [swap, setSwap] = useState(null); // { status: "loading" | "success" | "error", text }

  useEffect(() => {
    fetch(PRICES_URL)
      .then((r) => r.json())
      .then((rows) => setPrices(latestPrices(rows)))
      .catch(() => setLoadError("Could not load prices. Please refresh."));
  }, []);

  if (loadError) return <main><p className="error">{loadError}</p></main>;
  if (!prices) return <main><p>Loading prices…</p></main>;

  const tokens = Object.keys(prices).sort();
  const rate = prices[from] / prices[to];
  const received = amount ? Number(amount) * rate : 0;

  let error = "";
  if (!amount) error = "Enter an amount.";
  else if (!(Number(amount) > 0)) error = "Amount must be greater than 0.";

  const pickFrom = (t) => {
    if (t === to) setTo(from);
    setFrom(t);
  };
  const pickTo = (t) => {
    if (t === from) setFrom(to);
    setTo(t);
  };

  const flip = () => {
    setFrom(to);
    setTo(from);
    if (amount) setAmount(fmt(received));
  };

  const submit = (e) => {
    e.preventDefault();
    if (error) return;
    setSwap({
      status: "confirm",
      title: "Confirm swap",
      trade: { amount, from, received: fmt(received), to },
    });
  };

  const confirmSwap = () => {
    const trade = swap.trade;
    setSwap({ status: "loading", title: "Swapping...", trade });
    setTimeout(() => {
      if (Math.random() < 0.5) {
        setSwap({ status: "success", title: "Swapped", trade });
        setAmount("");
      } else {
        setSwap({ status: "error", title: "Swap failed. Please try again.", trade });
      }
    }, 1000);
  };

  return (
    <main>
      <form onSubmit={submit} noValidate>
        <h1>Swap</h1>

        <label>You pay</label>
        <div className="row">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <TokenSelect value={from} onChange={pickFrom} tokens={tokens} />
        </div>

        <button type="button" className="flip" onClick={flip} aria-label="Swap currencies">
          ⇅
        </button>

        <label>You receive</label>
        <div className="row">
          <input readOnly value={amount ? fmt(received) : ""} placeholder="0.0" />
          <TokenSelect value={to} onChange={pickTo} tokens={tokens} />
        </div>

        <p className="rate">
          1 {from} = {fmt(rate)} {to}
        </p>
        {amount && error && <p className="error">{error}</p>}

        <button type="submit" disabled={!!error}>Swap</button>
      </form>

      {swap && (
        <div className="overlay">
          <div className="picker dialog" role="dialog">
            {swap.status === "loading" && <div className="spinner" />}
            {swap.status === "success" && <div className="icon ok">✓</div>}
            {swap.status === "error" && <div className="icon bad">✕</div>}
            <p>{swap.title}</p>
            <p className="trade">
              <span>
                <i>{swap.trade.amount}</i> <Token symbol={swap.trade.from} />
              </span>{" "}
              <span>
                for <i>{swap.trade.received}</i> <Token symbol={swap.trade.to} />
              </span>
            </p>
            {swap.status === "confirm" && (
              <div className="actions">
                <button type="button" className="secondary" onClick={() => setSwap(null)}>
                  Cancel
                </button>
                <button type="button" className="primary" onClick={confirmSwap}>
                  Confirm
                </button>
              </div>
            )}
            {(swap.status === "success" || swap.status === "error") && (
              <button type="button" className="primary" onClick={() => setSwap(null)}>
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

const fmt = (n) => Number(n.toPrecision(8)).toString();
