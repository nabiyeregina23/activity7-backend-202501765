require("dotenv").config();
const { Pool } = require("pg");

// Drop the "?sslmode=...&channel_binding=..." options so the SSL setting below is used
const url = (process.env.DATABASE_URL || "").split("?")[0];

const pool = new Pool({
  connectionString: url,
  ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 20000
});

// Stops an idle dropped connection from crashing the server
pool.on("error", (error) => {
  console.error("Idle database connection error:", error.message);
});

module.exports = pool;