const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const invoiceRoutes = require("./routes/invoiceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminManagementRoutes = require("./routes/adminManagementRoutes");
const adminRequestRoutes = require("./routes/adminRequestRoutes");
const stockRoutes = require("./routes/stockRoutes");
const financeRoutes = require("./routes/financeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
require("./jobs/dueReminder");

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

app.use("/api/admin-management", adminManagementRoutes);

app.use("/api/admin-request", adminRequestRoutes);

app.use("/api/stocks", stockRoutes);

app.use("/api/finance", financeRoutes);

app.use("/api/notifications", notificationRoutes);

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
