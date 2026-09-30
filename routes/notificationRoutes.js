const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const router = express.Router();

const {
  getNotifications,
  createNotification,
  deleteAllNotifications,
  markNotificationRead,
} = require("../controllers/notificationController");

// getnotification
router.get("/", adminAuth, getNotifications);

// creatnotification
router.post("/", createNotification);

// mark a single notification as read (per logged-in admin only)
router.put("/:id/read", adminAuth, markNotificationRead);

// delete notification by super Admin
router.delete("/delete-all", adminAuth, deleteAllNotifications);

module.exports = router;
