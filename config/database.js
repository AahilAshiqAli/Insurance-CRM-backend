const mysql = require("mysql2");
require("dotenv").config();

let connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL:", err.message);
      setTimeout(handleDisconnect, 5000); // Reconnect after 5 sec
    } else {
      console.log("Connected to MySQL database");
    }
  });

  connection.on("error", (err) => {
    console.error("MySQL error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("Reconnecting to database...");
      handleDisconnect(); // Reconnect on lost connection
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = connection;

// const mysql = require("mysql2");
// require("dotenv").config(); // Load environment variables

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// connection.connect((err) => {
//   if (err) {
//     console.error("Error connecting to MySQL:", err.message);
//     return;
//   }
//   console.log("Connected to MySQL database");
// });

// module.exports = connection;
