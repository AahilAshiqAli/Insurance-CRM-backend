const connection = require('./config/database'); // Import karnay kayliay connection

// Example query
connection.query('SELECT * FROM customers', (err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    return;
  }
  console.log('Query results:', results);
});
