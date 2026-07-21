const express = require("express");

const router = express.Router();

const Admin = require("../models/Admin");
const adminAuth = require("../middleware/adminAuth");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");

/* =========================
   DEPOSIT
========================= */

router.post("/deposit", adminAuth, async (req, res) => {
  try {
    const { adminId, amount } = req.body;

    if (!adminId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and Amount are required",
      });
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    admin.investment += Number(amount);

    admin.history.push({
      type: "Deposit",
      amount: Number(amount),
      addedBy: req.admin.id,
    });

    await admin.save();

    res.json({
      success: true,
      message: "Deposit Added Successfully",
      admin,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   EXPENSE
========================= */

router.post("/expense", adminAuth, async (req, res) => {
  try {
    const { adminId, amount } = req.body;

    if (!adminId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and Amount are required",
      });
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.investment < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Investment",
      });
    }

    admin.investment -= Number(amount);
    admin.expense += Number(amount);

    admin.history.push({
      type: "Expense",
      amount: Number(amount),
      addedBy: req.admin.id,
    });

    await admin.save();

    res.json({
      success: true,
      message: "Expense Added Successfully",
      admin,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   UPDATE INVESTMENT
========================= */

router.put("/investment", adminAuth, async (req, res) => {
  try {
    const { adminId, amount } = req.body;

    if (!adminId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and Amount are required",
      });
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const oldAmount = admin.investment;
    const newAmount = Number(amount);

    admin.investment = newAmount;

    admin.history.push({
      type: "Investment Edited",
      amount: newAmount,
      oldAmount,
      newAmount,
      addedBy: req.admin.id,
    });

    await admin.save();

    res.json({
      success: true,
      message: "Investment Updated Successfully",
      admin,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   DELETE PARTNER INVESTMENT
========================= */

router.put("/delete-partner", adminAuth, async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Investment, Expense এবং History Delete হবে
    admin.investment = 0;
    admin.expense = 0;
    admin.history = [];

    await admin.save();

    res.json({
      success: true,
      message: "Partner Investment Deleted Successfully",
      admin,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   GET PARTNER HISTORY
========================= */

router.get("/history/:adminId", adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.adminId).populate(
      "history.addedBy",
      "name email",
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      investment: admin.investment,
      expense: admin.expense,
      history: admin.history.sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      ),
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   ADD COMPANY EXPENSE
========================= */

router.post("/expenses", adminAuth, async (req, res) => {
  try {
    console.log(req.admin);
    const { date, category, description, paidBy, amount } = req.body;

    if (!date || !category || !description || !paidBy || !amount) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const admin = await Admin.findById(paidBy);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    const expense = await Expense.create({
      date,
      category,
      description,
      paidBy,
      addedBy: req.admin.id,
      amount: Number(amount),
    });

    const newExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("addedBy", "name email");

    res.json({
      success: true,
      message: "Expense Added Successfully",
      expense: newExpense,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   GET ALL COMPANY EXPENSES
========================= */

router.get("/expenses", adminAuth, async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("paidBy", "name email")
      .populate("addedBy", "name email")
      .sort({ date: -1 });

    res.json({
      success: true,
      expenses,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   UPDATE COMPANY EXPENSE
========================= */

router.put("/expenses/:id", adminAuth, async (req, res) => {
  try {
    const { date, category, description, paidBy, amount } = req.body;

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const admin = await Admin.findById(paidBy);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    expense.date = date;
    expense.category = category;
    expense.description = description;
    expense.paidBy = paidBy;
    expense.amount = Number(amount);

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", "name email")
      .populate("addedBy", "name email");

    res.json({
      success: true,
      message: "Expense Updated Successfully",
      expense: updatedExpense,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   DELETE COMPANY EXPENSE
========================= */

router.delete("/expenses/:id", adminAuth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Expense Deleted Successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* =========================
   GET TOTAL EARN (Invoice Paid)
========================= */

router.get("/total-earn", adminAuth, async (req, res) => {
  try {
    const invoices = await Invoice.find({
      status: { $ne: "cancelled" },
    });

    const totalEarn = invoices.reduce((sum, invoice) => {
      return sum + Number(invoice.paid || 0);
    }, 0);

    res.json({
      success: true,
      totalEarn,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

/* ==========================
   DONE EXPENSE
========================== */

router.put("/expenses/:id/done", adminAuth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.json({
        success: false,
        message: "Expense not found",
      });
    }

    if (expense.done) {
      return res.json({
        success: false,
        message: "Expense already completed",
      });
    }

    // সব partner বের করো
    const partners = await Admin.find({
      investment: { $gt: 0 },
    });

    // যাদের Balance > 0
    const activePartners = partners.filter((p) => {
      return p.investment - p.expense > 0;
    });

    if (activePartners.length === 0) {
      return res.json({
        success: false,
        message: "No active partner found.",
      });
    }

    const share = expense.amount / activePartners.length;

    for (const partner of activePartners) {
      // Partner card থেকে টাকা কমবে
      partner.investment -= share;

      // History এর জন্য expense বাড়বে
      partner.expense += share;

      partner.history.push({
        type: "Expense",
        amount: share,
        addedBy: req.admin.id,
      });

      await partner.save();
    }

    expense.done = true;
    expense.doneAt = new Date();
    expense.doneBy = req.admin._id;

    await expense.save();

    res.json({
      success: true,
      message: "Expense completed successfully.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;
