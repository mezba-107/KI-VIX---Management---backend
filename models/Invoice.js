const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    customerPhone: {
      type: String,
      required: true,
    },

    customerAddress: {
      type: String,
      required: true,
    },

    createdBy: {
      type: String,
      default: "",
    },

    products: [
      {
        productName: String,

        productSize: String,

        qty: Number,

        price: Number,

        amount: Number,
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
    },

    paid: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    due: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
