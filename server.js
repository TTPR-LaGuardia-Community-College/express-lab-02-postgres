require("dotenv").config();
const express = require("express");
const {Pool} = require("pg");
const app = express();
const PORT = 3000;

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT,
});

app.use(express.json())

// Health Check Endpoint
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({status: "ok", database: "connected"});
    } catch (err) {
        res.status(500).json({status: "error", database: "disconnected"});
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
        const products = await pool.query("SELECT * FROM products");
        res.status(200).json(products.rows);
    } catch (err) {
        res.status(500).json({status: "error", database: "disconnected"});
    }
});

// GET single product
app.get("/products/:id", async (req, res) => {
    // TODO: 1. Get ID from params
    //       2. Query database
    //       3. Handle not found case
    const {id} = req.params

    try {
        const result = await pool.query(`SELECT *
                                         FROM products
                                         WHERE id = $1`, [id]);
        if (result.rows.length > 0) {
            res.status(200).send(
                result.rows[0]
            );
        } else {
            res.status(404).send(
                {
                    error: 'Product not found'
                });
        }
    } catch {
        res.status(400).send({
            error: 'Invalid product ID'
        });
    }

});

// POST create product
app.post("/products", async (req, res) => {
    // TODO: 1. Validate required fields (name, price)
    //       2. Insert into database
    //       3. Return new product



    const {name, price, stock} = req.body;
    console.log("data: -----------" + name, price, stock);
    const parsedPrice = Number.parseFloat(price);
    const parsedStock = Number.parseInt(stock);
    try {

        // console.log("data: ------" + name, parsedPrice, parsedStock, id);
        if(stock < 1) {
            console.log("Stock not found");
            return  res.status(400).send({
                error: 'Stock does not exist'
            })
        }

        if(name === '' || isNaN(parsedPrice) || parsedPrice <= 0 || name.length > 20) {
            console.log("price not found");
            return res.status(400).send({
                error: 'Please enter a valid price or name'
            })
        }
        if (!name) {
            console.log("name not found");
            return res.status(400).send({
                error: 'Missing required field'
            })
        }
        if ( typeof name !== "string") {
            return res.status(400).send({
                error: 'Invalid name'
            })
        }

        const result = await pool.query(
            "INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
            [name, parsedPrice, parsedStock]
        )

        const inserted = result.rows[0];
        inserted.price = parseFloat(inserted.price);
        res.status(201).json(inserted);
    } catch {
        res.status(400).send({})
    }

});

// PUT update product 
app.put("/products/:id", async (req, res) => {
    // TODO: 1. Get ID from params
    //       2. Validate inputs
    //       3. Update database
    const {id} = req.params;

    if(isNaN(parseInt(req.params.id))) {
        return res.status(404).send({
            error: 'Invalid product ID'
        })
    }

    const result = await pool.query(
        "SELECT * FROM products WHERE id = $1", [id]
    )

    if (result.rows.length <= 0) {
        return res.status(404).send({
            error: 'Product not found'
        })
    }


    const {price, stock, name} = req.body;
    console.log(req.body);
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({ error: 'Invalid name' });
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
        return res.status(400).json({ error: 'Invalid price' });
    }

    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
        return res.status(400).json({ error: 'Invalid stock' });
    }

    try {
        console.log(req.body);

        const fields = [];
        const values = [];
        let index = 1;



        if (price !== undefined) {
            fields.push(`price = $${index++}`);
            console.log("Price: " + index);
            values.push(parseFloat(price));
            console.log(`price --- ${price}`);
        }

        if(stock !== undefined) {
            fields.push(`stock = $${index++}`);
            console.log("Stock: " + index);
            values.push(parseFloat(stock));
            console.log(`stock --- ${stock}`);
        }

        if (name !== undefined) {
            fields.push(`name = $${index++}`);
            console.log("name: " + index);
            values.push(name);
            console.log(`name --- ${name}`);
        }


        values.push(id);
        console.log(`[the fields ${fields.join(', ')}]`);
        console.log("The values " + values);
        console.log("The index is: " + index);
        const sql = `UPDATE products SET ${fields.join(`, `)} WHERE id = $${index} RETURNING *`;
        const result = await pool.query(sql,values);
        console.log("sql ------");
        console.log(sql);
        const inserted = result.rows[0];
        inserted.price = parseFloat(inserted.price);
        inserted.stock = parseInt(inserted.stock);

        const responseBody = {};
        if (price !== undefined) responseBody.price = inserted.price;
        if (stock !== undefined) responseBody.stock = inserted.stock;

        if (Object.keys(responseBody).length === 1 && stock !== undefined) {
            responseBody.name = inserted.name;
            responseBody.price = inserted.price;
        }

        res.status(200).json(responseBody);
    } catch (err) {
        console.log("Failed: " + id, price, stock, name);
        res.status(500).send({

            error: 'Update product error'
        })
    }

});

// DELETE product
app.delete("/products/:id", async (req, res) => {
    // TODO: 1. Delete from database
    //       2. Handle success/failure

    const {id} = req.params;

    if(isNaN(Number.parseInt(id))) {
        return res.status(400).send({
            error: 'Invalid product ID'
        })
    }
    const result = await pool.query(`SELECT *
                                         FROM products
                                         WHERE id = $1`, [id]);
    if (result.rows.length <= 0) {
        return res.status(404).send({
            error: 'Product not found'
        })
    }

    try {
        const deletedData = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
        res.status(204).json(deletedData);

    } catch (err) {
        res.status(500).send({
            error: 'Update product error'
        })
    }




});

// ------------------------------------------------
// 🚫 Do not modify below this line

app.use(express.json());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: "Internal server error"});
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
