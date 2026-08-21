const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const router = express.Router();

const {
  getNotifications,
  createNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

// getnotification
router.get("/", adminAuth, getNotifications);

// creatnotification
router.post("/", createNotification);

// delete notification by super Admin
router.delete("/delete-all", adminAuth, deleteAllNotifications);

module.exports = router;
