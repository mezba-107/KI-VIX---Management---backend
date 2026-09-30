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

    // readBy তে নিজের id আছে কিনা দেখে প্রত্যেকটা notification এর জন্য
    // এই admin এর জন্য আলাদা read/unread অবস্থা বসানো হলো
    const withOwnReadStatus = notifications.map((n) => {
      const obj = n.toObject();

      obj.read = (n.readBy || []).some(
        (readerId) => readerId.toString() === admin._id.toString(),
      );

      delete obj.readBy;

      return obj;
    });

    res.json({
      success: true,
      notifications: withOwnReadStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================
   MARK NOTIFICATION AS READ
   (শুধু এই admin এর জন্য read হবে, বাকিদের কাছে অপরিবর্তিত থাকবে)
========================= */

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const alreadyRead = (notification.readBy || []).some(
      (readerId) => readerId.toString() === req.admin.id,
    );

    if (!alreadyRead) {
      notification.readBy.push(req.admin.id);
      await notification.save();
    }

    res.json({
      success: true,
      message: "Notification marked as read",
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
  markNotificationRead,
};
