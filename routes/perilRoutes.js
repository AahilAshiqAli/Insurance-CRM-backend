const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = router;

router.get("/", authMiddleware, (req, res) => {
  const query = `
      SELECT peril_id, peril_name, peril_description FROM perils
    `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving policies:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

router.post("/", authMiddleware, (req, res) => {
  // Destructure the peril data from the request body
  const { peril_name, peril_description } = req.body;

  // Validate input data
  if (!peril_name || !peril_description) {
    return res
      .status(400)
      .json({ error: "Peril name and description are required" });
  }

  // SQL query to insert the new peril into the database
  const query = `
      INSERT INTO perils (peril_name, peril_description)
      VALUES (?, ?)
    `;

  // Execute the SQL query to insert the peril data
  connection.query(query, [peril_name, peril_description], (err, result) => {
    if (err) {
      console.error("Error adding peril:", err);
      return res.status(500).json({ error: "Database insertion error" });
    }

    // Return success response
    res.status(201).json({
      message: "Peril added successfully",
      perilId: result.insertId, // Return the ID of the inserted peril
    });
  });
});
