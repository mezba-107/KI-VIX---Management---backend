const express = require("express");

const router = express.Router();

const Admin = require("../models/Admin");
const adminAuth = require("../middleware/adminAuth");
const Expense = require("../models/Expense");
const Invoice = require("../models/Invoice");
const requireRole = require("../middleware/requireRole");
const Notification = require("../models/Notification");

/* =========================
   DEPOSIT
========================= */

router.post("/deposit", adminAuth, async (req, res) => {
  try {
    const currentAdmin = await Admin.findById(req.admin.id);

    if (
      !currentAdmin ||
      !["Super Admin", "Admin"].includes(currentAdmin.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin and Admin can add deposit",
      });
    }

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

    const loginAdmin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "finance",
      variant: "green",
      icon: "fa-money-bill-wave",

      title: "Partner Deposit Added",

      message: `৳${amount} deposited to ${admin.name || admin.email}`,

      details: [
        {
          label: "Partner",
          value: admin.name || admin.email,
        },
        {
          label: "Deposit Amount",
          value: `৳${amount}`,
        },
        {
          label: "Current Investment",
          value: `৳${admin.investment}`,
        },
        {
          label: "Added By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

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
   Expense
========================= */

router.post("/expense", adminAuth, async (req, res) => {
  try {
    const loginAdmin = await Admin.findById(req.admin.id);

    if (!loginAdmin || !["Super Admin", "Admin"].includes(loginAdmin.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin and Admin can add expense",
      });
    }

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

    await Notification.create({
      category: "finance",
      variant: "purple",
      icon: "fa-money-bill-transfer",

      title: "Partner Expense Added",

      message: `৳${amount} expense added for ${admin.name || admin.email}`,

      details: [
        {
          label: "Partner",
          value: admin.name || admin.email,
        },
        {
          label: "Expense Amount",
          value: `৳${amount}`,
        },
        {
          label: "Current Expense",
          value: `৳${admin.expense}`,
        },
        {
          label: "Remaining Investment",
          value: `৳${admin.investment}`,
        },
        {
          label: "Added By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

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
    const currentAdmin = await Admin.findById(req.admin.id);

    if (
      !currentAdmin ||
      !["Super Admin", "Admin"].includes(currentAdmin.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin and Admin can update investment",
      });
    }

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

    const loginAdmin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "finance",
      variant: "blue",
      icon: "fa-pen-to-square",

      title: "Partner Investment Updated",

      message: `${admin.name || admin.email}'s investment has been updated`,

      details: [
        {
          label: "Partner",
          value: admin.name || admin.email,
        },
        {
          label: "Previous Amount",
          value: `৳${oldAmount}`,
        },
        {
          label: "New Amount",
          value: `৳${newAmount}`,
        },
        {
          label: "Updated By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

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
    const currentAdmin = await Admin.findById(req.admin.id);

    if (
      !currentAdmin ||
      !["Super Admin", "Admin"].includes(currentAdmin.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin and Admin can delete partner investment",
      });
    }

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

    const oldInvestment = admin.investment;
    const oldExpense = admin.expense;

    admin.investment = 0;
    admin.expense = 0;
    admin.history = [];

    await admin.save();

    const loginAdmin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "finance",
      variant: "red",
      icon: "fa-trash",

      title: "Partner Investment Deleted",

      message: `${admin.name || admin.email}'s partner account has been cleared`,

      details: [
        {
          label: "Partner",
          value: admin.name || admin.email,
        },
        {
          label: "Investment Removed",
          value: `৳${oldInvestment}`,
        },
        {
          label: "Expense Removed",
          value: `৳${oldExpense}`,
        },
        {
          label: "Deleted By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

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

    const loginAdmin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "finance",
      variant: "orange",
      icon: "fa-file-invoice-dollar",

      title: "Company Expense Added",

      message: `৳${amount} expense added for ${category}`,

      details: [
        {
          label: "Category",
          value: category,
        },
        {
          label: "Amount",
          value: `৳${amount}`,
        },
        {
          label: "Description",
          value: description,
        },
        {
          label: "Paid By",
          value: admin.name || admin.email,
        },
        {
          label: "Added By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Date",
          value: date,
        },
      ],
    });

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

    /* =========================
       OLD VALUES
    ========================= */

    const oldDate = expense.date;

    const oldCategory = expense.category;

    const oldDescription = expense.description;

    const oldPaidBy = expense.paidBy;

    const oldAmount = expense.amount;

    /* =========================
       NEW VALUES
    ========================= */

    const newDate = date;

    const newCategory = category;

    const newDescription = description;

    const newPaidBy = paidBy;

    const newAmount = Number(amount);

    /* =========================
       SAVE EDIT HISTORY
    ========================= */

    expense.editHistory.push({
      oldDate: oldDate,

      newDate: newDate,

      oldCategory: oldCategory,

      newCategory: newCategory,

      oldDescription: oldDescription,

      newDescription: newDescription,

      oldPaidBy: oldPaidBy,

      newPaidBy: newPaidBy,

      oldAmount: oldAmount,

      newAmount: newAmount,

      editedBy: req.admin.id,

      editedAt: new Date(),
    });

    /* =========================
       UPDATE EXPENSE
    ========================= */

    expense.date = date;

    expense.category = category;

    expense.description = description;

    expense.paidBy = paidBy;

    expense.amount = Number(amount);

    await expense.save();

    const loginAdmin = await Admin.findById(req.admin.id);

    /* =========================
       GET OLD PAID BY
    ========================= */

    const oldPaidAdmin = await Admin.findById(oldPaidBy);

    /* =========================
       NOTIFICATION
    ========================= */

    await Notification.create({
      category: "finance",

      variant: "blue",

      icon: "fa-pen-to-square",

      title: "Company Expense Updated",

      message: `৳${oldAmount} expense updated to ৳${newAmount}`,

      details: [
        {
          label: "Previous Date",
          value: oldDate ? new Date(oldDate).toLocaleDateString() : "N/A",
        },
        {
          label: "New Date",
          value: newDate ? new Date(newDate).toLocaleDateString() : "N/A",
        },
        {
          label: "Previous Category",
          value: oldCategory,
        },
        {
          label: "New Category",
          value: newCategory,
        },
        {
          label: "Previous Amount",
          value: `৳${oldAmount}`,
        },
        {
          label: "New Amount",
          value: `৳${newAmount}`,
        },
        {
          label: "Previous Description",
          value: oldDescription,
        },
        {
          label: "New Description",
          value: newDescription,
        },
        {
          label: "Previous Paid By",
          value: oldPaidAdmin?.name || oldPaidAdmin?.email || "Unknown",
        },
        {
          label: "New Paid By",
          value: admin.name || admin.email,
        },
        {
          label: "Updated By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

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
    const currentAdmin = await Admin.findById(req.admin.id);

    if (
      !currentAdmin ||
      !["Super Admin", "Admin"].includes(currentAdmin.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin and Admin can delete expenses",
      });
    }

    const expense = await Expense.findById(req.params.id);

    const paidPartner = await Admin.findById(expense.paidBy);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const loginAdmin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "finance",
      variant: "red",
      icon: "fa-trash",

      title: "Company Expense Deleted",

      message: `৳${expense.amount} expense has been deleted`,

      details: [
        {
          label: "Category",
          value: expense.category,
        },
        {
          label: "Amount",
          value: `৳${expense.amount}`,
        },
        {
          label: "Description",
          value: expense.description || "-",
        },
        {
          label: "Paid By",
          value: paidPartner?.name || paidPartner?.email || "Unknown",
        },
        {
          label: "Deleted By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

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

    const loginAdmin = await Admin.findById(req.admin.id);

    await Notification.create({
      category: "finance",
      variant: "green",
      icon: "fa-circle-check",

      title: "Company Expense Completed",

      message: `৳${expense.amount} expense has been completed`,

      details: [
        {
          label: "Category",
          value: expense.category,
        },
        {
          label: "Amount",
          value: `৳${expense.amount}`,
        },
        {
          label: "Description",
          value: expense.description || "-",
        },
        {
          label: "Partners Charged",
          value: `${activePartners.length}`,
        },
        {
          label: "Completed By",
          value: loginAdmin.name || loginAdmin.email,
        },
        {
          label: "Completed Date",
          value: new Date().toLocaleDateString(),
        },
      ],
    });

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
