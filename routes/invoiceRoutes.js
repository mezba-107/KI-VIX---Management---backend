const express = require("express");

const router = express.Router();

const Invoice = require("../models/Invoice");

const Admin = require("../models/Admin");

const adminAuth = require("../middleware/adminAuth");

const Counter = require("../models/Counter");
/* =========================
   CREATE INVOICE
========================= */

router.post("/", adminAuth, async (req, res) => {
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

    res.status(201).json(savedInvoice);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

/* =========================
   GET ALL INVOICES
========================= */

router.get("/", async (req, res) => {
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
});

/* =========================
   GET SINGLE INVOICE
========================= */

router.get("/:id", async (req, res) => {
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
});

/* =========================
   DELETE INVOICE
========================= */

router.delete("/:id", async (req, res) => {
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
});

/* =========================
    UPDATE INVOICE
========================= */

router.put("/:id", async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({
      message: "Failed To Update Invoice",
    });
  }
});

module.exports = router;
