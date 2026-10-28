# Transaction Ledger

A full stack account ledger built for the Full Stack Developer assessment. It lets users create accounts, post credits and debits, check balances, and browse transaction history. Credit and debit operations update an account balance and add its ledger entry in one MongoDB transaction.

The current implementation has no authentication and no money transfer endpoint. See [Limitations and future improvements](#limitations-and-future-improvements) for the current scope.

## Live demo and repository

- **GitHub:** [mdakram2002/transaction-ledger](https://github.com/mdakram2002/transaction-ledger)
- **Frontend:** [transaction-ledger-nine.vercel.app](https://transaction-ledger-nine.vercel.app/)
- **Backend:** [transaction-ledger-zwm0.onrender.com](https://transaction-ledger-zwm0.onrender.com)
- **Health route:** [GET /api/health](https://transaction-ledger-zwm0.onrender.com/api/health)

## Project objectives and implemented features

The project demonstrates a React client and an Express API backed by MongoDB. Its implemented features are:

- Create accounts with a generated UUID and a zero opening balance.
- Search accounts by name and browse them with pagination.
- Post credit and debit transactions with a description and reference ID.
- Retrieve an account and its current balance.
- Browse account-specific or global transaction history, with optional credit/debit filtering and pagination.
- Keep balance changes and corresponding ledger entries atomic using MongoDB transactions.
- Reject debits that would make an account balance negative.
- Reject reused transaction reference IDs within the same account.
- Validate request bodies and query parameters with Zod.
- Apply a rate limit to account creation and transaction writes.

These features are implemented in the repository's routes, controllers, validators, and services. The API has no authentication, account update/delete operation, transaction edit/delete operation, or money transfer endpoint.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router, Axios, Tailwind CSS, Lucide React |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB Node.js driver and MongoDB Atlas or another replica set |
| Validation and middleware | Zod, `cors`, `express-rate-limit`, `dotenv` |
| Tests | Vitest, Supertest, `mongodb-memory-server` |
| Monorepo | npm workspaces and a root `package-lock.json` |

## Architecture and repository structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/       # Environment variables and MongoDB connection/indexes
│   │   ├── controllers/  # HTTP request handling and response serialization
│   │   ├── middleware/   # Async route wrapper, error handler, write rate limit
│   │   ├── routes/       # Health, account, and transaction routes
│   │   ├── services/     # Account and transaction business logic
│   │   ├── types/        # Account, ledger transaction, pagination types
│   │   ├── utils/        # HTTP errors and public response serializers
│   │   └── validators/   # Zod request and query schemas
│   ├── tests/            # API and ledger integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared UI and application shell
│   │   ├── pages/        # Dashboard, accounts, account detail, transactions
│   │   ├── utils/        # Currency and date formatting
│   │   └── api.ts        # Axios client and API response types
│   └── package.json
├── package.json          # Workspace scripts
└── package-lock.json     # Lockfile for both workspaces
```

The frontend calls the backend over HTTP. It reads `VITE_API_BASE_URL` and defaults to `http://localhost:4000`. The API is mounted under `/api`; the frontend sends account and transaction requests to those routes. The backend uses CORS with origins from `FRONTEND_URL`.

## Prerequisites and installation

- Node.js 22 LTS and npm.
- A MongoDB replica set. MongoDB Atlas is suitable; a standalone MongoDB server does not support the multi-document transactions used by this application.

Run these commands from the repository root:

```sh
npm ci
```

For a local setup, copy the example files:

**PowerShell**

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

**macOS/Linux**

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set a real MongoDB URI and database name in `backend/.env`. Keep credentials out of source control. `.env` files are ignored by Git.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose | Example or default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string. Required at startup. | `mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Database name. Required at startup. | `transaction_ledger` |
| `FRONTEND_URL` | Allowed CORS origin or comma-separated origins. | `http://localhost:5173` |
| `PORT` | HTTP port. | `4000` when unset; Render can supply its own port. |
| `NODE_ENV` | Included in the example environment file. The application code does not currently read it. | `development` |

The backend fails to start if either MongoDB variable is missing or it cannot connect to MongoDB. The URI should identify a replica set because transaction writes require one.

### Frontend (`frontend/.env`)

| Variable | Purpose | Example or default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend origin used by the browser. Do not add `/api`. | `http://localhost:4000` |

Vite embeds `VITE_` variables in the built frontend, so this value is public. Never put database credentials in frontend variables.

## Running locally

Start the backend and frontend in separate terminals, from the repository root.

**Terminal 1 — backend**

```sh
npm run dev:backend
```

**Terminal 2 — frontend**

```sh
npm run dev:frontend
```

The frontend defaults to `http://localhost:5173` and the API defaults to `http://localhost:4000`. The backend loads `backend/.env`; Vite loads `frontend/.env`.

To create a production build of both workspaces:

```sh
npm run build
```

## API documentation

All routes are unauthenticated and use the `/api` prefix. Successful responses use `{ "success": true, "data": ... }`. Most reads return HTTP `200`; successful account and transaction creation returns HTTP `201`.

Account IDs and transaction IDs are UUID strings generated by the backend. Example IDs below are illustrative; they are not records from the live database.

### `GET /api/health`

Returns a basic API process status. It does not query MongoDB.

**Success — `200`**

```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

### `POST /api/accounts`

Creates an account with a zero balance. The body must contain only `name`; the value is trimmed and must contain 1–120 characters.

**Request**

```json
{ "name": "Asha Rao" }
```

**Success — `201`**

```json
{
  "success": true,
  "data": {
    "id": "e2d8c6d0-e4dd-4b70-8e43-24f8667a7412",
    "name": "Asha Rao",
    "balance": 0,
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

Extra body fields, including a client-supplied balance or ID, are rejected with `400 VALIDATION_ERROR`.

### `GET /api/accounts?page=1&limit=20&search=asha`

Lists accounts, optionally searching names with a case-insensitive substring match. Search input is trimmed and can be up to 120 characters. `page` defaults to `1`; `limit` defaults to `20` and must be between `1` and `100`.

**Success — `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "e2d8c6d0-e4dd-4b70-8e43-24f8667a7412",
        "name": "Asha Rao",
        "balance": 0,
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
  }
}
```

Accounts are ordered newest first. Invalid page or limit values return `400 VALIDATION_ERROR`.

### `GET /api/accounts/:accountId`

Returns one account using the backend-generated account ID.

**Success — `200`**

```json
{
  "success": true,
  "data": {
    "id": "e2d8c6d0-e4dd-4b70-8e43-24f8667a7412",
    "name": "Asha Rao",
    "balance": 0,
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

An ID that does not match an account returns `404 ACCOUNT_NOT_FOUND`. The route does not validate UUID syntax separately.

### `GET /api/accounts/:accountId/balance`

Returns the current balance for an account.

**Success — `200`**

```json
{
  "success": true,
  "data": {
    "account_id": "e2d8c6d0-e4dd-4b70-8e43-24f8667a7412",
    "balance": 15.25
  }
}
```

A missing account returns `404 ACCOUNT_NOT_FOUND`.

### `POST /api/accounts/:accountId/transactions`

Posts a credit or debit to the specified account. The body must contain exactly the fields shown below:

| Field | Type | Validation |
| --- | --- | --- |
| `type` | string | `credit` or `debit` |
| `amount` | number | Finite, greater than zero, no more than `1,000,000,000`, and at most two decimal places |
| `description` | string | Trimmed, 1–500 characters |
| `reference_id` | string | Trimmed, 1–120 characters; unique within this account |

**Request**

```json
{
  "type": "credit",
  "amount": 500,
  "description": "Initial deposit",
  "reference_id": "REF-1001"
}
```

**Success — `201`**

```json
{
  "success": true,
  "data": {
    "id": "7588b15c-9921-47de-a964-f66499777ace",
    "account_id": "e2d8c6d0-e4dd-4b70-8e43-24f8667a7412",
    "type": "credit",
    "amount": 500,
    "description": "Initial deposit",
    "reference_id": "REF-1001",
    "created_at": "2025-01-15T10:35:00.000Z"
  }
}
```

- Invalid or missing fields, unsupported types, extra fields, non-positive amounts, or amounts with more than two decimal places return `400`. Schema failures use `VALIDATION_ERROR`; amounts with excess decimal places use `INVALID_AMOUNT`.
- A missing account returns `404 ACCOUNT_NOT_FOUND`.
- Reusing a reference ID in the same account returns `409 DUPLICATE_TRANSACTION`. Another account may use the same reference ID.
- A debit larger than the current balance returns `409 INSUFFICIENT_FUNDS`; the balance and transaction history remain unchanged.

Credits and debits update the balance and insert the ledger record in a single MongoDB transaction. See [Database and transaction integrity](#database-and-transaction-integrity).

### `GET /api/accounts/:accountId/transactions?page=1&limit=20&type=credit`

Lists transactions for one account. `page` defaults to `1`, `limit` defaults to `20` and must be `1`–`100`; optional `type` must be `credit` or `debit`. The account must exist or the request returns `404 ACCOUNT_NOT_FOUND`.

**Success — `200`**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "7588b15c-9921-47de-a964-f66499777ace",
        "account_id": "e2d8c6d0-e4dd-4b70-8e43-24f8667a7412",
        "type": "credit",
        "amount": 500,
        "description": "Initial deposit",
        "reference_id": "REF-1001",
        "created_at": "2025-01-15T10:35:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
  }
}
```

Transactions are ordered newest first. Invalid query values return `400 VALIDATION_ERROR`.

### `GET /api/accounts/:accountId/transactions/:transactionId`

Returns one transaction scoped to the specified account.

**Success — `200`**

```json
{
  "success": true,
  "data": {
    "id": "7588b15c-9921-47de-a964-f66499777ace",
    "account_id": "e2d8c6d0-e4dd-4b70-8e43-24f8667a7412",
    "type": "credit",
    "amount": 500,
    "description": "Initial deposit",
    "reference_id": "REF-1001",
    "created_at": "2025-01-15T10:35:00.000Z"
  }
}
```

A transaction not found under that account returns `404 TRANSACTION_NOT_FOUND`.

### `GET /api/transactions?page=1&limit=20&type=debit`

Lists transactions across all accounts. Supports the same pagination defaults and limits as account history, and optional `type=credit` or `type=debit` filtering.

**Success — `200`**

Returns the same paginated response shape as account transaction history. Invalid query values return `400 VALIDATION_ERROR`.

## Business rules and validations

- Account names are trimmed, required, and limited to 120 characters.
- Accounts start with a zero balance. The API does not accept a starting balance.
- Transaction types are `credit` and `debit` only.
- Amounts are positive numeric rupee values with up to two decimal places. The backend stores them as integer paise (`balance_minor` and `amount_minor`); the UI formats amounts as INR. The API does not include a currency field.
- Descriptions are required, trimmed, and limited to 500 characters.
- Reference IDs are required, trimmed, and limited to 120 characters. Uniqueness is scoped to an account.
- Debits cannot exceed the available balance.
- Pagination uses positive integer pages and limits from 1 to 100. Defaults are page 1 and limit 20. When there are no matching records, `pages` is `0`.
- API request bodies are limited to 16 KB.
- Account creation and transaction creation are limited to 30 write requests per IP per minute; excess requests receive HTTP `429` from the rate-limit middleware.
- Extra fields in account creation and transaction creation bodies are rejected. The query schemas validate supported parameters but do not use strict mode.

## Database and transaction integrity

The database contains `accounts` and `transactions` collections. Account and transaction IDs are UUID strings. Public responses expose amounts in rupees, while stored amounts use integer paise. Timestamps are stored as dates and returned as ISO 8601 strings.

At startup, the backend creates unique indexes for account IDs, transaction IDs, and `(account_id, reference_id)`, plus indexes used for transaction history queries. A MongoDB replica set is required for multi-document transactions.

For each credit or debit, the backend:

1. Starts a MongoDB session transaction.
2. Checks whether the reference ID already exists for the account.
3. Updates the account balance. Debit updates require the existing balance to cover the amount.
4. Inserts the ledger transaction.
5. Commits both writes together.

If a debit cannot be covered or a requested account does not exist, the operation fails without inserting a ledger entry or changing the balance. The unique reference index also protects against duplicate references under concurrent requests. The API exposes no transaction or account update/delete operation.

## Error handling

Application errors use this shape:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "The account has insufficient funds for this debit"
  }
}
```

Validation errors include a `details` array containing paths and messages from Zod:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "name", "message": "<validation message>" }]
  }
}
```

| HTTP status | Codes or cause | Meaning |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR`, `INVALID_AMOUNT` | Invalid request body/query or an amount with more than two decimal places |
| `404` | `NOT_FOUND` | No route matched the request |
| `404` | `ACCOUNT_NOT_FOUND` | Account does not exist |
| `404` | `TRANSACTION_NOT_FOUND` | Transaction does not exist under the specified account |
| `409` | `DUPLICATE_TRANSACTION` | Reference ID has already been used within this account |
| `409` | `INSUFFICIENT_FUNDS` | Debit exceeds the account balance |
| `429` | Rate-limit middleware | Too many writes from the same IP in the time window |
| `500` | `INTERNAL_ERROR` | Unexpected errors are returned with a generic message |

The API does not implement authentication or authorization. Do not expose the service as a secure banking system.

## Assumptions and design decisions

### Implemented behavior

- The dashboard formats currency as INR; API amounts are plain numeric rupee values.
- Account IDs and transaction IDs are generated UUIDs.
- New accounts have no funds until credited.
- A reference ID identifies one transaction per account and may be reused on another account.
- The transaction endpoint changes one account at a time; there is no transfer operation.
- Database writes that make up one credit or debit use MongoDB session transactions.

### Limitations

- There is no user identity, authentication, authorization, or account ownership model.
- There is no money transfer operation between two accounts.
- The health route reports API status only; it does not check MongoDB connectivity.
- The backend does not validate that path IDs are UUID-shaped; it looks up the supplied string and returns not found when no record matches.
- The application has no currency conversion or per-account currency setting.

## Testing and build verification

The backend test suite uses Vitest, Supertest, and an in-memory single-node MongoDB replica set. It covers zero-balance account creation, input validation, credit/debit behavior, insufficient-balance rollback, per-account reference uniqueness, history filtering, and concurrent debits. `mongodb-memory-server` may download a MongoDB binary the first time the tests run.

Run the available test and build commands from the repository root:

```sh
npm test
npm run build
```

The root build script builds the backend workspace and then the frontend workspace. In this documentation update, a clean workspace install and both workspace production builds completed successfully. The test suite was not run as part of this README update.

## Deployment

The repository contains npm workspace configuration but no Render or Vercel deployment manifest. Provider settings are managed in their dashboards.

### Render backend

For a service using the root npm workspace and root lockfile, configure the repository root as the service root directory. The current root build script compiles both workspaces. Use:

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start --workspace=ledger-backend`
- **Health check path:** `/api/health`

Set these Render environment variables:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Your secret Atlas replica-set URI |
| `MONGODB_DB_NAME` | `transaction_ledger` |
| `FRONTEND_URL` | `https://transaction-ledger-nine.vercel.app` |

Allow Render to connect to the Atlas cluster through its network access settings. Never commit the real MongoDB URI.

### Vercel frontend

The frontend uses Vite. Keep the repository root as the project root when using the root npm workspaces; the root build outputs the Vite site to `frontend/dist`. Set the production environment variable:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://transaction-ledger-zwm0.onrender.com` |

Use the Render origin only; the frontend API client supplies the `/api/...` paths. Redeploy after changing environment variables. Set Render `FRONTEND_URL` to the frontend's exact origin so browser requests are allowed by CORS.

## Limitations and future improvements

The current assessment implementation focuses on single-account credits and debits. Potential future improvements include authentication and authorization, a two-account transfer endpoint with atomic debit/credit behavior, configurable currencies, audit controls, and stronger API health checks. These are not implemented features.
