const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const connection = require("../config/database"); // MySQL database connection

// Register Route
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  connection.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Registration successful" });
    }
  );
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("Database error:", err); // Log the actual error
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }
      if (results.length === 0)
        return res.status(400).json({ error: "User not found" });

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
        expiresIn: "1000h",
      });
      res.json({ message: "Login successful", token });
    }
  );
});

module.exports = router;
