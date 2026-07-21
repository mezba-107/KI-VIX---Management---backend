const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "Admin",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    investment: {
      type: Number,
      default: 0,
    },

    expense: {
      type: Number,
      default: 0,
    },

    history: [
      {
        type: {
          type: String,
        },

        amount: {
          type: Number,
        },

        oldAmount: {
          type: Number,
          default: null,
        },

        newAmount: {
          type: Number,
          default: null,
        },

        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },

        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Admin", adminSchema);
