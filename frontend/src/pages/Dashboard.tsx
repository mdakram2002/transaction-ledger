import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Banknote,
  Plus,
  WalletCards,
} from "lucide-react";
import { api, errorMessage, type Account, type Page, type Txn } from "../api";
import {
  Avatar,
  CreateAccount,
  Heading,
  Stat,
  TxTable,
} from "../components/shared";
import { date, money, time } from "../utils/format";

export function Dashboard() {
  const user = (window as Window & { user?: { firstname?: string } }).user;
  const firstName = user?.firstname?.trim() || "Alex";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const [accounts, setAccounts] = useState<Account[]>([]),
    [tx, setTx] = useState<Txn[]>([]),
    [total, setTotal] = useState(0),
    [txTotal, setTxTotal] = useState(0),
    [busy, setBusy] = useState(true),
    [err, setErr] = useState(""),
    [modal, setModal] = useState(false);
  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const [a, t] = await Promise.all([
        api.get("/api/accounts?limit=100"),
        api.get("/api/transactions?limit=6"),
      ]);
      setAccounts(a.data.data.items);
      setTotal(a.data.data.pagination.total);
      setTx(t.data.data.items);
      setTxTotal(t.data.data.pagination.total);
    } catch (x) {
      setErr(errorMessage(x));
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const balance = accounts.reduce((s, a) => s + a.balance, 0);
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
    .format(new Date())
    .toUpperCase();
  return (
    <div className="content">
      <Heading
        eyebrow={today}
        title={`${greeting}, ${firstName}`}
        sub="Here’s what’s happening with your accounts today."
        action={
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Create account
          </button>
        }
      />
      {err && <div className="alert error">{err}</div>}
      <div className="stats-grid">
        <Stat
          title="Total balance"
          value={money(balance)}
          icon={<Banknote size={19} />}
          delta="Across all accounts"
        />
        <Stat
          title="Total accounts"
          value={String(total).padStart(2, "0")}
          icon={<WalletCards size={19} />}
          delta="Active accounts"
        />
        <Stat
          title="Transactions"
          value={String(txTotal)}
          icon={<Activity size={19} />}
          delta="Latest activity"
        />
      </div>
      <div className="section-heading">
        <div>
          <h2>Recent transactions</h2>
          <p>Your latest account activity, all in one place.</p>
        </div>
        <Link to="/transactions" className="text-link">
          View all <ArrowRight size={15} />
        </Link>
      </div>
      <section className="panel">
        <div className="panel-top">
          <div className="panel-title">
            <span className="title-mark">
              <Activity size={16} />
            </span>
            <div>
              <b>Latest activity</b>
              <small>A snapshot of recent movements</small>
            </div>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => void load()}
          >
            Refresh
          </button>
        </div>
        {busy ? (
          <div className="loading">Loading account activity…</div>
        ) : (
          <TxTable items={tx} />
        )}
      </section>
      <div className="section-heading accounts-head">
        <div>
          <h2>Your accounts</h2>
          <p>Keep track of the people behind your ledger.</p>
        </div>
        <Link to="/accounts" className="text-link">
          All accounts <ArrowRight size={15} />
        </Link>
      </div>
      <section className="panel account-list">
        {accounts.slice(0, 4).map((a) => (
          <Link to={`/accounts/${a.id}`} className="account-row" key={a.id}>
            <Avatar name={a.name} />
            <span className="account-name">
              <b>{a.name}</b>
              <small className="mono">{a.id}</small>
            </span>
            <span className="account-created">
              Created {date(a.created_at)}
            </span>
            <b className="row-balance">{money(a.balance)}</b>
            <ArrowRight className="row-arrow" size={16} />
          </Link>
        ))}
        {accounts.length === 0 && !busy && (
          <div className="empty">
            <span>
              <WalletCards />
            </span>
            <b>No accounts created</b>
            <p>Create your first account to get started.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setModal(true)}
            >
              <Plus size={14} /> Create account
            </button>
          </div>
        )}
      </section>
      {modal && (
        <CreateAccount
          onClose={() => setModal(false)}
          onCreated={() => {
            setModal(false);
            void load();
          }}
        />
      )}
    </div>
  );
}
