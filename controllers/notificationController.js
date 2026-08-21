const Notification = require("../models/Notification");
const Admin = require("../models/Admin");

/* =========================
   GET ALL NOTIFICATIONS
========================= */

const getNotifications = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const notifications = await Notification.find({
      targetRoles: admin.role,
    }).sort({
      createdAt: -1,
    });
    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================
   CREATE NOTIFICATION
========================= */

const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE ALL NOTIFICATIONS
   SUPER ADMIN ONLY
========================= */

const deleteAllNotifications = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    if (admin.role !== "Super Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can delete all notifications",
      });
    }

    const result = await Notification.deleteMany({});

    res.json({
      success: true,
      message: "All notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE ALL NOTIFICATIONS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  deleteAllNotifications,
};
