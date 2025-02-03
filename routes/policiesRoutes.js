const express = require("express");
const router = express.Router();
const connection = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = router;

router.get("/:policy_number", authMiddleware, (req, res) => {
  const { policy_number } = req.params;
  const query = `
    SELECT
      np.policy_number,
      np.license_type,
      np.device_type,
      c.first_name,
      c.last_name,
      c.phone_number,
      c.email,
      c.cnic,
      c.poc_name,
      c.poc_number,
      c.poc_cnic,
      c.address,
      c.office_address,
      c.relationship_with_customer,
      d.brand_name,
      d.device_model,
      d.device_serial_number,
      d.purchase_date,
      d.device_value,
      d.device_condition,
      d.warranty_status,
      np.product_id,
      np.inspector_name,
      np.inspector_phone,
      np.inspector_location,
      np.remarks_ceo,
      np.remarks_coo,
      np.created_at
    FROM
      new_policies np
    LEFT JOIN
      customers c ON np.customer_id = c.customer_id
    LEFT JOIN
      devices d ON np.device_id = d.device_id
    WHERE
      np.policy_id = ?
  `;

  connection.query(query, [policy_number], (err, result) => {
    if (err) {
      console.error("Error retrieving policy:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.json(result); // Returning the result for the policy
  });
});

router.put("/:policy_id", authMiddleware, (req, res) => {
  const {
    license_type,
    device_type,
    first_name,
    last_name,
    phone_number,
    email,
    cnic,
    poc_name,
    poc_number,
    poc_cnic,
    relationship_with_customer,
    address,
    office_address,
    brand_name,
    device_model,
    device_serial_number,
    purchase_date,
    device_value,
    device_condition,
    warranty_status,
    product_id,
    quote_amount,
    inspector_name,
    inspector_location,
    inspector_phone,
    remarks_ceo,
    remarks_coo,
    policy_number,
    created_at,
  } = req.body;

  const { policy_id } = req.params;
  console.log("jhvjh");
  connection.query(
    "SELECT customer_id FROM customers WHERE cnic = ?",
    [cnic],
    (err, customerResults) => {
      if (err) return handleError(res, "Error checking customer existence");

      if (customerResults.length === 0) {
        insertCustomer();
      } else {
        const customer_id = customerResults[0].customer_id;
        console.log("Customer exists with ID:", customer_id);
        updateCustomer(customer_id); // Proceed to handle device
      }
    }
  );

  function insertCustomer() {
    const query = `
      INSERT INTO customers (
        first_name, last_name, email, phone_number, cnic,
        poc_name, poc_number, poc_cnic, relationship_with_customer, address, office_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      first_name,
      last_name,
      email,
      phone_number,
      cnic,
      poc_name,
      poc_number,
      poc_cnic,
      relationship_with_customer,
      address,
      office_address,
    ];

    connection.query(query, values, (err, result) => {
      if (err) {
        console.error("Error inserting customer:", {
          message: err.message,
          sqlMessage: err.sqlMessage,
          code: err.code,
          stack: err.stack, // Optional: full stack trace
        });
        return;
      }

      console.log("helo");
      const customer_id = result.insertId;
      console.log("Customer inserted with ID:", customer_id);
      handleDevice(customer_id); // Proceed to handle device
    });
  }

  function updateCustomer(customer_id) {
    const query = `
      UPDATE customers
      SET first_name = ?, last_name = ?, email = ?, phone_number = ?, poc_name= ?, poc_number = ?, poc_cnic = ?, relationship_with_customer = ?, address = ?, office_address = ?
      WHERE cnic = ?`;
    const values = [
      first_name,
      last_name,
      email,
      phone_number,
      poc_name,
      poc_number,
      poc_cnic,
      relationship_with_customer,
      address,
      office_address,
      cnic,
    ];

    connection.query(query, values, (err) => {
      if (err) return handleError(res, "Error updating customer");
      console.log("Customer updated successfully");
      handleDevice(customer_id); // Proceed to the next step
    });
  }

  // Step 2: Update or Insert Device
  function handleDevice(customer_id) {
    connection.query(
      "SELECT device_id FROM devices WHERE device_serial_number = ?",
      [device_serial_number],
      (err, deviceResults) => {
        if (err) return handleError(res, "Error checking device existence");

        if (deviceResults.length === 0) {
          insertDevice(customer_id);
        } else {
          const device_id = deviceResults[0].device_id;
          console.log("Device exists with ID:", device_id);
          updateDevice(customer_id, device_id); // Proceed to handle policy
        }
      }
    );
  }

  function insertDevice(customer_id) {
    const query = `
      INSERT INTO devices (
       brand_name, device_model, device_serial_number,
        purchase_date, device_value, device_condition, warranty_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      brand_name,
      device_model,
      device_serial_number,
      purchase_date,
      device_value,
      device_condition,
      warranty_status,
    ];

    connection.query(query, values, (err, result) => {
      if (err) {
        console.error("Error inserting device:", {
          message: err.message,
          sqlMessage: err.sqlMessage,
          code: err.code,
          stack: err.stack, // Optional: full stack trace
        });
        return;
      }
      const device_id = result.insertId;
      console.log("Device inserted with ID:", device_id);
      handlePolicy(customer_id, device_id); // Proceed to handle policy
    });
  }

  function updateDevice(customer_id, device_id) {
    const query = `
  UPDATE devices
  SET 
    brand_name = ?, 
    device_model = ?, 
    device_value = ?, 
    device_serial_number = ?, 
    device_condition = ?, 
    purchase_date = ?, 
    warranty_status = ?
  WHERE device_id = ?`;
    const values = [
      brand_name,
      device_model,
      device_value,
      device_serial_number,
      device_condition,
      purchase_date,
      warranty_status,
      device_id,
    ];

    connection.query(query, values, (err) => {
      if (err) {
        console.error("Error updated device:", {
          message: err.message,
          sqlMessage: err.sqlMessage,
          code: err.code,
          stack: err.stack, // Optional: full stack trace
        });
        return;
      }
      console.log("Device updated successfully");
      handlePolicy(customer_id, device_id); // Proceed to the next step
    });
  }

  // Step 3: Update or Insert Policy
  function handlePolicy(customer_id, device_id) {
    connection.query(
      "SELECT * FROM new_policies WHERE policy_id = ?",
      [policy_id],
      (err, policyResults) => {
        if (err) return handleError(res, "Error checking policy existence");

        if (policyResults.length === 0) {
          insertPolicy(customer_id, device_id);
        } else {
          const policy_id = policyResults[0].policy_id;
          console.log("Policy exists with ID:", policy_id);
          updatePolicy(customer_id, device_id);
        }
      }
    );
  }

  function insertPolicy(customer_id, device_id) {
    const query = `
      INSERT INTO new_policies (
        customer_id, device_id, product_id, policy_number,  license_type, device_type, quote_amount,
        inspector_name, inspector_location, inspector_phone, remarks_ceo, remarks_coo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      customer_id,
      device_id,
      product_id,
      policy_number,
      license_type,
      device_type,
      quote_amount,
      inspector_name,
      inspector_location,
      inspector_phone,
      remarks_ceo,
      remarks_coo,
    ];

    connection.query(query, values, (err) => {
      if (err) {
        console.error("Error inserting policy:", {
          message: err.message,
          sqlMessage: err.sqlMessage,
          code: err.code,
          stack: err.stack, // Optional: full stack trace
        });
        return;
      }
      console.log("Policy inserted successfully");
      finalizeResponse("Policy data successfully inserted");
    });
  }

  function updatePolicy(customer_id, device_id) {
    let query = `
    UPDATE new_policies
    SET
      customer_id = ?,
      device_id = ?,
      product_id = ?,
      policy_number = ?,
      license_type = ?,
      device_type = ?,
      quote_amount = ?,
      inspector_name = ?,
      inspector_location = ?,
      inspector_phone = ?,
      remarks_ceo = ?,
      remarks_coo = ?
  `;

    const values = [
      customer_id,
      device_id,
      product_id,
      policy_number,
      license_type,
      device_type,
      quote_amount,
      inspector_name,
      inspector_location,
      inspector_phone,
      remarks_ceo,
      remarks_coo,
      policy_id,
    ];

    // Check if `created_at` exists in the request body
    if (created_at) {
      // query += `, created_at = ?`;
      // const formattedDate = new Date()
      //   .toISOString()
      //   .replace("T", " ")
      //   .slice(0, 19);
      // values.push(formattedDate);
      query += `, created_at = NOW()`;
    }

    // Finalize the query
    query += ` WHERE policy_id = ?`;
    values.push(policy_id);

    // Execute the query
    connection.query(query, values, (err, result) => {
      if (err) {
        console.error("Error updating policy:", {
          message: err.message,
          sqlMessage: err.sqlMessage,
          code: err.code,
          stack: err.stack, // Optional: full stack trace
        });
        return res
          .status(500)
          .json({ error: "Failed to update policy", details: err.sqlMessage });
      }

      console.log("Policy data updated successfully:", policy_id);
      res.status(200).json({ message: "Policy data successfully updated" });
    });
  }

  // Utility Functions
  function handleError(res, message) {
    console.error(message);
    res.status(500).json({ error: message });
  }

  function finalizeResponse(message) {
    res.status(200).json({ message });
  }
});

router.post("/", authMiddleware, (req, res) => {
  const { license_type, device_type } = req.body;

  const policyQuery = `
  INSERT INTO new_policies 
  (license_type, device_type) 
  VALUES (?, ?)
`;

  connection.query(
    policyQuery,
    [license_type, device_type],
    (err, policyResult) => {
      if (err) {
        console.error("Error inserting policy:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // Retrieve the insertId (policy_id) from the result
      const policyId = policyResult.insertId;

      // Respond with success message and policy ID
      res.status(201).json({
        message: "Policy created successfully",
        policy_id: policyId,
      });
    }
  );
});

// Route to get all policies
router.get("", authMiddleware, (req, res) => {
  // SQL query to fetch all rows from the 'new_policies' table
  const query = "SELECT * FROM new_policies";

  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      // Handle database errors
      console.error("Error fetching policies:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Check if no policies were found
    if (results.length === 0) {
      return res.status(404).json({ message: "No policies found" });
    }

    // Send the results as a JSON response
    res.json(results);
  });
});

router.delete("/:policyId", authMiddleware, (req, res) => {
  // Extract policy_id from the request params
  const { policyId } = req.params;

  // Step 1: Check if the policy exists
  const checkPolicyExistsQuery = `SELECT policy_id FROM new_policies WHERE policy_id = ?`;

  connection.query(checkPolicyExistsQuery, [policyId], (err, result) => {
    if (err) {
      console.error("Error checking policy existence:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // If the policy does not exist, return a 404 error
    if (result.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    // Step 2: If the policy exists, proceed with deletion
    const deletePolicyQuery = `DELETE FROM new_policies WHERE policy_id = ?`;

    connection.query(deletePolicyQuery, [policyId], (err, result) => {
      if (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
          console.error(
            "Error: Cannot delete policy due to foreign key constraint"
          );
          return res.status(400).json({
            error:
              "This policy cannot be deleted because it is associated with existing records",
          });
        }
        console.error("Error deleting policy:", err);
        return res.status(500).json({ error: "Database error" });
      }

      // If deletion is successful
      res.status(200).json({
        message: "Policy deleted successfully",
      });
    });
  });
});

router.put("/remarks/:policy_id", authMiddleware, (req, res) => {
  const { remarks_ceo, remarks_coo } = req.body;

  const { policy_id } = req.params;

  const query = `
    UPDATE new_policies
    SET
      remarks_ceo = ?,
      remarks_coo = ?
    WHERE policy_id = ?`;

  const values = [remarks_ceo, remarks_coo, policy_id];

  connection.query(query, values, (err) => {
    if (err) {
      console.error("Error updating policy:", {
        message: err.message,
        sqlMessage: err.sqlMessage,
        code: err.code,
        stack: err.stack, // Optional: full stack trace
      });
    } else {
      console.log("Poliy data updated", policy_id);
      res.status(201).json({
        message: "Policy updated successfully",
      });
    }
  });
});
