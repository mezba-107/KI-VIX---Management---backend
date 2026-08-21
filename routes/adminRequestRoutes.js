const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
  requestAccess,
  getAllRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/adminRequestController");

/* =========================
   REQUEST ACCESS
========================= */

router.post("/request-access", requestAccess);

/* =========================
   GET ALL REQUESTS
========================= */

router.get("/all-requests", adminAuth, getAllRequests);

/* =========================
   APPROVE REQUEST
========================= */

router.post("/approve-request/:id", adminAuth, approveRequest);

/* =========================
   REJECT REQUEST
========================= */

router.post("/reject-request/:id", adminAuth, rejectRequest);

module.exports = router;
