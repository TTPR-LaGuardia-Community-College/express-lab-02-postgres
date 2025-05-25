require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const app = express();
const PORT = 3000;

app.use(express.json());

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
});

// Health Check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    "Express & Postgres Lab - Home Page":
      "Welcome to the Express & Postgres Lab!",
  });
});

// GET all products
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET single product
app.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = result.rows[0];
    product.price = Number(product.price);
    product.stock = Number(product.stock);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST create product
app.post("/products", async (req, res) => {
  const { name, price, stock } = req.body;

  if (
    typeof name !== "string" || name.trim() === "" || name.length > 255 ||
    typeof price !== "number" || price < 0 ||
    (stock !== undefined && (typeof stock !== "number" || stock < 0))
  ) {
    return res.status(400).json({ error: "Invalid product data" });
  }

  const safeStock = stock === undefined ? 0 : stock;

  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
      [name, price, safeStock]
    );
    const product = result.rows[0];
    product.price = Number(product.price);
    product.stock = Number(product.stock);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error inserting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT update product
app.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, stock } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  if (
    (name !== undefined && (typeof name !== "string" || name.trim() === "")) ||
    (price !== undefined && (typeof price !== "number" || price < 0)) ||
    (stock !== undefined && (typeof stock !== "number" || stock < 0))
  ) {
    return res.status(400).json({ error: "Invalid update data" });
  }

  try {
    const result = await pool.query(
      `UPDATE products SET 
        name = COALESCE($1, name), 
        price = COALESCE($2, price), 
        stock = COALESCE($3, stock) 
       WHERE id = $4 
       RETURNING *`,
      [
        name === undefined ? null : name,
        price === undefined ? null : price,
        stock === undefined ? null : stock,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = result.rows[0];
    product.price = Number(product.price);
    product.stock = Number(product.stock);
    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE product
app.delete("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid product ID provided." });
  }

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    if (result.rowCount > 0) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: `Product with ID ${id} not found.` });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
