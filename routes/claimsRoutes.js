const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

// GET /claims/:id - Retrieve a single claim by ID
router.get("/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
    claim_id,
    incidentDate,
    claimType,
    repairCost,
    incidentLocation,
    status,
    incidentDescription,
    policy_id
FROM 
    claims
WHERE 
    policy_id = ?
  `;

  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error retrieving claims:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Claims not found" });
    }
    res.json(result); // Returning the result for the claims
  });
});

// POST /claims - Add a new claim
router.post("/", authMiddleware, (req, res) => {
  const {
    incidentDate,
    claimType,
    repairCost,
    incidentLocation,
    incidentDescription,
    policy_id,
  } = req.body;

  const query = `
    INSERT INTO claims (
    incidentDate,
    claimType,
    repairCost,
    incidentLocation,
    incidentDescription,
    policy_id
) 
VALUES (
    ?, 
    ?,  
    ?, 
    ?, 
    ?,  
    ?  
);
  `;

  connection.query(
    query,
    [
      incidentDate,
      claimType,
      repairCost,
      incidentLocation,
      incidentDescription,
      policy_id,
    ],
    (err, result) => {
      if (err) {
        console.error("Error inserting claim:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Retrieve the insertId (policy_id) from the result
      const claimId = result.insertId;

      // Respond with success message and policy ID
      res.status(201).json({
        message: "Claim created successfully",
        claimId: claimId,
      });
    }
  );
});

module.exports = router;
