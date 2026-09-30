const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    category: String,

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminRequest",
      default: null,
    },

    variant: String,
    icon: String,

    title: String,
    message: String,

    details: [
      {
        label: String,
        value: String,
      },
    ],

    actions: Object,

    status: String,

    read: {
      type: Boolean,
      default: false,
    },

    // যে যে Admin এই notification টা নিজের জন্য read করেছে (per-user read status)
    readBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],
      default: [],
    },

    targetRoles: {
      type: [String],
      default: ["Super Admin", "Admin", "Mod"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
