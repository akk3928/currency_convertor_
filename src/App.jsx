
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "https://open.er-api.com/v6/latest/";

const CURRENCIES = [
  ["USD", "US Dollar", "🇺🇸"],
  ["INR", "Indian Rupee", "🇮🇳"],
  ["EUR", "Euro", "🇪🇺"],
  ["GBP", "British Pound", "🇬🇧"],
  ["JPY", "Japanese Yen", "🇯🇵"],
  ["THB", "Thai Baht", "🇹🇭"],
  ["MMK", "Myanmar Kyat", "🇲🇲"],
  ["SGD", "Singapore Dollar", "🇸🇬"],
  ["AUD", "Australian Dollar", "🇦🇺"],
  ["CAD", "Canadian Dollar", "🇨🇦"],
  ["CNY", "Chinese Yuan", "🇨🇳"],
  ["KRW", "South Korean Won", "🇰🇷"],
  ["MYR", "Malaysian Ringgit", "🇲🇾"],
  ["IDR", "Indonesian Rupiah", "🇮🇩"],
  ["AED", "UAE Dirham", "🇦🇪"],
  ["CHF", "Swiss Franc", "🇨🇭"],
  ["NZD", "New Zealand Dollar", "🇳🇿"],
  ["BDT", "Bangladeshi Taka", "🇧🇩"],
  ["LKR", "Sri Lankan Rupee", "🇱🇰"],
  ["NPR", "Nepalese Rupee", "🇳🇵"],
  ["PHP", "Philippine Peso", "🇵🇭"],
  ["VND", "Vietnamese Dong", "🇻🇳"],
  ["SAR", "Saudi Riyal", "🇸🇦"],
  ["ZAR", "South African Rand", "🇿🇦"],
];

function getCurrency(code) {
  return CURRENCIES.find((currency) => currency[0] === code)
    || [code, code, "🌐"];
}

function formatMoney(value, currency) {
  if (!Number.isFinite(value)) return "—";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
}

