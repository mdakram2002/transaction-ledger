import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  X,
} from "lucide-react";
import { api, errorMessage, type Account, type Txn } from "../api";
import { date, money, time } from "../utils/format";

export function Heading({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export function Stat({
  title,
  value,
  icon,
  delta,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  delta?: string;
}) {
  return (
    <section className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <div className="stat-foot">
        <span className="delta">↗ {delta ?? "Updated just now"}</span>
        <span>vs. last month</span>
      </div>
    </section>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="account-avatar">
      {name
        .split(" ")
        .map((x) => x[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
export function TypePill({ type }: { type: string }) {
  return (
    <span className={`type-pill ${type}`}>
      <i />
      {type === "credit" ? "Credit" : "Debit"}
    </span>
  );
}
export function TxTable({
  items,
  showAccount = false,
}: {
  items: Txn[];
  showAccount?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>TRANSACTION</th>
            {showAccount && <th>ACCOUNT</th>}
            <th>TYPE</th>
            <th>DATE</th>
            <th>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="cell-main">
                  <span className={`tx-icon ${t.type}`}>
                    {t.type === "credit" ? (
                      <ArrowDownLeft size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </span>
                  <span>
                    <b>{t.description}</b>
                    <small>{t.reference_id}</small>
                  </span>
                </div>
              </td>
              {showAccount && (
                <td>
                  <Link
                    className="mono account-link"
                    to={`/accounts/${t.account_id}`}
                  >
                    {t.account_id.slice(0, 12)}…
                  </Link>
                </td>
              )}
              <td>
                <TypePill type={t.type} />
              </td>
              <td className="date-cell">{time(t.created_at)}</td>
              <td className={`amount ${t.type}`}>
                {t.type === "credit" ? "+" : "−"}
                {money(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="empty">
          <span>
            <Activity />
          </span>
          <b>No transactions yet</b>
          <p>Transactions will show here once activity begins.</p>
        </div>
      )}
    </div>
  );
}
export function CreateAccount({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (a: Account) => void;
}) {
  const [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await api.post("/api/accounts", { name });
      onCreated(r.data.data);
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">NEW ACCOUNT</span>
            <h2>Create an account</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <p className="modal-description">
          Set up a new account to start tracking transactions.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="holder">Account holder name</label>
          <input
            id="holder"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            maxLength={120}
            required
          />
          <p className="field-hint">Account balance starts at ₹0.00</p>
          {err && <div className="alert error">{err}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-quiet" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy || !name.trim()}>
              {busy ? (
                "Creating…"
              ) : (
                <>
                  Create account <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
export function Pager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        Page <b>{page}</b> of <b>{Math.max(1, pages)}</b>
      </span>
      <div>
        <button
          className="pager-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft size={14} /> Previous
        </button>
        <button
          className="pager-btn"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
