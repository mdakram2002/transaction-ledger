import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Command,
  ListFilter,
  X,
} from "lucide-react";
import { api, errorMessage, type Account, type Page, type Txn } from "../api";
import {
  Avatar,
  CreateAccount,
  Heading,
  Pager,
  Stat,
  TxTable,
} from "../components/shared"
import { date, money, time } from "../utils/format";

export function AccountDetail() {
  const { id = "" } = useParams(),
    [a, setA] = useState<Account | null>(null),
    [rows, setRows] = useState<Page<Txn> | null>(null),
    [page, setPage] = useState(1),
    [type, setType] = useState(""),
    [busy, setBusy] = useState(true),
    [err, setErr] = useState(""),
    [modal, setModal] = useState<"credit" | "debit" | null>(null),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const [x, t] = await Promise.all([
        api.get(`/api/accounts/${id}`),
        api.get(`/api/accounts/${id}/transactions`, {
          params: { page, limit: 10, ...(type ? { type } : {}) },
        }),
      ]);
      setA(x.data.data);
      setRows(t.data.data);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [id, page, type]);
  useEffect(() => {
    void load();
  }, [load]);
  async function transact(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      type: modal,
      amount: Number(f.get("amount")),
      description: String(f.get("description")),
      reference_id: String(f.get("reference_id")),
    };
    try {
      await api.post(`/api/accounts/${id}/transactions`, payload);
      setModal(null);
      setNotice("Transaction recorded successfully.");
      await load();
    } catch (e) {
      setNotice(errorMessage(e));
    }
  }
  return (
    <div className="content">
      <Link to="/accounts" className="back-link">
        <ArrowLeft size={15} /> Back to accounts
      </Link>
      {err && <div className="alert error">{err}</div>}
      {a && (
        <>
          <Heading
            eyebrow="ACCOUNT DETAILS"
            title={a.name}
            sub={<span className="mono">{a.id}</span>}
            action={
              <button className="btn btn-outline" onClick={() => void load()}>
                Refresh
              </button>
            }
          />
          {notice && (
            <div
              className={`alert ${notice.includes("successfully") ? "success" : "error"}`}
            >
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          )}
          <div className="detail-grid">
            <section className="balance-card">
              <div className="balance-card-head">
                <span>Current balance</span>
                <span className="balance-chip">
                  <i /> Active
                </span>
              </div>
              <strong>{money(a.balance)}</strong>
              <div className="balance-card-bottom">
                <span>Account created {date(a.created_at)}</span>
                <span className="balance-card-mark">
                  <Command size={15} /> northstar.
                </span>
              </div>
            </section>
            <section className="quick-actions">
              <span className="eyebrow">QUICK ACTIONS</span>
              <h2>Move money</h2>
              <p>Record a credit or debit for this account.</p>
              <div className="action-buttons">
                <button
                  className="action-button credit-action"
                  onClick={() => setModal("credit")}
                >
                  <span>
                    <ArrowDownLeft />
                  </span>
                  <b>Add credit</b>
                  <small>Money coming in</small>
                </button>
                <button
                  className="action-button debit-action"
                  onClick={() => setModal("debit")}
                >
                  <span>
                    <ArrowUpRight />
                  </span>
                  <b>Add debit</b>
                  <small>Money going out</small>
                </button>
              </div>
            </section>
          </div>
          <div className="section-heading">
            <div>
              <h2>Transaction history</h2>
              <p>A complete record of all account movements.</p>
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
                <option value="">All transactions</option>
                <option value="credit">Credits only</option>
                <option value="debit">Debits only</option>
              </select>
            </div>
          </div>
          <section className="panel">
            {busy ? (
              <div className="loading">Refreshing account…</div>
            ) : (
              <TxTable items={rows?.items ?? []} />
            )}
            <Pager
              page={page}
              pages={rows?.pagination.pages ?? 1}
              onChange={setPage}
            />
          </section>
        </>
      )}
      {modal && (
        <div className="modal-backdrop">
          <section className="modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  {modal === "credit" ? "MONEY IN" : "MONEY OUT"}
                </span>
                <h2>Record a {modal}</h2>
              </div>
              <button
                className="icon-btn"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <form onSubmit={transact}>
              <label htmlFor="amount">Amount (INR)</label>
              <div className="input-prefix">
                <span>₹</span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
              <label htmlFor="description">Description</label>
              <input
                id="description"
                name="description"
                required
                maxLength={500}
                placeholder="What is this transaction for?"
              />
              <label htmlFor="reference">Reference ID</label>
              <input
                id="reference"
                name="reference_id"
                required
                maxLength={120}
                placeholder="e.g. INV-2025-001"
              />
              <p className="field-hint">
                Each reference can be used once per account.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary">Record {modal}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
