import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Command,
  Download,
  ListFilter,
  Plus,
  Search,
  Settings2,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { api, errorMessage, type Account, type Page, type Txn } from "../api";
import {
  Avatar,
  CreateAccount,
  Heading,
  Pager,
} from "../components/shared";
import { date, money, time } from "../utils/format";

export function Accounts() {
  const [data, setData] = useState<Page<Account> | null>(null),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(true),
    [modal, setModal] = useState(false),
    [err, setErr] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await api.get("/api/accounts", {
        params: { page, limit: 10, search },
      });
      setData(r.data.data);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [page, search]);
  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);
  return (
    <div className="content">
      <Heading
        eyebrow="YOUR LEDGER"
        title="Accounts"
        sub="Manage account holders and their balances."
        action={
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Create account
          </button>
        }
      />
      {err && <div className="alert error">{err}</div>}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            aria-label="Search accounts"
            placeholder="Search by account holder…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <kbd>⌘ K</kbd>
        </div>
        <button className="btn btn-outline">
          <ListFilter size={15} /> Filters
        </button>
      </div>
      <section className="panel">
        <div className="panel-top">
          <div>
            <b>All accounts</b>
            <small>{data?.pagination.total ?? 0} account holders</small>
          </div>
          <button className="icon-btn" aria-label="Account options">
            <Settings2 />
          </button>
        </div>
        {busy ? (
          <div className="loading">Loading accounts…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ACCOUNT HOLDER</th>
                  <th>ACCOUNT ID</th>
                  <th>CREATED</th>
                  <th>BALANCE</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data?.items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/accounts/${a.id}`} className="cell-main">
                        <Avatar name={a.name} />
                        <b>{a.name}</b>
                      </Link>
                    </td>
                    <td className="mono muted">{a.id.slice(0, 18)}…</td>
                    <td className="date-cell">{date(a.created_at)}</td>
                    <td className="amount">{money(a.balance)}</td>
                    <td>
                      <Link
                        aria-label={`Open ${a.name}`}
                        to={`/accounts/${a.id}`}
                        className="icon-btn"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.items.length && (
              <div className="empty">
                <span>
                  <WalletCards />
                </span>
                <b>No matching accounts</b>
                <p>Try a different search or create a new account.</p>
              </div>
            )}
          </div>
        )}
        <Pager
          page={page}
          pages={data?.pagination.pages ?? 1}
          onChange={setPage}
        />
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
