const express = require("express");

const cors = require("cors");

const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const invoiceRoutes = require("./routes/invoiceRoutes");

const adminRoutes = require("./routes/adminRoutes");

const stockRoutes = require("./routes/stockRoutes");

const app = express();

/* =========================
   DATABASE
========================= */

connectDB();

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: "https://ki-vix-management.netlify.app",
    credentials: true,
  }),
);

app.use(express.json());

/* =========================
   ROUTES
========================= */

app.use("/api/invoices", invoiceRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/stocks", stockRoutes);

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("Invoice API Running 🚀");
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
