require("dotenv").config();
const fs = require("fs");
const pool = require("./db");

async function run() {
  await pool.query(fs.readFileSync("schema.sql", "utf8"));
  const result = await pool.query("SELECT COUNT(*) FROM records");
  if (Number(result.rows[0].count) === 0) {
    await pool.query(fs.readFileSync("seed.sql", "utf8"));
    console.log("Table created and 8 records added.");
  } else {
    console.log("Table already has records. Nothing added.");
  }
  await pool.end();
}

run().catch(error => {
  console.error("Setup failed:", error.message);
  process.exit(1);
});