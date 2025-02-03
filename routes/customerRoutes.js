const express = require('express');
const router = express.Router();
const connection = require('../config/database'); 
const authMiddleware = require('../middleware/authMiddleware');

//for Policy !!
router.post("/create", async (req, res) => {
  const { firstName, lastName, contactNumber, email, ntn, cnic, currentAddress, officeAddress } = req.body;

  try {
    const query = `
      INSERT INTO customers (first_name, last_name, email, phone_number,  cnic, address, office_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [firstName, lastName, contactNumber, email, ntn, cnic, currentAddress, officeAddress]);
    res.status(201).json({ message: "Customer created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// // Get for all customers data  //before authMiddleware
// router.get('/', (req, res) => {
//   connection.query('SELECT * FROM Customers', (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     res.json(results);
//   });
// });


// GET /customers - Retrieve all customers
router.get('/',  (req, res) => {
  const query = `SELECT * FROM Customers`;
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving customers:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Get for single customer identified by Id
router.get('/:id',authMiddleware,  (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM Customers WHERE customer_id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results[0]);
  });
});

//getting a customer with poc info for Polciy creation:
router.get('/:id', (req, res) => {
  const customerId = req.params.id;
  const query = `
      SELECT c.*, p.poc_name, p.poc_number, p.poc_cnic, p.relationship_with_customer
      FROM customers c
      LEFT JOIN poc_info p ON c.customer_id = p.customer_id
      WHERE c.customer_id = ?
  `;
  connection.query(query, [customerId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results[0]);
  });
});

// // Post for creating a new Customer before authMiddleware
// router.post('/', (req, res) => {
//   const { first_name, last_name, email, phone_number, cnic, address, office_address } = req.body;
//   const query = 'INSERT INTO Customers (first_name, last_name, email, phone, address, date_of_birth, policy_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
//   connection.query(query, [first_name, last_name, email, phone, address, date_of_birth, policy_id], (err, result) => {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     res.json({ message: 'Customer created', customer_id: result.insertId });
//   });
// });

// POST /customers - Add a new customer
router.post('/', authMiddleware, (req, res) => {
  const { first_name, last_name, email, phone_number, cnic, address, office_address } = req.body;

  const query = `
    INSERT INTO Customers (first_name, last_name, email, phone_number, cnic, address, office_address) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(query, [first_name, last_name, email, phone_number, cnic, address, office_address], (err, result) => {
    if (err) {
      console.error('Error adding customer:', err);
      return res.status(500).json({ error: 'Database insertion error' });
    }
    res.status(201).json({ message: 'Customer added successfully', customerId: result.insertId });
  });
});

// PUT /customers/:id - Update a customer
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone_number, cnic, address, office_address } = req.body;

  const query = `
    UPDATE Customers 
    SET first_name = ?, last_name = ?, email = ?, phone_number = ?, cnic = ?, address = ?, office_address = ?
    WHERE customer_id = ?
  `;

  connection.query(query, [first_name, last_name, email, phone_number, cnic, address, office_address, id], (err, result) => {
    if (err) {
      console.error('Error updating customer:', err);
      return res.status(500).json({ error: 'Database update error' });
    }
    res.json({ message: 'Customer updated successfully' });
  });
});

// DELETE /customers/:id - Delete a customer
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM Customers WHERE customer_id = ?`;

  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).json({ error: 'Database deletion error' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});


module.exports = router;
