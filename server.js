require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const policiesRoutes = require("./routes/policiesRoutes.js");
const claimsRoutes = require("./routes/claimsRoutes");
const productRoutes = require("./routes/productRoutes");
const perilRoutes = require("./routes/perilRoutes");
const riskRoutes = require("./routes/riskRoutes"); // Correct the variable name here
const dashboardRoutes = require("./routes/dashboardRoutes"); // Correct the variable name here

const app = express();

app.use(
  cors({
    origin: "http://localhost:3001", // Frontend URL
  })
);

// Middleware
app.use(bodyParser.json());

// Authentication Routes
app.use("/api/auth", authRoutes);

// Customer Routes
app.use("/api/customers", customerRoutes);

// Policies Routes (Protected)
app.use("/api/policies", policiesRoutes);

// Claims Routes (Protected)
app.use("/api/claims", claimsRoutes);

// Product Routes (Protected)
app.use("/api/product", productRoutes);

// Peril Routes (Protected)
app.use("/api/perils", perilRoutes);

// Risk Routes (Protected)
app.use("/api/risk", riskRoutes); // Correct the variable name here

app.use("/api/dashboard", authMiddleware, dashboardRoutes);
// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
