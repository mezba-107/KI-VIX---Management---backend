const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    investment: {
      type: Number,
      default: 0,
    },

    expense: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

partnerSchema.virtual("balance").get(function () {
  return this.investment - this.expense;
});

module.exports = mongoose.model("Partner", partnerSchema);