function App() {
  const [amount, setAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [rates, setRates] = useState({});
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRates() {
      setLoading(true);
      setError("");
      setRates({});
      setUpdatedAt("");

      try {
        const response = await fetch(
          `${API_URL}${fromCurrency}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("The exchange-rate service is unavailable.");
        }

        const data = await response.json();

        if (data.result !== "success" || !data.rates) {
          throw new Error(
            data["error-type"] || "Unable to load exchange rates."
          );
        }

        setRates(data.rates);
        setUpdatedAt(data.time_last_update_utc || "");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Network error. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadRates();

    return () => controller.abort();
  }, [fromCurrency, retry]);

  const numericAmount = Number(amount);

  const convertedAmount = useMemo(() => {
    if (
      amount.trim() === "" ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0 ||
      rates[toCurrency] == null
    ) {
      return null;
    }

    return numericAmount * rates[toCurrency];
  }, [amount, numericAmount, rates, toCurrency]);

  const exchangeRate = rates[toCurrency];

  function swapCurrencies() {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }

  function handleAmountChange(event) {
    const value = event.target.value;

    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }

  function selectCurrency(event, side) {
    const code = event.target.value;

    if (side === "from") {
      setFromCurrency(code);
    } else {
      setToCurrency(code);
    }
  }

  function renderCurrencyOptions() {
    return CURRENCIES.map(([code, name, flag]) => (
      <option key={code} value={code}>
        {flag} {code} — {name}
      </option>
    ));
  }

  const fromInfo = getCurrency(fromCurrency);
  const toInfo = getCurrency(toCurrency);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="RateFlow home">
          <span className="brand-icon">↗</span>
          <span>RateFlow<span className="brand-dot">.</span></span>
        </a>

        <span className="topbar-label">
          <span className="live-dot" />
          Currency exchange
        </span>
      </header>

      <section className="hero" id="home">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          SMART CURRENCY CONVERTER
        </div>

        <h1>
          Money moves.
          <br />
          <span>Make it count.</span>
        </h1>

        <p className="hero-description">
          Convert currencies with the latest published exchange rates
          in a clean, simple workspace.
        </p>
      </section>

      <section className="converter-card" aria-label="Currency converter">
        <div className="card-heading">
          <div>
            <h2>Currency converter</h2>
            <p>Choose your currencies and enter an amount.</p>
          </div>
          <div className="card-symbol">⇄</div>
        </div>

        <div className="field-label-row">
          <label htmlFor="amount">You send</label>
          <span>AMOUNT</span>
        </div>

        <div className="amount-field">
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            aria-label="Amount to convert"
          />
          <span className="amount-code">{fromCurrency}</span>
        </div>

        <div className="currency-row">
          <div className="currency-field">
            <label htmlFor="from-currency">From</label>
            <div className="select-wrapper">
              <span className="currency-flag">{fromInfo[2]}</span>
              <select
                id="from-currency"
                value={fromCurrency}
                onChange={(event) => selectCurrency(event, "from")}
              >
                {renderCurrencyOptions()}
              </select>
            </div>
          </div>

          <button
            className="swap-button"
            type="button"
            onClick={swapCurrencies}
            aria-label="Swap currencies"
            title="Swap currencies"
          >
            ⇄
          </button>

          <div className="currency-field">
            <label htmlFor="to-currency">To</label>
            <div className="select-wrapper">
              <span className="currency-flag">{toInfo[2]}</span>
              <select
                id="to-currency"
                value={toCurrency}
                onChange={(event) => selectCurrency(event, "to")}
              >
                {renderCurrencyOptions()}
              </select>
            </div>
          </div>
        </div>

        <div className="result-panel" aria-live="polite">
          <div className="result-label">YOU RECEIVE</div>

          {loading ? (
            <div className="result-value">
              <span className="spinner" />
              <span className="loading-text">Fetching rates…</span>
            </div>
          ) : error ? (
            <div className="error-content">
              <p>{error}</p>
              <button
                type="button"
                className="retry-button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Try again ↻
              </button>
            </div>
          ) : convertedAmount === null ? (
            <div className="result-value">Enter a valid amount</div>
          ) : (
            <div className="result-value">
              {formatMoney(convertedAmount, toCurrency)}
            </div>
          )}

          <div className="result-caption">
            {fromCurrency} → {toCurrency}
          </div>
        </div>

        <button
          className="convert-button"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          disabled={loading}
        >
          <span>↻</span>
          Refresh exchange rate
        </button>

        <div className="rate-summary">
          <span className="rate-icon">↗</span>
          <div>
            <strong>Exchange rate</strong>
            <p>
              {loading
                ? "Updating rate…"
                : error
                  ? "Rate unavailable"
                  : Number.isFinite(exchangeRate)
                    ? `1 ${fromCurrency} = ${exchangeRate.toLocaleString(
                        "en-US",
                        { maximumFractionDigits: 6 }
                      )} ${toCurrency}`
                    : "Rate not available"}
            </p>
          </div>
        </div>

        {updatedAt && !error && (
          <p className="updated-at">
            Rates last updated: {updatedAt}
          </p>
        )}
      </section>

      <section className="benefits">
        <div className="benefit-item">
          <span className="benefit-icon">◎</span>
          <div>
            <strong>Simple conversion</strong>
            <p>Convert in seconds</p>
          </div>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">↗</span>
          <div>
            <strong>Published rates</strong>
            <p>Updated by the data provider</p>
          </div>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">◇</span>
          <div>
            <strong>Free to try</strong>
            <p>No API key required</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© {new Date().getFullYear()} RateFlow. Built with React.</p>
        <p>
          Exchange rates provided by{" "}
          <a
            href="https://www.exchangerate-api.com"
            target="_blank"
            rel="noreferrer"
          >
            ExchangeRate-API
          </a>
          . Rates are for reference only.
        </p>
      </footer>
    </main>
  );
}

export default App;
