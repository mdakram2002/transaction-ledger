import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  get mongoUri() {
    return process.env.MONGODB_URI;
  },
  get mongoDbName() {
    return process.env.MONGODB_DB_NAME;
  },
  frontendOrigins:
    process.env.FRONTEND_URL?.split(",").map((origin) => origin.trim()) ??
    "http://localhost:5173",
};
