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

app.use(express.json());

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } 
  catch (err) {
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
  try {
    const products = await pool.query("SELECT * FROM products");
    res.send(products.rows);
  }
  catch(err) {
    return res.status(500).send("Internal server error");
  }
});

// GET single product
app.get("/products/:id", async (req, res) => {
  try {
    const { params: { id } } = req;
    const query = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    const product = query.rows[0];
    if(!product) {
      return res.status(404).send({ error: "Product not found" });
    }
    res.send(product);
  }
  catch(err) {
    return res.status(400).send({ error: "Invalid product ID" });
  }
});

// Used for POST /products
const allowed = ["id", "name", "price", "stock"];

// Used as safeguard against SQL injection in POST fields
function getProductFromReq(req, allowed) {
  let product = {};
  for(const key of allowed) {
    if(key in req.body) {
      product[key] = req.body[key];
    }
  }
  return product;
}

// POST create product
app.post("/products", async (req, res) => {
  // Get product
  let product = getProductFromReq(req, allowed);
  // Validate data
  if(!product.name || product.price === undefined) {
    return res.status(400).send("Missing required fields");
  }
  if(product.name.length > 255 || product.price < 0 || product.stock < 0) {
    return res.status(400).send("Invalid data");
  }
  // Insert into database
  const columns = Object.keys(product);
  const values = Object.values(product);
  const placeholders = values.map((_, i) => "$" + (i + 1));
  try {
    const query = await pool.query(
      `INSERT INTO products (${columns.join(", ")}) 
      VALUES (${placeholders.join(", ")})
      RETURNING *`, 
      values
    );
    product = query.rows[0];
    product.price = Number(product.price);
  }
  catch(err) {
    return res.status(500).send("Internal server error");
  }
  res.status(201).send(product);
});

// PUT update product
app.put("/products/:id", async (req, res) => {
  const { params: { id } } = req;
  const query = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
  const oldProduct = query.rows[0];
  if(!oldProduct) {
    return res.status(404).send("Non-existent product");
  }
  const updates = getProductFromReq(req, allowed);
  const { name, price, stock } = updates;
  if(name !== undefined && (name === "" || name.length > 255)) {
    return res.status(400).send("Invalid name");
  }
  if(price < 0 || stock < 0) {
    return res.status(400).send("Invalid data");
  }
  const columns = Object.keys(updates);
  const values = Object.values(updates);
  const colAssign = columns.map((col, i) => `${col} = $${i+1}`);
  values.push(id);
  const updateQuery = await pool.query(
    `UPDATE products
    SET ${colAssign.join(", ")}
    WHERE id=$${values.length}
    RETURNING *`,
    values
  );
  const updatedProduct = updateQuery.rows[0];
  res.send(updatedProduct);
});

// DELETE product
app.delete("/products/:id", async (req, res) => {
  // TODO: 1. Delete from database
  //       2. Handle success/failure
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
