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
    //await pool.query("SELECT * FROM products");
    res.json(await pool.query("SELECT * FROM products"));
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// GET single product
app.get("/products/:id", async (req, res) => {
  // TODO: 1. Get ID from params
  //       2. Query database
  //       3. Handle not found case
  try{
    const id = req.params.id;
    //const {id} = req.params;
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    // const result = await pool.query("SELECT * From products where id = ${id}");
    //handle not found case
    if(result.rows[0] === 0){ //cuz what we care is in rows, which is an array, const {rows} = product
      return res.status(404).json({status: "error", database: "Product not found"});
    }

    res.json(result.rows[0]);
  } catch(err){
    res.status(500).json({status: "error", database: "disconnected"});
  }
});

// POST create product
app.post("/products", async (req, res) => {
  // TODO: 1. Validate required fields (name, price)
  //       2. Insert into database
  //       3. Return new product
  try{
    const {name, price} = req.body;
    if(!name || price === undefined){
      return res.status(400).json({error: "missing name and price"});
    }
    const result = await pool.query("INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *",
      [name, price]
    );

    res.status(201).json(result.rows[0]);
  } catch(err){
    res.status(500).json({status: "error", database: "disconnected"});
  }

});

// PUT update product
app.put("/products/:id", async (req, res) => {
  // TODO: 1. Get ID from params
  //       2. Validate inputs
  //       3. Update database
    
    try{
    const {id} = req.params;
    const {name, price} = req.body;

    if(name !== undefined || price !== undefined){
      return res.status(400).json({error: "Invalid data"});
    }

    const result = await pool.query("UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *",[name, price, id]);

    res.json(result.rows[0]);

      
    } catch(err){
      res.status(500).json({status: "error", database: "disconnected"});
    }

});

// DELETE product
app.delete("/products/:id", async (req, res) => {
  // TODO: 1. Delete from database
  //       2. Handle success/failure
  try{
    const {id} = req.params.id;
    
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ status: "success", message: "Product deleted" });

      
    } catch(err){
      res.status(500).json({status: "error", database: "disconnected"});
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
