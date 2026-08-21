const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

/* controllers */
const {
  getAllAdmins,
  makePartner,
  removePartner,
  removeAdmin,
  getFinanceAdmins,
  changeRole,
  resetPassword,
} = require("../controllers/adminManagementController");

// GET ALL ADMINS
router.get("/all-admins", adminAuth, getAllAdmins);

// MAKE PARTNER
router.put("/make-partner/:id", adminAuth, makePartner);

// REMOVE PARTNER
router.put("/remove-partner/:id", adminAuth, removePartner);

// REMOVE ADMIN
router.delete("/remove-admin/:id", adminAuth, removeAdmin);

// CHANGE ROLE
router.put("/change-role/:id", adminAuth, changeRole);

// RESET PASSWORD
router.put("/reset-password/:id", adminAuth, resetPassword);

// FINANCE ADMINS
router.get("/finance", adminAuth, getFinanceAdmins);

// Delt users
router.delete("/remove-admin/:id", adminAuth, removeAdmin);

module.exports = router;
