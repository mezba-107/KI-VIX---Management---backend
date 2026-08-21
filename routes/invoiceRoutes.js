const express = require("express");

const router = express.Router();

const cron = require("node-cron");

const Invoice = require("../models/Invoice");

const Admin = require("../models/Admin");

const adminAuth = require("../middleware/adminAuth");

const requireRole = require("../middleware/requireRole");

const Notification = require("../models/Notification");

const Counter = require("../models/Counter");
/* =========================
   CREATE INVOICE
========================= */
router.post(
  "/",
  adminAuth,
  requireRole(["Super Admin", "Admin", "Mod"]),
  async (req, res) => {
    try {
      console.log(req.body);

      const admin = await Admin.findById(req.admin.id);

      // Auto Increment Invoice Number
      const counter = await Counter.findOneAndUpdate(
        { id: "invoiceNo" },
        { $inc: { seq: 1 } },
        {
          new: true,
          upsert: true,
        },
      );

      // Current Year
      const year = new Date().getFullYear();

      const invoice = new Invoice({
        ...req.body,
        invoiceNo: `INV-${year}-${counter.seq}`,
        createdBy: admin.name || admin.email,
      });

      const savedInvoice = await invoice.save();

      // =========================
      // CREATE NOTIFICATION
      // =========================
      await Notification.create({
        category: "dashboard",
        variant: "orange",
        icon: "fa-file-invoice",

        title: "New Invoice Added",

        message: `Invoice #${savedInvoice.invoiceNo} has been created successfully`,

        details: [
          {
            label: "Invoice ID",
            value: savedInvoice.invoiceNo,
          },
          {
            label: "Customer",
            value: savedInvoice.customerName,
          },
          {
            label: "Created By",
            value: admin.name || admin.email,
          },
          {
            label: "Total Amount",
            value: `৳${savedInvoice.total}`,
          },
          {
            label: "Due Amount",
            value: `৳${savedInvoice.due}`,
          },
          {
            label: "Date",
            value: new Date().toLocaleDateString(),
          },
          {
            label: "Time",
            value: new Date().toLocaleTimeString(),
          },
        ],
      });

      res.status(201).json(savedInvoice);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        message: error.message,
      });
    }
  },
);
/* =========================
   GET ALL INVOICES
========================= */

router.get(
  "/",
  adminAuth,
  requireRole(["Super Admin", "Admin", "Mod"]),
  async (req, res) => {
    try {
      const invoices = await Invoice.find().sort({
        createdAt: -1,
      });

      res.json(invoices);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },
);

/* =========================
   GET SINGLE INVOICE
========================= */

router.get(
  "/:id",
  adminAuth,
  requireRole(["Super Admin", "Admin", "Mod"]),
  async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },
);

/* =========================
   DELETE INVOICE
========================= */

router.delete(
  "/:id",
  adminAuth,
  requireRole(["Super Admin", "Admin"]),
  async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      await invoice.deleteOne();

      res.json({
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },
);

/* =========================
   CANCEL INVOICE
========================= */

router.put(
  "/cancel/:id",
  adminAuth,
  requireRole(["Super Admin", "Admin", "Mod"]),
  async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      if (invoice.status === "cancelled") {
        return res.status(400).json({
          message: "Invoice already cancelled",
        });
      }

      invoice.status = "cancelled";

      await invoice.save();

      const admin = await Admin.findById(req.admin.id);

      await Notification.create({
        category: "dashboard",
        variant: "red",
        icon: "fa-ban",

        title: "Invoice Cancelled",

        message: `Invoice #${invoice.invoiceNo} has been cancelled`,

        details: [
          {
            label: "Invoice ID",
            value: invoice.invoiceNo,
          },
          {
            label: "Customer",
            value: invoice.customerName,
          },
          {
            label: "Cancelled By",
            value: admin.name || admin.email,
          },
          {
            label: "Total Amount",
            value: `৳${invoice.total}`,
          },
          {
            label: "Status",
            value: "Cancelled",
          },
          {
            label: "Date",
            value: new Date().toLocaleDateString(),
          },
          {
            label: "Time",
            value: new Date().toLocaleTimeString(),
          },
        ],
      });

      res.json({
        message: "Invoice cancelled successfully",
        invoice,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  },
);

/* =========================
    UPDATE INVOICE
========================= */

router.put(
  "/:id",
  adminAuth,
  requireRole(["Super Admin", "Admin", "Mod"]),
  async (req, res) => {
    try {
      const oldInvoice = await Invoice.findById(req.params.id);

      const updatedInvoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true },
      );

      if (oldInvoice.due > 0 && updatedInvoice.due === 0) {
        const admin = await Admin.findById(req.admin.id);

        await Notification.create({
          category: "dashboard",
          variant: "green",
          icon: "fa-circle-check",

          title: "Invoice Paid",

          message: `Invoice #${updatedInvoice.invoiceNo} has been paid`,

          details: [
            {
              label: "Invoice ID",
              value: updatedInvoice.invoiceNo,
            },
            {
              label: "Customer",
              value: updatedInvoice.customerName,
            },
            {
              label: "Paid By",
              value: admin.name || admin.email,
            },
            {
              label: "Total Amount",
              value: `৳${updatedInvoice.total}`,
            },
            {
              label: "Due Amount",
              value: "৳0",
            },
            {
              label: "Date",
              value: new Date().toLocaleDateString(),
            },
            {
              label: "Time",
              value: new Date().toLocaleTimeString(),
            },
          ],
        });
      }

      res.json(updatedInvoice);
    } catch (error) {
      res.status(500).json({
        message: "Failed To Update Invoice",
      });
    }
  },
);

module.exports = router;
