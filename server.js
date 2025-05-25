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
    res.status(500).send("Internal server error");
  }
});

// GET single product
app.get("/products/:id", async (req, res) => {
  try {
    const { params: { id } } = req;
    const query = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    const product = query.rows[0];
    if(!product) {
      res.status(404).send("Product not found");
    }
    res.send(product);
  }
  catch(err) {
    res.status(400).send("Invalid product ID");
  }
});

// POST create product
app.post("/products", async (req, res) => {
  // Prevent SQL injection in fields
  const allowed = ["name", "price", "stock"];
  let product = {};
  for(const key of allowed) {
    if(key in req.body) {
      product[key] = req.body[key];
    }
  }
  // Validate data
  const { name, price, stock } = product;
  if(name === undefined || price === undefined || name === "") {
    return res.status(400).send("Missing required fields");
  }
  if(name.length > 255 || price < 0 || (stock && stock < 0)) {
    return res.status(400).send("Invalid data");
  }
  // Insert into database
  const columns = Object.keys(product);
  const values = Object.values(product);
  const placeholders = values.map((_, i) => "$" + (i + 1));
  try {
    await pool.query(
      `INSERT INTO products (${columns.join(", ")}) 
      VALUES (${placeholders.join(", ")})`, values
    );
  }
  catch(err) {
    return res.status(500).send("Internal server error");
  }
  res.send(product);
});

// PUT update product
app.put("/products/:id", async (req, res) => {
  // TODO: 1. Get ID from params
  //       2. Validate inputs
  //       3. Update database
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
