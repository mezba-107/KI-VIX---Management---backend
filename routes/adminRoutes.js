const express = require("express");
const multer = require("multer");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
  login,
  getProfile,
  updateProfile,
  uploadProfile,
  changePassword,
  updateLastSeen,
  requestPasswordReset,
  approvePasswordReset,
  rejectPasswordReset,
} = require("../controllers/adminController");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// LOGIN
router.post("/login", login);

// FORGOT PASSWORD — request a reset (public, not logged in yet)
router.post("/forgot-password", requestPasswordReset);

// Super Admin approves/rejects a pending reset request
router.post("/approve-reset/:id", adminAuth, approvePasswordReset);
router.post("/reject-reset/:id", adminAuth, rejectPasswordReset);

// GET PROFILE
router.get("/profile", adminAuth, getProfile);

// Last Seen
router.put("/last-seen", adminAuth, updateLastSeen);

// UPDATE PROFILE
router.put("/profile", adminAuth, updateProfile);

// UPLOAD PROFILE IMAGE
router.post(
  "/upload-profile",
  adminAuth,
  upload.single("image"),
  uploadProfile,
);

// CHANGE PASSWORD
router.put("/change-password", adminAuth, changePassword);

module.exports = router;
