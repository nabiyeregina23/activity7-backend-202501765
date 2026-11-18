const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLUMNS = "id, title, category, description, status";
const MAX_ID = 2147483647;

// Check the id in the address. Sends the error itself and returns null if bad.
function getId(req, res) {
  const text = req.params.id;
  if (!/^[1-9][0-9]*$/.test(text)) {
    res.status(400).json({ message: "Id must be a positive whole number." });
    return null;
  }
  const id = Number(text);
  if (id > MAX_ID) {
    res.status(404).json({ message: "Record not found." });
    return null;
  }
  return id;
}

// Check the four editable fields. Returns { data } or { error }.
function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }
  const names = ["title", "category", "description", "status"];
  for (const name of names) {
    if (typeof body[name] !== "string") {
      return { error: name + " is required and must be text." };
    }
  }
  const data = {
    title: body.title.trim(),
    category: body.category.trim(),
    description: body.description.trim(),
    status: body.status.trim()
  };
  if (data.title.length < 3 || data.title.length > 80)
    return { error: "Title must have 3 to 80 characters." };
  if (data.category.length < 2 || data.category.length > 40)
    return { error: "Category must have 2 to 40 characters." };
  if (data.description.length < 5 || data.description.length > 300)
    return { error: "Description must have 5 to 300 characters." };
  if (!STATUSES.includes(data.status))
    return { error: "Status must be Pending, In progress or Completed." };
  return { data };
}

// GET all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT " + COLUMNS + " FROM records ORDER BY id"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET one record
router.get("/:id", async (req, res, next) => {
  try {
    const id = getId(req, res);
    if (id === null) return;
    const result = await pool.query(
      "SELECT " + COLUMNS + " FROM records WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST create a record
router.post("/", async (req, res, next) => {
  try {
    const check = validate(req.body);
    if (check.error) return res.status(400).json({ message: check.error });
    const d = check.data;
    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) " +
      "VALUES ($1, $2, $3, $4) RETURNING " + COLUMNS,
      [d.title, d.category, d.description, d.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT update a record
router.put("/:id", async (req, res, next) => {
  try {
    const id = getId(req, res);
    if (id === null) return;
    const check = validate(req.body);
    if (check.error) return res.status(400).json({ message: check.error });
    const d = check.data;
    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, " +
      "status = $4 WHERE id = $5 RETURNING " + COLUMNS,
      [d.title, d.category, d.description, d.status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE a record
router.delete("/:id", async (req, res, next) => {
  try {
    const id = getId(req, res);
    if (id === null) return;
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;