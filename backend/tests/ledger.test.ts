import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { app } from '../src/app.js';
import { closeDatabase, connectDatabase, getAccounts, getTransactions } from '../src/config/database.js';

let repl: MongoMemoryReplSet;
beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = repl.getUri();
  process.env.MONGODB_DB_NAME = 'ledger_test';
  await connectDatabase();
});
afterAll(async () => { await closeDatabase(); await repl?.stop(); });
beforeEach(async () => { await Promise.all([getAccounts().deleteMany({}), getTransactions().deleteMany({})]); });

async function createAccount(name = 'Asha Rao') {
  const res = await request(app).post('/api/accounts').send({ name });
  expect(res.status).toBe(201);
  return res.body.data;
}
const txn = (type: string, amount: number, reference_id = 'ref-1') => ({ type, amount, description: 'Test entry', reference_id });

describe('ledger business rules', () => {
  it('creates accounts with a zero balance and rejects client balance fields', async () => {
    const a = await createAccount();
    expect(a.balance).toBe(0);
    expect((await request(app).post('/api/accounts').send({ name: 'R', balance: 1000 })).status).toBe(400);
  });
  it('credits and debits in paise', async () => {
    const a = await createAccount();
    expect((await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('credit', 25.35))).status).toBe(201);
    expect((await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('debit', 10.1, 'ref-2'))).status).toBe(201);
    expect((await request(app).get(`/api/accounts/${a.id}/balance`)).body.data.balance).toBe(15.25);
  });
  it('rejects insufficient funds without changing balance or ledger', async () => {
    const a = await createAccount();
    expect((await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('debit', 1))).status).toBe(409);
    expect((await request(app).get(`/api/accounts/${a.id}/balance`)).body.data.balance).toBe(0);
    expect(await getTransactions().countDocuments()).toBe(0);
  });
  it('enforces idempotency within an account but permits a reference in another account', async () => {
    const a = await createAccount(), b = await createAccount('Neel Shah');
    const url = `/api/accounts/${a.id}/transactions`;
    expect((await request(app).post(url).send(txn('credit', 5))).status).toBe(201);
    const duplicate = await request(app).post(url).send(txn('credit', 5));
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_TRANSACTION');
    expect((await request(app).post(`/api/accounts/${b.id}/transactions`).send(txn('credit', 5))).status).toBe(201);
    expect(await getTransactions().countDocuments()).toBe(2);
  });
  it('validates transaction fields and returns 404 for unknown accounts', async () => {
    const a = await createAccount();
    expect((await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('wire', 5))).status).toBe(400);
    expect((await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('credit', 0))).status).toBe(400);
    expect((await request(app).post('/api/accounts/missing/transactions').send(txn('credit', 5))).status).toBe(404);
  });
  it('filters account history by type', async () => {
    const a = await createAccount();
    await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('credit', 10, 'one'));
    await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('debit', 3, 'two'));
    const res = await request(app).get(`/api/accounts/${a.id}/transactions?type=debit&page=1&limit=10`);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items[0].type).toBe('debit');
  });
  it('serializes concurrent debits so the balance never becomes negative', async () => {
    const a = await createAccount();
    await request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('credit', 10, 'seed'));
    const responses = await Promise.all([1,2,3,4].map(i => request(app).post(`/api/accounts/${a.id}/transactions`).send(txn('debit', 7, `debit-${i}`))));
    expect(responses.filter(r => r.status === 201)).toHaveLength(1);
    expect((await request(app).get(`/api/accounts/${a.id}/balance`)).body.data.balance).toBe(3);
    expect(await getTransactions().countDocuments({ account_id: a.id, type: 'debit' })).toBe(1);
  });
});
