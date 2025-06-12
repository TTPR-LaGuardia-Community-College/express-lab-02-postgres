require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const app = express();
const PORT = 3000;

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
});

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.get("/", (req, res) => {
  res
    .json({
      "Express & Postgres Lab - Home Page":
        "Welcome to the Express & Postgres Lab!",
    })
    .status(200);
});

// 🎯 STUDENT TASKS: Implement these routes
// ------------------------------------------------

// GET all products
app.get("/products", async (req, res) => {
  // TODO: Query database and return all products
try {
  const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
  res.json(result.rows);
}catch (err) {
  console.error("Database error:", err);
  res.status(500).json({ error: "Internal Server Error"});
}
});

// GET single product
// GET single product by ID
app.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id); // Step 1: Read and convert ID

  // Step 2: If not a valid number
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    // Step 3: Query database
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);

    // Step 4: Not found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Step 5: Found → return product
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST create product
app.post("/products", async (req, res) => {
  // TODO: 1. Validate required fields (name, price)
  //       2. Insert into database
  //       3. Return new product
  const { name, price, stock = 0 } = req.body; //Geting data

  // Validating
  if (!name || typeof price !== "number" || price < 0 || stock < 0 || name.trim() === "") {
    return res.status(400).json({ error: "Invalid input data" });
  }

  try {
    //Insert into database
    const result = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
      [name.trim(), price, stock]
    );

    //Return the new product 
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update product
app.put("/products/:id", async (req, res) => {
  // TODO: 1. Get ID from params
  //       2. Validate inputs
  //       3. Update database

   const id = parseInt(req.params.id); //Get ID

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  const { name, price, stock } = req.body;

  // Validate fields if they exist
  if (
    (name !== undefined && name.trim() === "") ||
    (price !== undefined && typeof price !== "number") ||
    (price !== undefined && price < 0) ||
    (stock !== undefined && stock < 0)
  ) {
    return res.status(400).json({ error: "Invalid update data" });
  }

  try {
    //Check if product exists
    const existing = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const current = existing.rows[0];
    const updated = {
      name: name !== undefined ? name : current.name,
      price: price !== undefined ? price : current.price,
      stock: stock !== undefined ? stock : current.stock,
    };

    const result = await pool.query(
      "UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING *",
      [updated.name, updated.price, updated.stock, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE product
app.delete("/products/:id", async (req, res) => {
  // TODO: 1. Delete from database
  //       2. Handle success/failure

  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ------------------------------------------------
// 🚫 Do not modify below this line

app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
