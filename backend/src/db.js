import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://lawabc:lawabc_password@localhost:5432/lawabc",
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

export const query = (text, params) => pool.query(text, params);
