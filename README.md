# Northstar Transaction Ledger

A full stack account ledger built with React, TypeScript, Express, MongoDB, and Vite. Accounts start at zero; credits and debits update an integer-paise balance and append an immutable ledger row in one MongoDB transaction. This assessment implementation does not include authentication.

## Structure

- `frontend/` — React dashboard, accounts, account details, and transaction history.
- `frontend/src/pages/` — dashboard, account list, account details, and transaction history screens.
- `frontend/src/components/` — application shell and reusable UI components/forms.
- `frontend/src/api.ts` — centralized Axios client and API data types.
- `frontend/src/utils/format.ts` — shared currency and date formatting.
- `backend/src/config/` — environment configuration and MongoDB connection/index setup.
- `backend/src/routes/` — endpoint paths and middleware wiring.
- `backend/src/controllers/` — HTTP request/response handling.
- `backend/src/services/` — account and atomic transaction business logic.
- `backend/src/validators/` — Zod request schemas.
- `backend/src/middleware/` — async routing, rate limiting, and centralized errors.
- `backend/src/types/` and `backend/src/utils/` — shared models and API serialization.

## Requirements and local setup

Use Node.js 22 LTS and a MongoDB Atlas replica-set cluster (or a local replica set). Multi-document transactions are mandatory; the service fails to start if MongoDB cannot connect, and it never falls back to separate writes.

```sh
npm install
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`. Fill in Atlas credentials locally; never commit `.env` files. Then run two terminals:

```sh
npm run dev:backend
npm run dev:frontend
```

The frontend uses `http://localhost:4000` by default. Set `VITE_API_BASE_URL` to the API origin only, without `/api`.

## Configuration

Backend environment variables:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Secret MongoDB connection URI |
| `MONGODB_DB_NAME` | Database name, e.g. `transaction_ledger` |
| `FRONTEND_URL` | Allowed browser origin(s), comma separated |
| `PORT` | Render port or local port (default 4000) |
| `NODE_ENV` | Runtime mode |

Frontend has `VITE_API_BASE_URL`. Frontend variables are public; do not put credentials there.

## Data and consistency

Collections are `accounts` and `transactions`. Monetary API amounts are rupees and are converted to integer `balance_minor` / `amount_minor` paise at the boundary. Amounts must be positive, safe, and have at most two decimal places. The database creates these indexes at startup:

- `accounts.id` unique
- `transactions.id` unique
- `(transactions.account_id, transactions.reference_id)` unique
- `(transactions.account_id, transactions.created_at, transactions.id)` for deterministic account history
- `(transactions.account_id, transactions.type, transactions.created_at, transactions.id)` for filtered account history

For each transaction, a MongoDB session transaction checks the idempotency key, conditionally updates the account balance (debits require `balance_minor >= amount_minor`), and inserts the ledger record. Concurrent updates to the account document conflict and MongoDB's transaction helper retries transient errors. Duplicate index errors return `409 DUPLICATE_TRANSACTION`; debit underflow returns `409 INSUFFICIENT_FUNDS`. A replica set is required. Failed MongoDB transactions roll back both writes.

## API

All routes are prefixed `/api`; responses use `{ success, data }` or `{ success: false, error: { code, message, details? } }`.

| Method and path | Purpose |
| --- | --- |
| `GET /api/health` | Render health probe |
| `POST /api/accounts` | Create zero-balance account: `{ "name": "Rahul Sharma" }` |
| `GET /api/accounts?page=1&limit=20&search=rahul` | Paginated accounts and optional holder search |
| `GET /api/accounts/:accountId` | Account details |
| `GET /api/accounts/:accountId/balance` | Current server balance |
| `POST /api/accounts/:accountId/transactions` | Post credit or debit |
| `GET /api/accounts/:accountId/transactions?type=credit&page=1&limit=20` | Scoped history and pagination |
| `GET /api/accounts/:accountId/transactions/:transactionId` | Scoped transaction details |
| `GET /api/transactions?type=debit&page=1&limit=20` | Global history and pagination |

Transaction example:

```json
{
  "type": "credit",
  "amount": 500,
  "description": "Initial deposit",
  "reference_id": "REF-1001"
}
```

Use a new reference ID for each transaction within an account. Repeating it returns `409 DUPLICATE_TRANSACTION` and has no effect; another account may reuse it. Internal fields are rejected by strict validation. The write endpoints have a 30 requests/minute per-IP limit.

## Tests and builds

The Vitest/Supertest suite starts an in-memory single-node replica set and exercises account initialization, strict input, credits/debits, underflow rollback, account-scoped idempotency, account isolation, query filtering, and concurrent debits. It requires the MongoDB memory-server binary on first run (downloaded by the test helper); the production database requirement remains Atlas replica set.

```sh
npm test
npm run build
```

## Production deployment

The production frontend is [transaction-ledger-three.vercel.app](https://transaction-ledger-three.vercel.app/) and the API is hosted on Render at [transaction-ledger-zwm0.onrender.com](https://transaction-ledger-zwm0.onrender.com). The frontend sends API requests to the Render service; it never connects to MongoDB directly.

### Render backend

Configure the Render Node service with the repository's `backend` directory as its root, build command `npm install && npm run build`, start command `npm start`, and health check path `/api/health`. Add these environment variables in the Render dashboard:

| Variable | Production value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection URI (keep secret; do not commit it) |
| `MONGODB_DB_NAME` | `transaction_ledger` |
| `FRONTEND_URL` | `https://transaction-ledger-three.vercel.app` |

Make sure the Atlas cluster is active, its database user has the needed access, and its network access settings allow connections from Render.

### Vercel frontend

Keep the Vercel project root at the repository root so it can use the npm workspaces. Set the build command to `npm run build` and the output directory to `frontend/dist`. Add this production environment variable in Vercel:

| Variable | Production value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://transaction-ledger-zwm0.onrender.com` |

The API base URL is the Render origin only; do not append `/api`. The frontend adds API paths itself. Redeploy Vercel after changing this variable. Redeploy Render after changing its environment variables.

### Verify the deployment

1. Open [`/api/health`](https://transaction-ledger-zwm0.onrender.com/api/health) on the Render service and confirm it responds successfully.
2. Open the Vercel frontend, create an account, and post a transaction.
3. If browser requests are blocked, confirm Render's `FRONTEND_URL` exactly matches the deployed frontend origin, with no trailing slash or path.

For API smoke checks, use `curl` or Postman. Create an account, use its returned `id`, then post a transaction with a fresh `reference_id` and check the balance and history routes.

