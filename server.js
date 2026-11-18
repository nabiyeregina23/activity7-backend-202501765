require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const guidePage = require("./guide");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

// API guide page
app.set("trust proxy", 1);
app.get("/", (req, res) => {
  const baseUrl = req.protocol + "://" + req.get("host");
  res.status(200).type("html").send(guidePage(baseUrl));
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database unavailable." });
  }
});

// Record routes
app.use("/api/records", require("./routes/records"));

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handler (four parameters)
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});