import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  Download,
  ListFilter,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { api, errorMessage, type Account, type Page, type Txn } from "../api";
import {
  Heading,
  Pager,
  Stat,
  TxTable,
} from "../components/shared";

export function Transactions() {
  const [rows, setRows] = useState<Page<Txn> | null>(null),
    [page, setPage] = useState(1),
    [type, setType] = useState(""),
    [busy, setBusy] = useState(true),
    [err, setErr] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api.get("/api/transactions", {
        params: { page, limit: 10, ...(type ? { type } : {}) },
      });
      setRows(r.data.data);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [page, type]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="content">
      <Heading
        eyebrow="ACTIVITY"
        title="Transactions"
        sub="A complete view of activity across all accounts."
        action={
          <button className="btn btn-outline" onClick={() => void load()}>
            <Download size={15} /> Refresh
          </button>
        }
      />
      {err && <div className="alert error">{err}</div>}
      <div className="stats-grid compact-stats">
        <Stat
          title="Total transactions"
          value={String(rows?.pagination.total ?? 0)}
          icon={<Activity size={19} />}
          delta="Across your workspace"
        />
        <Stat
          title="Current page"
          value={`${String(rows?.items.length ?? 0).padStart(2, "0")} / 10`}
          icon={<WalletCards size={19} />}
          delta="Visible transactions"
        />
        <Stat
          title="Transaction types"
          value="02"
          icon={<Sparkles size={19} />}
          delta="Credits & debits"
        />
      </div>
      <div className="section-heading">
        <div>
          <h2>All activity</h2>
          <p>Every movement, across every account.</p>
        </div>
        <div className="select-wrap">
          <ListFilter size={14} />
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            aria-label="Filter transaction type"
          >
            <option value="">All types</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
          </select>
        </div>
      </div>
      <section className="panel">
        {busy ? (
          <div className="loading">Loading transactions…</div>
        ) : (
          <TxTable items={rows?.items ?? []} showAccount />
        )}
        <Pager
          page={page}
          pages={rows?.pagination.pages ?? 1}
          onChange={setPage}
        />
      </section>
    </div>
  );
}
