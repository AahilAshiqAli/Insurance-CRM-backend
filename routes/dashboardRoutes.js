const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
  const metrics = {
    totalPolicies: "SELECT COUNT(*) as total FROM policies",
    claimsProcessed:
      "SELECT COUNT(*) as processed FROM claims WHERE claim_status = 'In Process'",
    avgPremium: "SELECT AVG(premium_amount) as avg FROM policies",
    claimApprovalRate: `
        SELECT 
          ROUND((SUM(CASE WHEN claim_status = 'In Process' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) 
          as rate 
        FROM claims
      `,
    bestProduct: `SELECT 
    p.product_id,
    p.product_name,
    p.package_name,
    COUNT(pol.policy_id) AS total_policies
FROM 
    products p
LEFT JOIN 
    policies pol ON p.product_id = pol.product_id
GROUP BY 
    p.product_id
ORDER BY 
    total_policies DESC
LIMIT 1`,
  };

  const queries = Object.values(metrics);
  let results = {};

  queries.forEach((query, idx) => {
    connection.query(query, (err, data) => {
      if (err) throw err;
      const key = Object.keys(metrics)[idx];
      results[key] = data[0];
      if (Object.keys(results).length === queries.length) {
        res.json(results);
      }
    });
  });
});

module.exports = router;
