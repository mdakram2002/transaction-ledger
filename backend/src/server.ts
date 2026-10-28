import { app } from "./app.js";
import { env } from "./config/env.js";
import {
  closeDatabase,
  connectDatabase,
} from "./config/database.js";

await connectDatabase();
const server = app.listen(env.port, () =>
  console.log(`Ledger API listening on ${env.port}`),
);
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
  const shutdownTimeout: NodeJS.Timeout = setTimeout(
    () => process.exit(1),
    10_000,
  );
  shutdownTimeout.unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
