const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = router;

// We have five tables named products, product_perils, product_renewal_rules, produt_asset_details, product_documents_upload

//We want to get all products data from only products table
router.get("/", authMiddleware, (req, res) => {
  const query = `
    SELECT 
      p.product_id, 
      p.product_name, 
      p.product_abbreviation, 
      p.package_name, 
      p.policy_type, 
      p.policy_period, 
      p.temporary_cn_min_time, 
      p.temporary_cn_max_time, 
      p.customer_type
    FROM 
      products p
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving products:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json(results);
  });
});

// We want to get all information for a particular product
router.get("/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const query = `
  SELECT 
    p.product_id, 
    p.product_name, 
    p.product_abbreviation, 
    p.package_name, 
    p.policy_type, 
    p.policy_period, 
    p.temporary_cn_min_time, 
    p.temporary_cn_max_time, 
    p.customer_type,
    pr.peril_id, 
    pr.peril_name, 
    pr.peril_description, 
    pad.manufacturer, 
    pad.model, 
    pad.imei_serial_number, 
    pdu.cnic, 
    pdu.receipt_of_purchase, 
    pdu.warranty_card_picture, 
    pdu.user_picture, 
    pdu.bank_statement, 
    pdu.ntn_number, 
    prr.generate_renewal, 
    prr.renewal_generation_frequency, 
    prr.renewal_generation_value, 
    prr.no_claim_discount, 
    prr.sum_insured_reduction,
    prq.risk_id,
    prq.risk_discription,
    pcr.City,
    pcr.Age,
    pcr.Profession,
    pcr.IncomeCategory,
    pcr.Business_Type,
    pcr.Customer_Badge
  FROM 
      products p
  LEFT JOIN 
      product_perils pp ON p.product_id = pp.product_id
  LEFT JOIN 
      perils pr ON pp.peril_id = pr.peril_id
  LEFT JOIN 
      product_asset_details pad ON p.product_id = pad.product_id
  LEFT JOIN 
      product_document_uploads pdu ON p.product_id = pdu.product_id
  LEFT JOIN 
      product_renewal_rules prr ON p.product_id = prr.product_id
  LEFT JOIN 
      product_risk_questionaire prq ON p.product_id = prq.product_id
  LEFT JOIN 
      product_customer_rules pcr ON p.product_id = pcr.product_id
  WHERE 
      p.product_id = ?
  `;

  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error retrieving policy:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result); // I am sending multiple entries because multiple entries
  });
});

// We want to post all information for a particular product
router.post("/", authMiddleware, (req, res) => {
  // Destructure the request body to get all the necessary details
  const {
    product_name,
    product_abbreviation,
    package_name,
    policy_type,
    policy_period,
    temporary_cn_min_time,
    temporary_cn_max_time,
    customer_type,
  } = req.body;

  // Step 1: Insert into the `products` table
  const productQuery = `
    INSERT INTO products 
    (product_name, product_abbreviation, package_name, policy_type, policy_period, 
    temporary_cn_min_time, temporary_cn_max_time, customer_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    productQuery,
    [
      product_name,
      product_abbreviation,
      package_name,
      policy_type,
      policy_period,
      temporary_cn_min_time,
      temporary_cn_max_time,
      customer_type,
    ],
    (err, productResult) => {
      if (err) {
        console.error("Error inserting product:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const productId = productResult.insertId;

      // If everything was successful, send the response
      res.status(201).json({
        message: "Product created successfully",
        productId: productId,
      });
    }
  );
});
// we are using nested connection query because when multiple queries are dependent on one another, we want them to go asynchronously. This synatx does that. This can be also done using javascript promises.
// I am passing a function in which if err then return else execute nested connection query

// We want to update all information for a particular product
router.put("/:productId", authMiddleware, (req, res) => {
  const {
    product_name,
    product_abbreviation,
    package_name,
    policy_type,
    policy_period,
    temporary_cn_min_time,
    temporary_cn_max_time,
    customer_type,
    peril_ids,
    manufacturer,
    model,
    imei_serial_number,
    cnic,
    receipt_of_purchase,
    warranty_card_picture,
    user_picture,
    bank_statement,
    ntn_number,
    generate_renewal,
    renewal_generation_frequency,
    renewal_generation_value,
    no_claim_discount,
    sum_insured_reduction,
    City,
    Age,
    Profession,
    IncomeCategory,
    Business_Type,
    Customer_Badge,
  } = req.body;

  const productId = req.params.productId;

  // Step 1: Update product record in `products` table
  const updateProductQuery = `
    UPDATE products 
    SET 
      product_name = ?, 
      product_abbreviation = ?, 
      package_name = ?, 
      policy_type = ?, 
      policy_period = ?, 
      temporary_cn_min_time = ?, 
      temporary_cn_max_time = ?, 
      customer_type = ? 
    WHERE product_id = ?
  `;

  connection.query(
    updateProductQuery,
    [
      product_name,
      product_abbreviation,
      package_name,
      policy_type,
      policy_period,
      temporary_cn_min_time,
      temporary_cn_max_time,
      customer_type,
      productId,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating product:", err);
        return res
          .status(500)
          .json({ error: "Database error updating product" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Proceed with related table updates
      checkAndUpdateAssetDetails();
    }
  );

  // Helper functions for Asset Details
  function checkAndUpdateAssetDetails() {
    const checkAssetDetailsQuery = `SELECT * FROM product_asset_details WHERE product_id = ?`;
    connection.query(checkAssetDetailsQuery, [productId], (err, result) => {
      if (err) {
        console.error("Error checking asset details:", err);
        return sendError("Database error checking asset details");
      }

      if (result.length === 0) {
        insertAssetDetails();
      } else {
        updateAssetDetails();
      }
    });
  }

  function insertAssetDetails() {
    const insertAssetDetailsQuery = `
      INSERT INTO product_asset_details (product_id, manufacturer, model, imei_serial_number)
      VALUES (?, ?, ?, ?)
    `;
    connection.query(
      insertAssetDetailsQuery,
      [productId, manufacturer, model, imei_serial_number],
      (err) => {
        if (err) {
          console.error("Error inserting asset details:", err);
          return sendError("Database error inserting asset details");
        }
        checkAndUpdateDocumentUploads();
      }
    );
  }

  function updateAssetDetails() {
    const updateAssetDetailsQuery = `
      UPDATE product_asset_details 
      SET manufacturer = ?, model = ?, imei_serial_number = ? 
      WHERE product_id = ?
    `;
    connection.query(
      updateAssetDetailsQuery,
      [manufacturer, model, imei_serial_number, productId],
      (err) => {
        if (err) {
          console.error("Error updating asset details:", err);
          return sendError("Database error updating asset details");
        }
        checkAndUpdateDocumentUploads();
      }
    );
  }

  // Document Uploads
  function checkAndUpdateDocumentUploads() {
    const checkDocumentsQuery = `SELECT * FROM product_document_uploads WHERE product_id = ?`;
    connection.query(checkDocumentsQuery, [productId], (err, result) => {
      if (err) {
        console.error("Error checking document uploads:", err);
        return sendError("Database error checking document uploads");
      }

      if (result.length === 0) {
        insertDocumentUploads();
      } else {
        updateDocumentUploads();
      }
    });
  }

  function insertDocumentUploads() {
    const insertDocumentUploadsQuery = `
      INSERT INTO product_document_uploads 
      (product_id, cnic, receipt_of_purchase, warranty_card_picture, user_picture, bank_statement, ntn_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    connection.query(
      insertDocumentUploadsQuery,
      [
        productId,
        cnic,
        receipt_of_purchase,
        warranty_card_picture,
        user_picture,
        bank_statement,
        ntn_number,
      ],
      (err) => {
        if (err) {
          console.error("Error inserting document uploads:", err);
          return sendError("Database error inserting document uploads");
        }
        checkAndUpdateRenewalRules();
      }
    );
  }

  function updateDocumentUploads() {
    const updateDocumentUploadsQuery = `
      UPDATE product_document_uploads 
      SET 
        cnic = ?, 
        receipt_of_purchase = ?, 
        warranty_card_picture = ?, 
        user_picture = ?, 
        bank_statement = ?, 
        ntn_number = ? 
      WHERE product_id = ?
    `;
    connection.query(
      updateDocumentUploadsQuery,
      [
        cnic,
        receipt_of_purchase,
        warranty_card_picture,
        user_picture,
        bank_statement,
        ntn_number,
        productId,
      ],
      (err) => {
        if (err) {
          console.error("Error updating document uploads:", err);
          return sendError("Database error updating document uploads");
        }
        checkAndUpdateRenewalRules();
      }
    );
  }

  // Renewal Rules
  function checkAndUpdateRenewalRules() {
    const checkRenewalRulesQuery = `SELECT * FROM product_renewal_rules WHERE product_id = ?`;
    connection.query(checkRenewalRulesQuery, [productId], (err, result) => {
      if (err) {
        console.error("Error checking renewal rules:", err);
        return sendError("Database error checking renewal rules");
      }

      if (result.length === 0) {
        insertRenewalRules();
      } else {
        updateRenewalRules();
      }
    });
  }

  function insertRenewalRules() {
    const insertRenewalRulesQuery = `
      INSERT INTO product_renewal_rules 
      (product_id, generate_renewal, renewal_generation_frequency, renewal_generation_value, 
      no_claim_discount, sum_insured_reduction)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(
      insertRenewalRulesQuery,
      [
        productId,
        generate_renewal,
        renewal_generation_frequency,
        renewal_generation_value,
        no_claim_discount,
        sum_insured_reduction,
      ],
      (err) => {
        if (err) {
          console.error("Error inserting renewal rules:", err);
          return sendError("Database error inserting renewal rules");
        }
        checkAndUpdateCustomerRules();
      }
    );
  }

  function updateRenewalRules() {
    const updateRenewalRulesQuery = `
      UPDATE product_renewal_rules 
      SET 
        generate_renewal = ?, 
        renewal_generation_frequency = ?, 
        renewal_generation_value = ?, 
        no_claim_discount = ?, 
        sum_insured_reduction = ? 
      WHERE product_id = ?
    `;
    connection.query(
      updateRenewalRulesQuery,
      [
        generate_renewal,
        renewal_generation_frequency,
        renewal_generation_value,
        no_claim_discount,
        sum_insured_reduction,
        productId,
      ],
      (err) => {
        if (err) {
          console.error("Error updating renewal rules:", err);
          return sendError("Database error updating renewal rules");
        }
        checkAndUpdateCustomerRules();
      }
    );
  }

  // Customer Rules
  function checkAndUpdateCustomerRules() {
    const checkCustomerRulesQuery = `SELECT * FROM product_customer_rules WHERE product_id = ?`;
    connection.query(checkCustomerRulesQuery, [productId], (err, result) => {
      if (err) {
        console.error("Error checking customer rules:", err);
        return sendError("Database error checking customer rules");
      }

      if (result.length === 0) {
        insertCustomerRules();
      } else {
        updateCustomerRules();
      }
    });
  }

  function insertCustomerRules() {
    const insertCustomerRulesQuery = `
      INSERT INTO product_customer_rules 
      (product_id, City, Age, Profession, IncomeCategory, Business_Type, Customer_Badge)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    connection.query(
      insertCustomerRulesQuery,
      [
        productId,
        City,
        Age,
        Profession,
        IncomeCategory,
        Business_Type,
        Customer_Badge,
      ],
      (err) => {
        if (err) {
          console.error("Error inserting customer rules:", err);
          return sendError("Database error inserting customer rules");
        }
        checkAndUpdatePerils();
      }
    );
  }

  function updateCustomerRules() {
    const updateCustomerRulesQuery = `
      UPDATE product_customer_rules 
      SET 
        City = ?, 
        Age = ?, 
        Profession = ?, 
        IncomeCategory = ?, 
        Business_Type = ?, 
        Customer_Badge = ? 
      WHERE product_id = ?
    `;
    connection.query(
      updateCustomerRulesQuery,
      [
        City,
        Age,
        Profession,
        IncomeCategory,
        Business_Type,
        Customer_Badge,
        productId,
      ],
      (err) => {
        if (err) {
          console.error("Error updating customer rules:", err);
          return sendError("Database error updating customer rules");
        }
        checkAndUpdatePerils();
      }
    );
  }

  // Perils
  function checkAndUpdatePerils() {
    const deletePerilsQuery = `DELETE FROM product_perils WHERE product_id = ?`;
    connection.query(deletePerilsQuery, [productId], (err) => {
      if (err) {
        console.error("Error deleting perils:", err);
        return sendError("Database error deleting perils");
      }
      insertPerils();
    });
  }

  function insertPerils() {
    const perilAssociations = peril_ids.map((peril_id) => [
      productId,
      peril_id,
    ]);
    if (perilAssociations.length === 0) {
      return finalizeResponse();
    }

    const insertPerilsQuery = `INSERT INTO product_perils (product_id, peril_id) VALUES ?`;
    connection.query(insertPerilsQuery, [perilAssociations], (err) => {
      if (err) {
        console.error("Error inserting perils:", err);
        return sendError("Database error inserting perils");
      }
      finalizeResponse();
    });
  }

  // Finalize Response
  function finalizeResponse() {
    res.status(200).json({
      message: "Product and related information updated successfully",
      productId: productId,
    });
  }

  function sendError(message) {
    res.status(500).json({ error: message });
  }
});

// We want to delete a product
router.delete("/:productId", authMiddleware, (req, res) => {
  // Extract product_id from the request params
  const { productId } = req.params;

  // Step 1: Check if the product exists
  const checkProductExistsQuery = `SELECT product_id FROM products WHERE product_id = ?`;

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
    const deleteProductQuery = `DELETE FROM products WHERE product_id = ?`;

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
