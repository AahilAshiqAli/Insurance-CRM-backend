const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = router;

router.post("/:productId", authMiddleware, (req, res) => {
  // Extract productId from the request params
  const { productId } = req.params;

  // Check if the request body contains the necessary data
  if (
    !req.body.data ||
    !Array.isArray(req.body.data) ||
    req.body.data.length === 0
  ) {
    return res.status(400).json({ error: "No risk descriptions provided" });
  }

  // Prepare the data for insertion
  const riskDescriptions = req.body.data.map((item) => ({
    productId: item.productId,
    riskDescription: item.riskDescription,
  }));

  // Step 1: Check if the product exists
  const checkProductExistsQuery = `SELECT * FROM products WHERE product_id = ?`;

  connection.query(checkProductExistsQuery, [productId], (err, result) => {
    if (err) {
      console.error("Error checking product existence:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Step 2: Insert the risk descriptions
    const insertRiskDescriptionsQuery = `
      INSERT INTO product_risk_questionaire (product_id, risk_discription)
      VALUES ?
    `;

    // Prepare values for the insert query
    const values = riskDescriptions.map((item) => [
      item.productId,
      item.riskDescription,
    ]);

    connection.query(insertRiskDescriptionsQuery, [values], (err, result) => {
      if (err) {
        console.error("Error inserting risk descriptions:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // If insertion is successful, send a success response
      res.status(201).json({
        message: "Risk descriptions inserted successfully",
        data: result,
      });
    });
  });
});

router.delete("/:productId", authMiddleware, (req, res) => {
  // Extract product_id from the request params
  const { productId } = req.params;

  // Step 1: Check if the product exists
  const checkProductExistsQuery = `SELECT risk_id FROM product_risk_questionaire WHERE product_id = ?`;

  connection.query(checkProductExistsQuery, [productId], (err, result) => {
    if (err) {
      console.error("Error checking product existence:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // If the product does not exist, return a 404 error
    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Step 2: If the product exists, proceed with deletion
    const deleteProductQuery = `DELETE FROM product_risk_questionaire WHERE product_id = ?`;

    connection.query(deleteProductQuery, [productId], (err, result) => {
      if (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
          console.error(
            "Error: Cannot delete product due to foreign key constraint"
          );
          return res.status(400).json({
            error:
              "This product cannot be deleted because it is associated with existing policies",
          });
        }
        console.error("Error deleting product:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // If deletion is successful
      res.status(200).json({
        message: "Product and associated data deleted successfully",
      });
    });
  });
});
