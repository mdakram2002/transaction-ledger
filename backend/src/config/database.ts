import { MongoClient, type Collection } from "mongodb";
import { env } from "./env.js";
import type { Account, LedgerTransaction } from "../types/models.js";

let client: MongoClient;
let accounts: Collection<Account>;
let transactions: Collection<LedgerTransaction>;

export async function connectDatabase() {
  if (!env.mongoUri || !env.mongoDbName) {
    throw new Error("MONGODB_URI and MONGODB_DB_NAME are required");
  }
  client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();

  const db = client.db(env.mongoDbName);
  accounts = db.collection<Account>("accounts");
  transactions = db.collection<LedgerTransaction>("transactions");
  await Promise.all([
    accounts.createIndex({ id: 1 }, { unique: true }),
    transactions.createIndex({ id: 1 }, { unique: true }),
    transactions.createIndex(
      { account_id: 1, reference_id: 1 },
      { unique: true },
    ),
    transactions.createIndex({ account_id: 1, created_at: -1, id: -1 }),
    transactions.createIndex({
      account_id: 1,
      type: 1,
      created_at: -1,
      id: -1,
    }),
  ]);
}

export const getAccounts = () => accounts;
export const getTransactions = () => transactions;
export const getMongoClient = () => client;

export async function closeDatabase() {
  if (client) await client.close();
}
