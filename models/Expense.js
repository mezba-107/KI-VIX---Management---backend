const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    done: {
      type: Boolean,
      default: false,
    },

    doneAt: {
      type: Date,
    },

    doneBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    /* =========================
       EDIT HISTORY
    ========================= */

    editHistory: [
      {
        oldDate: {
          type: Date,
        },

        newDate: {
          type: Date,
        },

        oldCategory: {
          type: String,
        },

        newCategory: {
          type: String,
        },

        oldDescription: {
          type: String,
        },

        newDescription: {
          type: String,
        },

        oldPaidBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },

        newPaidBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },

        oldAmount: {
          type: Number,
        },

        newAmount: {
          type: Number,
        },

        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },

        editedAt: {
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

module.exports = mongoose.model("Expense", expenseSchema);
